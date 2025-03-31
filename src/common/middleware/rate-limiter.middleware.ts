import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly limiter: RateLimiterRedis;

  constructor(private readonly configService: ConfigService) {
    // Create a Redis client instance
    const redisClient = new Redis({
      host: configService.get<string>('redis.host', 'localhost'),
      port: configService.get<number>('redis.port', 6379),
      enableOfflineQueue: false, // Prevent storing requests when Redis is down
    });

    this.limiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rate_limit',
      points: configService.get<number>('rateLimit.points', 100), // max requests
      duration: configService.get<number>('rateLimit.duration', 60), // per minute
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Use IP as identifier, or user ID if authenticated
      const identifier = req.ip!;

      // Different limits for different endpoints
      let points = 1;
      if (req.path.includes('/upload')) {
        points = 5; // Upload operations cost more points
      }

      // Consume points
      await this.limiter.consume(identifier, points);
      next();
    } catch (error: any) {
      if (error && error.msBeforeNext) {
        // Rate limit exceeded
        return res.status(429).json({
          statusCode: 429,
          message: 'Too Many Requests',
          retryAfter: Math.ceil(error.msBeforeNext / 1000), // Convert milliseconds to seconds
        });
      }

      // Handle unexpected errors
      next(error);
    }
  }
}
