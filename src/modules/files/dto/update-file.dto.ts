import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsArray } from 'class-validator';
import { CreateFileDto } from './create-file.dto';

export class UpdateFileDto extends PartialType(CreateFileDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  regions?: string[];
}
