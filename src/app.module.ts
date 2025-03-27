import { JobsModule } from './modules/jobs/jobs.module';
import { CompressionModule } from './modules/compression/compression.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { StorageModule } from './modules/storage/storage.module';
import { ReplicationModule } from './modules/replication/replication.module';
import { DeduplicationModule } from './modules/deduplication/deduplication.module';
import configuration from './modules/config/configuration';

@Module({
  imports: [
    JobsModule,
    CompressionModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    FilesModule,
    StorageModule,
    ReplicationModule,
    CompressionModule,
    DeduplicationModule,
    JobsModule,
  ],
})
export class AppModule {}
