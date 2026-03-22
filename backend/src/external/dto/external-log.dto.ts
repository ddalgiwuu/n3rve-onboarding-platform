import { IsString, IsOptional, IsArray } from 'class-validator';

export class ExternalLogDto {
  @IsString() upc: string;
  @IsOptional() @IsString() isrc?: string;
  @IsArray() logs: Array<{
    trackId?: string;
    source: string;
    type: string;
    severity: string;
    dsp?: string;
    title: string;
    description: string;
    beforeValue?: string;
    afterValue?: string;
    field?: string;
  }>;
}
