import { Process, Processor } from '@nestjs/bull';
import { Logger, BadRequestException } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUES, FILE_STATUS } from '@common/constants';
import { DeduplicationService } from '../deduplication.service';
import { DeduplicationJob } from '../interfaces/deduplication-job.interface';
import { FilesService } from '../../files/files.service';
import { StorageService } from '../../storage/storage.service';
import { File } from '../../files/interfaces/file.interface';
import { Chunk } from '../../files/interfaces/chunk.interface';

@Processor(QUEUES.DEDUPLICATION)
export class DeduplicationProcessor {
  private readonly logger = new Logger(DeduplicationProcessor.name);

  constructor(
    private deduplicationService: DeduplicationService,
    private filesService: FilesService,
    private storageService: StorageService,
  ) {}

  @Process()
  async processDeduplicationJob(job: Job<DeduplicationJob>): Promise<void> {
    const { fileId, userId } = job.data;
    this.logger.log(`Processing deduplication job for file ${fileId}`);

    try {
      // Get the file
      const file = await this.filesService.findOne(fileId, userId);

      // Check if deduplication is enabled for this file
      if (!file.deduplicationEnabled) {
        this.logger.log(
          `Deduplication not enabled for file ${fileId}, skipping`,
        );
        return;
      }

      // 1. Check for file-level deduplication
      let dedupResult = await this.checkFileDeduplication(file);

      // 2. If no file-level duplicate, check chunk-level deduplication
      if (!dedupResult.isDuplicate) {
        dedupResult = await this.performChunkDeduplication(file);
      }

      // 3. Update file metadata if deduplication occurred
      if (dedupResult.isDuplicate) {
        await this.updateFileForDeduplication(file, dedupResult);
      }

      this.logger.log(
        `Successfully processed deduplication for file ${fileId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process deduplication for file ${fileId}: ${error.message}`,
      );
      throw error;
    }
  }

  private async checkFileDeduplication(file: File): Promise<{
    isDuplicate: boolean;
    existingFileId?: string;
    duplicateChunks?: Chunk[];
  }> {
    // Only attempt file-level deduplication if file has a hash
    if (!file.hash) {
      return { isDuplicate: false };
    }

    try {
      const duplicateFileId =
        await this.deduplicationService.findDuplicateByHash(file.hash);

      if (duplicateFileId && duplicateFileId !== file.id) {
        this.logger.log(
          `Found duplicate file: ${duplicateFileId} for file ${file.id}`,
        );

        // Retrieve the existing duplicate file
        const existingFile = await this.filesService.findOne(
          duplicateFileId,
          file.ownerId,
        );

        return {
          isDuplicate: true,
          existingFileId: duplicateFileId,
          duplicateChunks: existingFile.chunks,
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      this.logger.warn(
        `File-level deduplication check failed: ${error.message}`,
      );
      return { isDuplicate: false };
    }
  }

  private async performChunkDeduplication(file: File): Promise<{
    isDuplicate: boolean;
    existingFileId?: string;
    duplicateChunks?: Chunk[];
  }> {
    const duplicateChunks: Chunk[] = [];

    // Check each chunk for duplicates
    for (const chunk of file.chunks) {
      if (!chunk.hash) continue;

      try {
        const duplicateChunkId =
          await this.deduplicationService.findDuplicateByHash(chunk.hash);

        if (duplicateChunkId && duplicateChunkId !== chunk.id) {
          this.logger.log(
            `Found duplicate chunk: ${duplicateChunkId} for chunk ${chunk.id} of file ${file.id}`,
          );

          // If a duplicate chunk is found, mark it
          duplicateChunks.push(chunk);
        }
      } catch (error) {
        this.logger.warn(
          `Chunk deduplication check failed for chunk ${chunk.id}: ${error.message}`,
        );
      }
    }

    return {
      isDuplicate: duplicateChunks.length > 0,
      duplicateChunks: duplicateChunks,
    };
  }

  private async updateFileForDeduplication(
    file: File,
    dedupResult: {
      isDuplicate: boolean;
      existingFileId?: string;
      duplicateChunks?: Chunk[];
    },
  ): Promise<void> {
    // If file-level duplicate exists
    if (dedupResult.existingFileId) {
      // Replace file metadata with existing file's metadata
      const existingFile = await this.filesService.findOne(
        dedupResult.existingFileId,
        file.ownerId,
      );

      // Update current file to reference existing file
      file.chunks = existingFile.chunks;
      file.hash = existingFile.hash;
      file.size = existingFile.size;
      file.status = FILE_STATUS.AVAILABLE;

      // Save updated file metadata
      await this.filesService['saveFile'](file);

      this.logger.log(
        `File ${file.id} deduplicated with existing file ${dedupResult.existingFileId}`,
      );
    }
    // If chunk-level duplicates exist
    else if (
      dedupResult.duplicateChunks &&
      dedupResult.duplicateChunks.length > 0
    ) {
      // Replace duplicate chunks with references to existing chunks
      for (const [index, chunk] of file.chunks.entries()) {
        const duplicateChunk = dedupResult.duplicateChunks.find(
          (dc) => dc.hash === chunk.hash,
        );

        if (duplicateChunk) {
          file.chunks[index] = {
            ...chunk,
            id: duplicateChunk.id, // Use existing chunk ID
          };
        }
      }

      // Save updated file with deduplicated chunks
      await this.filesService['saveFile'](file);

      this.logger.log(`Chunks of file ${file.id} partially deduplicated`);
    }
  }
}
