import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ExternalService } from './external.service';
import { ExternalLogDto } from './dto/external-log.dto';
import { ExternalMetadataDto } from './dto/external-metadata.dto';
import { ExternalSubmissionDto } from './dto/external-submission.dto';

@Public()
@UseGuards(ApiKeyGuard)
@Controller('external')
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Post('logs')
  async pushLogs(@Body() body: ExternalLogDto) {
    return this.externalService.pushLogs(body);
  }

  @Post('submissions')
  async upsertSubmission(@Body() body: ExternalSubmissionDto) {
    return this.externalService.upsertSubmission(body);
  }

  @Patch('submissions/:upc/metadata')
  async updateMetadata(
    @Param('upc') upc: string,
    @Body() body: ExternalMetadataDto,
  ) {
    return this.externalService.updateMetadata(upc, body);
  }
}
