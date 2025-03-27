import { LoggerService } from './logger.service';
import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [LoggerService, LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
