import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { SignedUrlDto } from './dto/signed-url.dto';
import { File } from './entities/file.entity';
import { Chunk } from './entities/chunk.entity';
import { FILE_STATUS, QUEUES } from '@common/constants/index';
import { ChunkUtil } from '@common/utils/chunks.util';
import { HashUtil } from '@common/utils/hash.util';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FilesService {
  constructor(
    private configService: ConfigService,
    private chunkUtil: ChunkUtil,
    private storageService: StorageService,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    @InjectRepository(Chunk)
    private chunksRepository: Repository<Chunk>,
    @InjectQueue(QUEUES.UPLOAD) private uploadQueue: Queue,
    @InjectQueue(QUEUES.REPLICATION) private replicationQueue: Queue,
  ) {}

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

    const _file: Partial<File> = {
      id: uuidv4(),
      name: createFileDto.name,
      originalName: createFileDto.originalName,
      mimeType: createFileDto.mimeType,
      size: createFileDto.size,
      ownerId: userId,
      status: FILE_STATUS.UPLOADING,
      regions: [defaultRegion.name],
      replicatedTo: [],
      compressionEnabled: createFileDto.compressionEnabled || false,
      deduplicationEnabled: createFileDto.deduplicationEnabled || false,
      // chunks: [], // Optional: Initialize chunks as an empty array if needed
    };

    const newFile = this.filesRepository.create(_file); // TypeORM creates the entity
    await this.filesRepository.save(newFile); // Save the entity to the database
    const totalChunks = this.chunkUtil.calculateChunks(createFileDto.size);
    const chunks: Chunk[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const { start, end } = this.chunkUtil.getChunkRange(i);
      var _newChunk: Partial<Chunk> = {
        id: uuidv4(),
        fileId: newFile.id,
        file: newFile,
        index: i,
        size: Math.min(end - start + 1, createFileDto.size - start),
        status: FILE_STATUS.UPLOADING,
      };
      const chunk = this.chunksRepository.create(_newChunk);
      chunks.push(chunk);
    }

    await this.chunksRepository.save(chunks);

    newFile.chunks = chunks;
    return newFile;
  }

  async findAll(userId: string): Promise<File[]> {
    return this.filesRepository.find({
      where: { ownerId: userId },
      relations: ['chunks'],
    });
  }

  async findOne(id: string, userId: string): Promise<File> {
    const file = await this.filesRepository.findOne({
      where: { id, ownerId: userId },
      relations: ['chunks'],
    });

    if (!file) {
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

    return await this.filesRepository.save(updatedFile);
  }

  async remove(id: string, userId: string): Promise<void> {
    // First check if the file exists and belongs to the user
    const file = await this.findOne(id, userId);

    // Delete all chunks
    await this.chunksRepository.delete({ fileId: id });

    // Delete the file
    await this.filesRepository.delete(id);
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

    const chunk = file.chunks.find((c) => c.index === chunkIndex);
    if (!chunk) {
      throw new BadRequestException(
        `Chunk not found with index: ${chunkIndex}`,
      );
    }

    if (chunk.status !== FILE_STATUS.UPLOADING) {
      throw new BadRequestException(
        `Chunk is already processed: ${chunk.status}`,
      );
    }

    // Hash the chunk data
    const hash = HashUtil.generateChunkHash(data);

    // Update chunk status and data
    chunk.hash = hash;
    chunk.status = FILE_STATUS.UPLOADED;
    chunk.data = data;
    await this.chunksRepository.save(chunk);

    // Check if all chunks are uploaded
    const allChunksUploaded =
      (await this.chunksRepository.count({
        where: {
          fileId: file.id,
          status: FILE_STATUS.UPLOADING,
        },
      })) === 0;

    if (allChunksUploaded) {
      file.status = FILE_STATUS.PROCESSING;
      await this.filesRepository.save(file);

      // Queue processing jobs
      await this.uploadQueue.add({
        fileId: file.id,
        userId,
      });
    }
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

      await this.filesRepository.save(file);

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
      await this.filesRepository.save(file);
      throw error;
    }
  }

  async assembleFileFromChunks(file: File): Promise<Buffer> {
    // Load all chunks with data
    const chunks = await this.chunksRepository.find({
      where: { fileId: file.id },
      order: { index: 'ASC' },
    });

    // Ensure all chunks are loaded and have data
    if (chunks.length !== file.chunks.length) {
      throw new BadRequestException('Some chunks are missing');
    }

    if (chunks.some((chunk) => !chunk.data)) {
      throw new BadRequestException('Some chunks have no data');
    }

    // Concatenate chunk data
    return Buffer.concat(chunks.map((chunk) => chunk.data));
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

    file.regions = updatedRegions;
    file.replicatedTo = updatedReplicatedTo;

    await this.filesRepository.save(file);
    return file;
  }
  async getChunkData(chunkId: string): Promise<Buffer> {
    const chunk = await this.chunksRepository.findOne({
      where: { id: chunkId },
    });

    if (!chunk) {
      throw new NotFoundException(`Chunk with ID ${chunkId} not found`);
    }

    if (!chunk.data) {
      throw new BadRequestException(`No data available for chunk ${chunkId}`);
    }

    return chunk.data;
  }
}
