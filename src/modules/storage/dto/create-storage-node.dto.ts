import { IsNotEmpty, IsString, IsNumber, Min, IsPort } from 'class-validator';

export class CreateStorageNodeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  hostname: string;

  @IsPort()
  @IsNotEmpty()
  port: number;

  @IsString()
  @IsNotEmpty()
  regionId: string;

  @IsNumber()
  @Min(1)
  capacity: number;
}
