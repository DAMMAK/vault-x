import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import {
  FILE_STATUS,
  QUEUES,
  REPLICATION_STATUS,
  RIAK_BUCKETS,
} from '@common/constants';
import { ReplicationPolicyDto } from './dto/replication-policy.dto';
import { ReplicationJob } from './interfaces/replication-job.interface';
import { FilesService } from '../files/files.service';
import { StorageService } from '../storage/storage.service';
import { HashUtil } from '@common/utils/hash.util';
import { File } from '../files/interfaces/file.interface';
import { StorageNode } from '../storage/interfaces/storage-node.interface';
import * as Riak from 'basho-riak-client';

@Injectable()
export class ReplicationService {
  private readonly logger = new Logger(ReplicationService.name);

  constructor(
    private configService: ConfigService,
    private filesService: FilesService,
    private storageService: StorageService,
    @InjectQueue(QUEUES.REPLICATION) private replicationQueue: Queue,
  ) {}

  async createReplicationPolicy(
    fileId: string,
    policyDto: ReplicationPolicyDto,
    userId: string,
  ): Promise<any> {
    // Verify file exists and belongs to user
    const file = await this.filesService.findOne(fileId, userId);

    // Verify all target regions exist
    await Promise.all(
      policyDto.targetRegions.map((regionName) =>
        this.storageService.getRegionByName(regionName),
      ),
    );

    // Update file with new regions
    const allRegions = Array.from(
      new Set([...file.regions, ...policyDto.targetRegions]),
    );

    await this.filesService.update(fileId, { regions: allRegions }, userId);

    // Queue replication jobs for new regions
    const newRegions = policyDto.targetRegions.filter(
      (region) =>
        !file.regions.includes(region) && !file.replicatedTo.includes(region),
    );

    if (newRegions.length > 0) {
      await this.queueReplicationJob({
        fileId,
        userId,
        sourceRegion: file.regions[0],
        targetRegions: newRegions,
      });
    }

    return {
      fileId,
      regions: allRegions,
      status:
        newRegions.length > 0
          ? REPLICATION_STATUS.PENDING
          : REPLICATION_STATUS.COMPLETED,
    };
  }

  async queueReplicationJob(job: ReplicationJob): Promise<void> {
    this.logger.log(
      `Queueing replication job for file ${job.fileId} to regions: ${job.targetRegions.join(', ')}`,
    );
    await this.replicationQueue.add(job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async processReplicationJob(job: ReplicationJob): Promise<void> {
    this.logger.log(
      `Processing replication job for file ${job.fileId} to regions: ${job.targetRegions.join(', ')}`,
    );

    try {
      // Get file data
      const file = await this.filesService.findOne(job.fileId, job.userId);

      // For each target region, replicate the file
      for (const targetRegion of job.targetRegions) {
        this.logger.log(
          `Replicating file ${job.fileId} to region: ${targetRegion}`,
        );

        // Find available storage nodes in the target region
        const targetNodes = await this.storageService.getStorageNodesInRegion(
          (await this.storageService.getRegionByName(targetRegion)).id,
        );

        // Select a target node with enough capacity
        const fileSize = file.size;
        const targetNode = targetNodes.find(
          (node) => node.available >= fileSize,
        );

        if (!targetNode) {
          throw new Error(
            `No storage node available in region ${targetRegion} with sufficient capacity`,
          );
        }

        // Retrieve file data
        const fileData = await this.filesService.assembleFileFromChunks(file);

        // Replicate each chunk to the target node
        await Promise.all(
          file.chunks.map(async (chunk) => {
            const chunkData = await this.filesService.getChunkData(chunk.id);
            // In a real implementation, this would use a specific storage mechanism
            // for the target node, which might involve network transfer,
            // cloud storage API, or other distribution method
            await this.saveChunkToNode(targetNode, chunk.id, chunkData);
          }),
        );

        // Update target node's available capacity
        targetNode.available -= fileSize;
        await this.storageService.saveStorageNode(targetNode);

        // Update file metadata to reflect successful replication
        const updatedFile = await this.filesService.updateReplicationMetadata(
          job.fileId,
          [targetRegion],
          job.userId,
        );

        this.logger.log(
          `File ${job.fileId} successfully replicated to region: ${targetRegion}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to replicate file ${job.fileId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getReplicationStatus(fileId: string, userId: string): Promise<any> {
    const file = await this.filesService.findOne(fileId, userId);

    const pendingRegions = file.regions.filter(
      (region) => !file.replicatedTo.includes(region),
    );

    const status =
      pendingRegions.length === 0
        ? REPLICATION_STATUS.COMPLETED
        : REPLICATION_STATUS.IN_PROGRESS;

    return {
      fileId,
      regions: file.regions,
      replicatedTo: file.replicatedTo,
      pendingRegions,
      status,
    };
  }

  private async saveChunkToNode(
    node: StorageNode,
    chunkId: string,
    chunkData: Buffer,
  ): Promise<void> {
    try {
      this.logger.log(
        `Attempting to save chunk ${chunkId} to node ${node.name}`,
      );

      // Create a new file entry for the chunk in the target region
      const chunkFile: File = {
        id: chunkId, // Use the existing chunk ID
        name: `chunk_${chunkId}`,
        originalName: `chunk_${chunkId}`,
        mimeType: 'application/octet-stream',
        size: chunkData.length,
        ownerId: 'system', // Use a system owner for replication chunks
        status: FILE_STATUS.AVAILABLE,
        hash: HashUtil.generateChunkHash(chunkData),
        chunks: [], // No further chunking for chunk files
        regions: [node.regionId],
        replicatedTo: [],
        compressionEnabled: false,
        deduplicationEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the chunk file metadata
      await this.filesService.saveFile(chunkFile);

      // Save the chunk data
      const storeOp = new Riak.Commands.KV.StoreValue.Builder()
        .withBucket(RIAK_BUCKETS.CHUNKS)
        .withKey(chunkId)
        .withContent(chunkData)
        .build();

      await this.filesService.executeRiakOperation(storeOp);

      // Optionally update storage node capacity
      node.available -= chunkData.length;
      await this.storageService.saveStorageNode(node);

      this.logger.log(
        `Successfully saved chunk ${chunkId} to node ${node.name}`,
      );
    } catch (error) {
      this.logger.error(`Failed to save chunk ${chunkId}: ${error.message}`);
      throw error;
    }
  }
  replicateFile(fileId: any, targetRegion: any) {
    throw new Error('Method not implemented.');
  }
}
