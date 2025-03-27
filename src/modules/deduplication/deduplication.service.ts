import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { QUEUES } from '@common/constants';
import { DeduplicationJob } from './interfaces/deduplication-job.interface';

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  constructor(
    private configService: ConfigService,
    @InjectQueue(QUEUES.DEDUPLICATION) private deduplicationQueue: Queue,
  ) {}

  async queueDeduplicationJob(job: DeduplicationJob): Promise<void> {
    this.logger.log(`Queueing deduplication job for file ${job.fileId}`);
    await this.deduplicationQueue.add(job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  // This method would check if a file or chunk with the same hash already exists
  // If it does, we can reference the existing data instead of storing a duplicate
  async findDuplicateByHash(hash: string): Promise<string | null> {
    this.logger.log(`Checking for duplicates of hash ${hash}`);

    // In a real implementation, this would query the database for matching hashes
    // For this example, we'll just return null (no duplicates found)

    return null;
  }
}
