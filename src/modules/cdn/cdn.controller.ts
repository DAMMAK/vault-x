import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CdnService } from './cdn.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConfigureCdnDto } from './dto/configure-cdn.dto';

@ApiTags('CDN')
@Controller('cdn')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CdnController {
  constructor(private readonly cdnService: CdnService) {}

  @Get(':fileId')
  @ApiOperation({ summary: 'Get CDN URL for a file' })
  async getCdnUrl(
    @Param('fileId') fileId: string,
    @Query('region') region?: string,
  ) {
    const cdnUrl = await this.cdnService.getCdnUrl(fileId, region);
    return {
      cdnUrl,
    };
  }

  @Post(':fileId/invalidate')
  @ApiOperation({ summary: 'Invalidate CDN cache for a file' })
  @Roles('admin')
  async invalidateCache(@Param('fileId') fileId: string) {
    await this.cdnService.invalidateCache(fileId);
    return {
      message: 'CDN cache invalidated successfully',
    };
  }

  @Post('configure')
  @ApiOperation({ summary: 'Configure CDN endpoint for a region' })
  @Roles('admin')
  async configureCdn(@Body() configureCdnDto: ConfigureCdnDto) {
    await this.cdnService.configureCdnForRegion(
      configureCdnDto.region,
      configureCdnDto.endpoint,
    );
    return {
      message: 'CDN configured successfully',
    };
  }
}
