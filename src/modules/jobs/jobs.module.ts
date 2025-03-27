import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from '../files/files.module';
import { StorageModule } from '../storage/storage.module';
import { ReplicationModule } from '../replication/replication.module';
import { CompressionModule } from '../compression/compression.module';
import { DeduplicationModule } from '../deduplication/deduplication.module';
import { QUEUES } from '@common/constants';
import { UploadProcessor } from './processors/upload.processor';
import { ReplicationProcessor } from './processors/replication.processor';

@Module({
  imports: [
    ConfigModule,
    FilesModule,
    StorageModule,
    ReplicationModule,
    CompressionModule,
    DeduplicationModule,
    BullModule.registerQueue(
      { name: QUEUES.UPLOAD },
      { name: QUEUES.REPLICATION },
      { name: QUEUES.COMPRESSION },
      { name: QUEUES.DEDUPLICATION },
    ),
  ],
  providers: [UploadProcessor, ReplicationProcessor],
})
export class JobsModule {}
