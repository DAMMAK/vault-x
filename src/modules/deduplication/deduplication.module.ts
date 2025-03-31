import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DeduplicationService } from './deduplication.service';
import { DeduplicationProcessor } from './processors/deduplication.processor';
import { FilesModule } from '../files/files.module';
import { QUEUES } from '@common/constants';
import { FilesService } from '../files/files.service';
import { StorageService } from '../storage/storage.service';
import { ChunkUtil } from '@common/utils/chunks.util';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunk } from '../files/entities/chunk.entity';
import { Region } from '../storage/entities/region.entity';
import { StorageNode } from '../storage/entities/storage-node.entity';

@Module({
  imports: [
    ConfigModule,
    FilesModule,
    TypeOrmModule.forFeature([File, Chunk, Region, StorageNode]),

    BullModule.registerQueue({
      name: QUEUES.DEDUPLICATION,
    }),
    BullModule.registerQueue({
      name: QUEUES.UPLOAD,
    }),
    BullModule.registerQueue({
      name: QUEUES.REPLICATION,
    }),
  ],
  providers: [
    DeduplicationService,
    DeduplicationProcessor,
    FilesService,
    StorageService,
    ChunkUtil,
    ConfigService,
  ],
  exports: [DeduplicationService],
})
export class DeduplicationModule {}
