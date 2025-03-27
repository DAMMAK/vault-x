import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { CreateStorageNodeDto } from './dto/create-storage-node.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('regions')
  createRegion(@Body() createRegionDto: CreateRegionDto) {
    return this.storageService.createRegion(createRegionDto);
  }

  @Get('regions')
  getRegions() {
    return this.storageService.getRegions();
  }

  @Get('regions/:id')
  getRegion(@Param('id') id: string) {
    return this.storageService.getRegionById(id);
  }

  @Patch('regions/:id/deactivate')
  deactivateRegion(@Param('id') id: string) {
    return this.storageService.deactivateRegion(id);
  }

  @Post('nodes')
  createStorageNode(@Body() createStorageNodeDto: CreateStorageNodeDto) {
    return this.storageService.createStorageNode(createStorageNodeDto);
  }

  @Get('nodes')
  getStorageNodes() {
    return this.storageService.getStorageNodes();
  }

  @Get('nodes/:id')
  getStorageNode(@Param('id') id: string) {
    return this.storageService.getStorageNodeById(id);
  }

  @Get('regions/:regionId/nodes')
  getNodesInRegion(@Param('regionId') regionId: string) {
    return this.storageService.getStorageNodesInRegion(regionId);
  }

  @Patch('nodes/:id/status')
  updateNodeStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.storageService.updateStorageNodeStatus(id, body.status);
  }
}
