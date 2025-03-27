import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUES } from '@common/constants';
import { ReplicationService } from '../../replication/replication.service';
import { ReplicationJob } from '../../replication/interfaces/replication-job.interface';

@Processor(QUEUES.REPLICATION)
export class ReplicationProcessor {
  private readonly logger = new Logger(ReplicationProcessor.name);

  constructor(private replicationService: ReplicationService) {}

  @Process()
  async processReplication(job: Job<ReplicationJob>): Promise<void> {
    this.logger.log(`Processing replication job for file: ${job.data.fileId}`);

    try {
      await this.replicationService.processReplicationJob(job.data);
      this.logger.log(
        `Successfully processed replication job for file: ${job.data.fileId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process replication job for file ${job.data.fileId}: ${error.message}`,
      );
      throw error;
    }
  }
}
