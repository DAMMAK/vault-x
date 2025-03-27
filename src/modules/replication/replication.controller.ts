import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReplicationService } from './replication.service';
import { ReplicationPolicyDto } from './dto/replication-policy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('replication')
@UseGuards(JwtAuthGuard)
export class ReplicationController {
  constructor(private readonly replicationService: ReplicationService) {}

  @Post('files/:fileId/policy')
  createReplicationPolicy(
    @Param('fileId') fileId: string,
    @Body() policyDto: ReplicationPolicyDto,
    @Req() req,
  ) {
    return this.replicationService.createReplicationPolicy(
      fileId,
      policyDto,
      req.user.id,
    );
  }

  @Get('files/:fileId/status')
  getReplicationStatus(@Param('fileId') fileId: string, @Req() req) {
    return this.replicationService.getReplicationStatus(fileId, req.user.id);
  }
}
