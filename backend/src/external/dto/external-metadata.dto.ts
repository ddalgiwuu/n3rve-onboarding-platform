import { IsString, IsArray } from 'class-validator';

export class ExternalMetadataDto {
  @IsString() dsp: string;
  @IsArray() overrides: Array<{
    trackId?: string;
    field: string;
    originalValue: string;
    overrideValue: string;
    reason?: string;
  }>;
}
