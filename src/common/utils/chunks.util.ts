import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChunkUtil {
  private readonly chunkSize: number;

  constructor(private configService: ConfigService) {
    this.chunkSize = this.configService.get<number>(
      'storage.chunkSize',
      5242880,
    );
  }

  calculateChunks(fileSize: number): number {
    return Math.ceil(fileSize / this.chunkSize);
  }

  getChunkRange(chunkIndex: number): { start: number; end: number } {
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize - 1, Number.MAX_SAFE_INTEGER);
    return { start, end };
  }

  getChunkKey(fileId: string, chunkIndex: number): string {
    return `${fileId}_chunk_${chunkIndex}`;
  }
}
