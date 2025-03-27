import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@logger/logger.service';


@Injectable()
export class CdnService {
  private readonly cdnConfigBucket: string = 'cdn-config';
  private readonly cdnCacheBucket: string = 'cdn-cache';
  private readonly cdnEndpoints: Map<string, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    // Initialize CDN endpoints for each region
    this.cdnEndpoints = new Map<string, string>();
    const regions = this.configService.get<string[]>('storage.regions') || [];

    regions.forEach((region) => {
      this.cdnEndpoints.set(
        region,
        this.configService.get<string>(`cdn.endpoints.${region}`) || '',
      );
    });
  }

  async getCdnUrl(fileId: string, region?: string): Promise<string> {
    try {
      const defaultRegion =
        this.configService.get<string>('storage.defaultRegion') ?? 'us-east';
      const targetRegion = region || defaultRegion;

      // Get CDN endpoint for the region
      const cdnEndpoint = this.cdnEndpoints.get(targetRegion) || '';

      if (!cdnEndpoint) {
        throw new Error(
          `No CDN endpoint configured for region ${targetRegion}`,
        );
      }

      // Create CDN URL
      const cdnUrl = `${cdnEndpoint}/${fileId}`;

      // Store cache mapping
      // await this.riakService.storeObject(this.cdnCacheBucket, fileId, {
      //   fileId,
      //   cdnUrl,
      //   region: targetRegion,
      //   createdAt: new Date().toISOString(),
      // });

      this.loggerService.log(
        `Generated CDN URL for file ${fileId} in region ${targetRegion}`,
        'CdnService',
      );
      return cdnUrl;
    } catch (error) {
      this.loggerService.error(
        `Failed to generate CDN URL: ${error.message}`,
        error.stack,
        'CdnService',
      );
      throw error;
    }
  }

  async invalidateCache(fileId: string): Promise<void> {
    try {
      // In a real implementation, this would call the CDN API to invalidate the cache
      this.loggerService.log(
        `Invalidated CDN cache for file ${fileId}`,
        'CdnService',
      );

      // Remove from our local cache mapping
      // await this.riakService.deleteObject(this.cdnCacheBucket, fileId);
    } catch (error) {
      this.loggerService.error(
        `Failed to invalidate CDN cache: ${error.message}`,
        error.stack,
        'CdnService',
      );
      throw error;
    }
  }

  async configureCdnForRegion(region: string, endpoint: string): Promise<void> {
    try {
      // Update CDN endpoint for the region
      this.cdnEndpoints.set(region, endpoint);

      // Store configuration
      // await this.riakService.storeObject(this.cdnConfigBucket, region, {
      //   region,
      //   endpoint,
      //   updatedAt: new Date().toISOString(),
      // });

      this.loggerService.log(
        `Configured CDN endpoint for region ${region}: ${endpoint}`,
        'CdnService',
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to configure CDN: ${error.message}`,
        error.stack,
        'CdnService',
      );
      throw error;
    }
  }
}
