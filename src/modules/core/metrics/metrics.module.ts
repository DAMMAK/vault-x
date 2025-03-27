import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [MetricsController, MetricsController],
  providers: [MetricsService, MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
