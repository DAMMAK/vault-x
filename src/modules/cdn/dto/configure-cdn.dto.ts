import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfigureCdnDto {
  @ApiProperty({ description: 'Region to configure CDN for' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({ description: 'CDN endpoint URL' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  endpoint: string;
}
