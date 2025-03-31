import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { SignedUrlDto } from './dto/signed-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new file' })
  @ApiResponse({ status: 201, description: 'File created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'Payload too large' })
  @ApiBody({ type: CreateFileDto })
  create(@Body() createFileDto: CreateFileDto, @Req() req) {
    return this.filesService.create(createFileDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all files for the current user' })
  @ApiResponse({ status: 200, description: 'List of files' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Req() req) {
    return this.filesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.filesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFileDto: UpdateFileDto,
    @Req() req,
  ) {
    return this.filesService.update(id, updateFileDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.filesService.remove(id, req.user.id);
  }

  @Post(':id/chunks/:index')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @Param('id') id: string,
    @Param('index') index: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException('No chunk file uploaded');
    }

    const chunkIndex = parseInt(index, 10);
    if (isNaN(chunkIndex) || chunkIndex < 0) {
      throw new BadRequestException('Invalid chunk index');
    }

    await this.filesService.uploadChunk(
      id,
      chunkIndex,
      file.buffer,
      req.user.id,
    );
    return { message: 'Chunk uploaded successfully' };
  }

  @Post(':id/signed-url')
  generateSignedUrl(
    @Param('id') id: string,
    @Body() signedUrlDto: SignedUrlDto,
    @Req() req,
  ) {
    return this.filesService.generateSignedUrl(id, signedUrlDto, req.user.id);
  }

  @Public()
  @Get('download/:signedUrl')
  async downloadFile(
    @Param('signedUrl') signedUrl: string,
    @Res() res: Response,
  ) {
    const { file, data } =
      await this.filesService.getFileBySignedUrl(signedUrl);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`,
    );
    res.setHeader('Content-Length', data.length);

    res.send(data);
  }
}
