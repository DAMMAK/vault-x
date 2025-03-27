import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUES } from '@common/constants';
import { DeduplicationJob } from '../../deduplication/interfaces/deduplication-job.interface';

@Injectable()
export class DeduplicationQueue {
  constructor(@InjectQueue(QUEUES.DEDUPLICATION) private queue: Queue) {}

  async add(data: DeduplicationJob): Promise<void> {
    await this.queue.add(data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async getJobs(): Promise<any[]> {
    const [active, waiting, completed, failed] = await Promise.all([
      this.queue.getActive(),
      this.queue.getWaiting(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
    ]);

    return [
      ...active.map((job) => ({ id: job.id, data: job.data, state: 'active' })),
      ...waiting.map((job) => ({
        id: job.id,
        data: job.data,
        state: 'waiting',
      })),
      ...completed.map((job) => ({
        id: job.id,
        data: job.data,
        state: 'completed',
      })),
      ...failed.map((job) => ({ id: job.id, data: job.data, state: 'failed' })),
    ];
  }
}
