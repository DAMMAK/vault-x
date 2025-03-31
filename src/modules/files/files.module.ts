import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { QUEUES } from '@common/constants/index';
import { StorageModule } from '../storage/storage.module';
import { ChunkUtil } from '@common/utils/chunks.util';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunk } from './entities/chunk.entity';

@Module({
  imports: [
    ConfigModule,
    StorageModule,
    TypeOrmModule.forFeature([File, Chunk]),

    BullModule.registerQueue({
      name: QUEUES.UPLOAD,
    }),
    BullModule.registerQueue({
      name: QUEUES.REPLICATION,
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, ChunkUtil, ConfigService],
  exports: [FilesService],
})
export class FilesModule {}
