import { IsString, IsEnum, IsOptional, IsDateString, IsArray, IsInt } from 'class-validator';
import { ProductFormat, SubmissionStatus } from '@prisma/client';

export class CreateDigitalProductDto {
  @IsString()
  submissionId: string;

  @IsString()
  upc: string;

  @IsEnum(ProductFormat)
  format: ProductFormat;

  @IsString()
  title: string;

  @IsString()
  artistName: string;

  @IsOptional()
  @IsString()
  linkedTrackId?: string;

  @IsOptional()
  @IsInt()
  trackIndex?: number;

  @IsDateString()
  releaseDate: string;

  @IsArray()
  @IsString({ each: true })
  territories: string[];

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marketingDriverIds?: string[];
}
