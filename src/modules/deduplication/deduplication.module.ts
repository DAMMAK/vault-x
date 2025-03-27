import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DeduplicationService } from './deduplication.service';
import { DeduplicationProcessor } from './processors/deduplication.processor';
import { FilesModule } from '../files/files.module';
import { QUEUES } from '@common/constants';

@Module({
  imports: [
    ConfigModule,
    FilesModule,
    BullModule.registerQueue({
      name: QUEUES.DEDUPLICATION,
    }),
  ],
  providers: [DeduplicationService, DeduplicationProcessor],
  exports: [DeduplicationService],
})
export class DeduplicationModule {}
