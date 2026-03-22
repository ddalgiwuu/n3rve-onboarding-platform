import { IsString, IsOptional } from 'class-validator';

export class CreateQCLogDto {
  @IsOptional() @IsString() trackId?: string;
  @IsString() source: string; // FUGA | INTERNAL | OPENCLAW | MANUAL
  @IsString() type: string; // QC_ERROR | QC_WARNING | DSP_OVERRIDE | NOTE | REQUEST
  @IsString() severity: string; // INFO | WARN | ERROR
  @IsOptional() @IsString() dsp?: string;
  @IsString() title: string;
  @IsString() description: string;
  @IsOptional() @IsString() beforeValue?: string;
  @IsOptional() @IsString() afterValue?: string;
  @IsOptional() @IsString() field?: string;
}
