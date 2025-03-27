import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ReplicationService } from './replication.service';
import { ReplicationController } from './replication.controller';
import { FilesModule } from '../files/files.module';
import { StorageModule } from '../storage/storage.module';
import { QUEUES } from '@common/constants';

@Module({
  imports: [
    ConfigModule,
    FilesModule,
    StorageModule,
    BullModule.registerQueue({
      name: QUEUES.REPLICATION,
    }),
  ],
  controllers: [ReplicationController],
  providers: [ReplicationService],
  exports: [ReplicationService],
})
export class ReplicationModule {}
