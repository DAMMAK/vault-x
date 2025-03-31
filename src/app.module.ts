import { JobsModule } from './modules/jobs/jobs.module';
import { CompressionModule } from './modules/compression/compression.module';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { StorageModule } from './modules/storage/storage.module';
import { ReplicationModule } from './modules/replication/replication.module';
import { DeduplicationModule } from './modules/deduplication/deduplication.module';
import configuration from './modules/config/configuration';
import { RateLimiterMiddleware } from '@common/middleware/rate-limiter.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from '@logger/logger.service';
import { LoggerModule } from '@logger/logger.module';

@Module({
  imports: [
    JobsModule,
    CompressionModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:
          configService.get('NODE_ENV', 'development') !== 'production',
      }),
      inject: [ConfigService],
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
    LoggerModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('*'); // Apply globally
  }
}
