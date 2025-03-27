import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as Riak from 'basho-riak-client';
import { v4 as uuidv4 } from 'uuid';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { SignedUrlDto } from './dto/signed-url.dto';
import { File } from './interfaces/file.interface';
import { Chunk } from './interfaces/chunk.interface';
import { RIAK_BUCKETS, QUEUES, FILE_STATUS } from '@common/constants/index';
import { ChunkUtil } from '@common/utils/chunks.util';
import { HashUtil } from '@common/utils/hash.util';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FilesService {
  private client: any;

  constructor(
    private configService: ConfigService,
    private chunkUtil: ChunkUtil,
    private storageService: StorageService,
    @InjectQueue(QUEUES.UPLOAD) private uploadQueue: Queue,
    @InjectQueue(QUEUES.REPLICATION) private replicationQueue: Queue,
  ) {
    const riakNodes = this.configService.get('riak.nodes');
    const riakProtocol = this.configService.get('riak.protocol');

    this.client = new Riak.Client(riakNodes, riakProtocol);
  }

  async create(createFileDto: CreateFileDto, userId: string): Promise<File> {
    const regions = await this.storageService.getRegions();
    if (regions.length === 0) {
      throw new BadRequestException('No storage regions available');
    }

    const defaultRegion =
      regions.find(
        (region) =>
          region.name === this.configService.get('storage.defaultRegion'),
      ) || regions[0];

    const newFile: File = {
      id: uuidv4(),
      name: createFileDto.name,
      originalName: createFileDto.originalName,
      mimeType: createFileDto.mimeType,
      size: createFileDto.size,
      ownerId: userId,
      status: FILE_STATUS.UPLOADING,
      hash: null,
      chunks: [],
      regions: [defaultRegion.name],
      replicatedTo: [],
      compressionEnabled: createFileDto.compressionEnabled || false,
      deduplicationEnabled: createFileDto.deduplicationEnabled || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const totalChunks = this.chunkUtil.calculateChunks(createFileDto.size);
    for (let i = 0; i < totalChunks; i++) {
      const { start, end } = this.chunkUtil.getChunkRange(i);
      newFile.chunks.push({
        id: uuidv4(),
        fileId: newFile.id,
        index: i,
        size: Math.min(end - start + 1, createFileDto.size - start),
        hash: null,
        status: FILE_STATUS.UPLOADING,
      });
    }

    await this.saveFile(newFile);

    return newFile;
  }

  async findAll(userId: string): Promise<File[]> {
    // In a real implementation, we'd use secondary indexes
    // For simplicity, we're doing a full scan (not efficient for production)
    const fetchOp = new Riak.Commands.KV.ListKeys.Builder()
      .withBucket(RIAK_BUCKETS.FILES)
      .build();

    const keys = await this.executeRiakOperation(fetchOp);
    const files = await Promise.all(
      keys.map((key) => this.findOne(key, userId)),
    );

    return files.filter((file) => file.ownerId === userId);
  }

  async findOne(id: string, userId: string): Promise<File> {
    const fetchOp = new Riak.Commands.KV.FetchValue.Builder()
      .withBucket(RIAK_BUCKETS.FILES)
      .withKey(id)
      .build();

    const result = await this.executeRiakOperation(fetchOp);
    if (!result.values || result.values.length === 0) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    const file = result.values[0].value;

    // Security check: ensure the user owns this file
    if (file.ownerId !== userId) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async update(
    id: string,
    updateFileDto: UpdateFileDto,
    userId: string,
  ): Promise<File> {
    const file = await this.findOne(id, userId);

    const updatedFile = {
      ...file,
      ...updateFileDto,
      updatedAt: new Date().toISOString(),
    };

    await this.saveFile(updatedFile);

    return updatedFile;
  }

  async remove(id: string, userId: string): Promise<void> {
    // First check if the file exists and belongs to the user
    await this.findOne(id, userId);

    // Delete all chunks
    for (const chunk of await this.getChunks(id)) {
      await this.removeChunk(chunk.id);
    }

    // Delete the file
    const deleteOp = new Riak.Commands.KV.DeleteValue.Builder()
      .withBucket(RIAK_BUCKETS.FILES)
      .withKey(id)
      .build();

    await this.executeRiakOperation(deleteOp);
  }

  async uploadChunk(
    fileId: string,
    chunkIndex: number,
    data: Buffer,
    userId: string,
  ): Promise<void> {
    const file = await this.findOne(fileId, userId);

    if (file.status !== FILE_STATUS.UPLOADING) {
      throw new BadRequestException(
        `File is not in uploading state: ${file.status}`,
      );
    }

    if (chunkIndex < 0 || chunkIndex >= file.chunks.length) {
      throw new BadRequestException(`Invalid chunk index: ${chunkIndex}`);
    }

    const chunk = file.chunks[chunkIndex];
    if (chunk.status !== FILE_STATUS.UPLOADING) {
      throw new BadRequestException(
        `Chunk is already processed: ${chunk.status}`,
      );
    }

    // Hash the chunk data
    const hash = HashUtil.generateChunkHash(data);

    // Update chunk status
    const updatedChunk = {
      ...chunk,
      hash,
      status: FILE_STATUS.UPLOADED,
    };

    // Save the chunk data
    await this.saveChunkData(updatedChunk.id, data);

    // Update the file with updated chunk info
    file.chunks[chunkIndex] = updatedChunk;

    // Check if all chunks are uploaded
    const allChunksUploaded = file.chunks.every(
      (c) => c.status === FILE_STATUS.UPLOADED,
    );
    if (allChunksUploaded) {
      file.status = FILE_STATUS.PROCESSING;

      // Queue processing jobs
      await this.uploadQueue.add({
        fileId: file.id,
        userId,
      });
    }

    await this.saveFile(file);
  }

  async generateSignedUrl(
    fileId: string,
    signedUrlDto: SignedUrlDto,
    userId: string,
  ): Promise<string> {
    const file = await this.findOne(fileId, userId);

    if (file.status !== FILE_STATUS.AVAILABLE) {
      throw new BadRequestException(`File is not available: ${file.status}`);
    }

    const expirationTime = signedUrlDto.expirationSeconds || 3600; // Default: 1 hour
    const secret = this.configService.getOrThrow<string>('jwt.secret');

    return HashUtil.generateSignedUrl(
      fileId,
      userId,
      expirationTime * 1000,
      secret,
    );
  }

  async verifySignedUrl(signedUrl: string): Promise<{
    isValid: boolean;
    fileId?: string | null;
    userId: string | null;
  }> {
    const secret = this.configService.getOrThrow<string>('jwt.secret');
    return HashUtil.verifySignedUrl(signedUrl, secret);
  }

  async getFileBySignedUrl(
    signedUrl: string,
  ): Promise<{ file: File; data: Buffer }> {
    const { isValid, fileId, userId } = await this.verifySignedUrl(signedUrl);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired signed URL');
    }

    try {
      const file = await this.findOne(fileId!, userId!);

      if (file.status !== FILE_STATUS.AVAILABLE) {
        throw new BadRequestException(`File is not available: ${file.status}`);
      }

      // Assemble the file from chunks
      const fileData = await this.assembleFileFromChunks(file);

      return { file, data: fileData };
    } catch (error) {
      throw new BadRequestException('Invalid or expired signed URL');
    }
  }

  async processUploadedFile(fileId: string, userId: string): Promise<void> {
    const file = await this.findOne(fileId, userId);

    if (file.status !== FILE_STATUS.PROCESSING) {
      return; // Already processed or not ready
    }

    try {
      // Assemble the file to calculate the overall hash
      const fileData = await this.assembleFileFromChunks(file);
      file.hash = HashUtil.generateFileHash(fileData);
      file.status = FILE_STATUS.AVAILABLE;

      await this.saveFile(file);

      // Queue replication if needed
      if (file.regions.length > 1) {
        await this.replicationQueue.add({
          fileId: file.id,
          userId,
          sourceRegion: file.regions[0],
          targetRegions: file.regions.slice(1),
        });
      }
    } catch (error) {
      file.status = FILE_STATUS.FAILED;
      await this.saveFile(file);
      throw error;
    }
  }

  async assembleFileFromChunks(file: File): Promise<Buffer> {
    const chunks = await Promise.all(
      file.chunks.map(async (chunk) => {
        return {
          index: chunk.index,
          data: await this.getChunkData(chunk.id),
        };
      }),
    );

    // Sort chunks by index
    chunks.sort((a, b) => a.index - b.index);

    // Concatenate chunk data
    return Buffer.concat(chunks.map((chunk) => chunk.data));
  }

  private async getChunks(fileId: string): Promise<Chunk[]> {
    const file = await this.getFileById(fileId);
    return file.chunks;
  }

  private async getFileById(fileId: string): Promise<File> {
    const fetchOp = new Riak.Commands.KV.FetchValue.Builder()
      .withBucket(RIAK_BUCKETS.FILES)
      .withKey(fileId)
      .build();

    const result = await this.executeRiakOperation(fetchOp);
    if (!result.values || result.values.length === 0) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    return result.values[0].value;
  }

  async saveFile(file: File): Promise<void> {
    const storeOp = new Riak.Commands.KV.StoreValue.Builder()
      .withBucket(RIAK_BUCKETS.FILES)
      .withKey(file.id)
      .withContent(file)
      .build();

    await this.executeRiakOperation(storeOp);
  }

  private async saveChunkData(chunkId: string, data: Buffer): Promise<void> {
    const storeOp = new Riak.Commands.KV.StoreValue.Builder()
      .withBucket(RIAK_BUCKETS.CHUNKS)
      .withKey(chunkId)
      .withContent(data)
      .build();

    await this.executeRiakOperation(storeOp);
  }

  async getChunkData(chunkId: string): Promise<Buffer> {
    const fetchOp = new Riak.Commands.KV.FetchValue.Builder()
      .withBucket(RIAK_BUCKETS.CHUNKS)
      .withKey(chunkId)
      .build();

    const result = await this.executeRiakOperation(fetchOp);
    if (!result.values || result.values.length === 0) {
      throw new NotFoundException(`Chunk with ID ${chunkId} not found`);
    }

    return result.values[0].value;
  }

  private async removeChunk(chunkId: string): Promise<void> {
    const deleteOp = new Riak.Commands.KV.DeleteValue.Builder()
      .withBucket(RIAK_BUCKETS.CHUNKS)
      .withKey(chunkId)
      .build();

    await this.executeRiakOperation(deleteOp);
  }

  executeRiakOperation(operation: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.execute(operation, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
  async updateReplicationMetadata(
    fileId: string,
    replicatedRegions: string[],
    userId: string,
  ): Promise<File> {
    const file = await this.findOne(fileId, userId);

    // Combine existing and new replicated regions, removing duplicates
    const updatedReplicatedTo = Array.from(
      new Set([...file.replicatedTo, ...replicatedRegions]),
    );

    // Combine existing and new regions, removing duplicates
    const updatedRegions = Array.from(
      new Set([...file.regions, ...replicatedRegions]),
    );

    const updatedFile: File = {
      ...file,
      regions: updatedRegions,
      replicatedTo: updatedReplicatedTo,
      updatedAt: new Date().toISOString(),
    };

    await this.saveFile(updatedFile);

    return updatedFile;
  }
}
