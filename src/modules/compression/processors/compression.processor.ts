import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUES } from '@common/constants/index';
import { CompressionService } from '../compression.service';
import { CompressionJob } from '../interfaces/compression-job.interface';
import { FilesService } from '../../files/files.service';
import { v4 as uuidv4 } from 'uuid';
import { FILE_STATUS } from '@common/constants';
import { Chunk } from 'src/modules/files/interfaces/chunk.interface';

@Processor(QUEUES.COMPRESSION)
export class CompressionProcessor {
  private readonly logger = new Logger(CompressionProcessor.name);

  constructor(
    private compressionService: CompressionService,
    private filesService: FilesService,
  ) {}

  @Process()
  async processCompressionJob(job: Job<CompressionJob>): Promise<void> {
    const { fileId, userId } = job.data;
    this.logger.log(`Processing compression job for file ${fileId}`);

    try {
      // Get the file
      const file = await this.filesService.findOne(fileId, userId);

      // Check if compression is enabled for this file
      if (!file.compressionEnabled) {
        this.logger.log(`Compression not enabled for file ${fileId}, skipping`);
        return;
      }

      // 1. Assemble the original file data
      const originalFileData =
        await this.filesService['assembleFileFromChunks'](file);

      // 2. Compress the file data
      const compressedFileData =
        await this.compressionService.compressData(originalFileData);

      // 3. Replace the original chunks with compressed chunks
      const totalChunks = Math.ceil(
        compressedFileData.length / file.chunks[0].size,
      );
      const newChunks: Chunk[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * file.chunks[0].size;
        const end = Math.min(
          start + file.chunks[0].size,
          compressedFileData.length,
        );
        const chunkData = compressedFileData.slice(start, end);

        const newChunk: Chunk = {
          id: uuidv4(),
          fileId: file.id,
          index: i,
          size: chunkData.length,
          hash: this.filesService['HashUtil'].generateChunkHash(chunkData),
          status: FILE_STATUS.UPLOADED,
        };

        // Save the compressed chunk data
        await this.filesService['saveChunkData'](newChunk.id, chunkData);
        newChunks.push(newChunk);
      }

      // 4. Update the file metadata
      file.chunks = newChunks;
      file.size = compressedFileData.length;
      file.hash =
        this.filesService['HashUtil'].generateFileHash(compressedFileData);
      file.status = FILE_STATUS.AVAILABLE;

      // Save the updated file
      await this.filesService['saveFile'](file);

      this.logger.log(`Successfully compressed file ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to compress file ${fileId}: ${error.message}`);
      throw error;
    }
  }
}
