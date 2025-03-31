import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { Region } from './entities/region.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageNode } from './entities/storage-node.entity';
import { File } from '../files/entities/file.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Region, StorageNode, File]),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
