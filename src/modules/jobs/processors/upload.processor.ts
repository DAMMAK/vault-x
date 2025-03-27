import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUES } from '@common/constants';
import { FilesService } from '../../files/files.service';
import { CompressionService } from '../../compression/compression.service';
import { DeduplicationService } from '../../deduplication/deduplication.service';

@Processor(QUEUES.UPLOAD)
export class UploadProcessor {
  private readonly logger = new Logger(UploadProcessor.name);

  constructor(
    private filesService: FilesService,
    private compressionService: CompressionService,
    private deduplicationService: DeduplicationService,
  ) {}

  @Process()
  async processUpload(
    job: Job<{ fileId: string; userId: string }>,
  ): Promise<void> {
    const { fileId, userId } = job.data;
    this.logger.log(`Processing uploaded file: ${fileId}`);

    try {
      // Process the file (calculate hash, set status to available)
      await this.filesService.processUploadedFile(fileId, userId);

      // Get the processed file
      const file = await this.filesService.findOne(fileId, userId);

      // Queue additional processing jobs if needed
      if (file.compressionEnabled) {
        await this.compressionService.queueCompressionJob({ fileId, userId });
      }

      if (file.deduplicationEnabled) {
        await this.deduplicationService.queueDeduplicationJob({
          fileId,
          userId,
        });
      }

      this.logger.log(`Successfully processed uploaded file: ${fileId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process uploaded file ${fileId}: ${error.message}`,
      );
      throw error;
    }
  }
}
