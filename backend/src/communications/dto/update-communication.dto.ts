import { IsString, IsOptional } from 'class-validator';

export class UpdateCommunicationDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() upc?: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() resolvedBy?: string;
}
