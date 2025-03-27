import { CdnController } from './cdn.controller';
import { CdnService } from './cdn.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [CdnController, CdnController],
  providers: [CdnService, CdnService],
  exports: [CdnService],
})
export class CdnModule {}
