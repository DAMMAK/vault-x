import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { QUEUES } from '@common/constants/index';
import { StorageModule } from '../storage/storage.module';
import { ChunkUtil } from '@common/utils/chunks.util';

@Module({
  imports: [
    ConfigModule,
    StorageModule,
    BullModule.registerQueue({
      name: QUEUES.UPLOAD,
    }),
    BullModule.registerQueue({
      name: QUEUES.REPLICATION,
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, ChunkUtil],
  exports: [FilesService],
})
export class FilesModule {}
