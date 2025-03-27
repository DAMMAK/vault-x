import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class ReplicationPolicyDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  targetRegions: string[];
}
