import { CompressionService } from './compression.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CompressionProcessor } from './processors/compression.processor';
import { FilesModule } from '../files/files.module';
import { QUEUES } from '@common/constants';

@Module({
  imports: [
    ConfigModule,
    FilesModule,
    BullModule.registerQueue({
      name: QUEUES.COMPRESSION,
    }),
  ],
  providers: [CompressionService, CompressionService, CompressionProcessor],
  exports: [CompressionService],
})
export class CompressionModule {}
