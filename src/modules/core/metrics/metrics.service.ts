import { Injectable, OnModuleInit } from '@nestjs/common';
import { register, Counter, Gauge, Histogram } from 'prom-client';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class MetricsService implements OnModuleInit {
  private fileUploadsCounter: Counter;
  private fileDownloadsCounter: Counter;
  private fileDeletionsCounter: Counter;
  private totalStorageGauge: Gauge;
  private activeUsersGauge: Gauge;
  private requestDurationHistogram: Histogram;

  constructor(private readonly loggerService: LoggerService) {}

  onModuleInit() {
    // Initialize Prometheus metrics
    this.fileUploadsCounter = new Counter({
      name: 'file_uploads_total',
      help: 'Total number of uploaded files',
      labelNames: ['region', 'file_type'],
    });
    this.fileDownloadsCounter = new Counter({
      name: 'file_downloads_total',
      help: 'Total number of downloaded files',
      labelNames: ['region', 'file_type'],
    });

    this.fileDeletionsCounter = new Counter({
      name: 'file_deletions_total',
      help: 'Total number of deleted files',
      labelNames: ['region'],
    });

    this.totalStorageGauge = new Gauge({
      name: 'total_storage_bytes',
      help: 'Total storage used in bytes',
      labelNames: ['region'],
    });

    this.activeUsersGauge = new Gauge({
      name: 'active_users',
      help: 'Number of active users',
    });

    this.requestDurationHistogram = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    });

    this.loggerService.log('Prometheus metrics initialized', 'MetricsService');
  }

  incrementFileUploads(region: string, fileType: string) {
    this.fileUploadsCounter.inc({ region, file_type: fileType });
  }

  incrementFileDownloads(region: string, fileType: string) {
    this.fileDownloadsCounter.inc({ region, file_type: fileType });
  }

  incrementFileDeletions(region: string) {
    this.fileDeletionsCounter.inc({ region });
  }

  setTotalStorage(region: string, bytes: number) {
    this.totalStorageGauge.set({ region }, bytes);
  }

  setActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }

  startRequestDurationTimer(method: string, route: string) {
    return this.requestDurationHistogram.startTimer({
      method,
      route,
    });
  }

  getMetrics() {
    return register.metrics();
  }

  resetMetrics() {
    return register.clear();
  }
}
