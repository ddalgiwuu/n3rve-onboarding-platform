import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateCommunicationDto {
  @IsString() upc: string;
  @IsEnum(['QC_REJECTION', 'QC_PASS', 'DSP_TICKET', 'MARKETING', 'GENERAL'])
  type: string;
  @IsEnum(['AUTO_EMAIL', 'MANUAL'])
  source: string;
  @IsString() subject: string;
  @IsString() summary: string;
  @IsOptional() @IsString() senderEmail?: string;
  @IsOptional() @IsString() dsp?: string;
  @IsDateString() receivedAt: string;
  @IsOptional() @IsString() outlookMessageId?: string;
  @IsOptional() metadata?: any;
}
