import { IsString, IsOptional } from 'class-validator';

export class CreateDSPOverrideDto {
  @IsOptional() @IsString() trackId?: string;
  @IsString() dsp: string;
  @IsString() field: string;
  @IsString() originalValue: string;
  @IsString() overrideValue: string;
  @IsOptional() @IsString() reason?: string;
}
