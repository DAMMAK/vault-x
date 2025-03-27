import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class SignedUrlDto {
  @IsNumber()
  @IsOptional()
  @Min(60) // Minimum: 1 minute
  @Max(604800) // Maximum: 1 week (7 days)
  expirationSeconds?: number;
}
