import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalLogDto } from './dto/external-log.dto';
import { ExternalMetadataDto } from './dto/external-metadata.dto';
import { QCGateway } from '../websocket/qc.gateway';

@Injectable()
export class ExternalService {
  constructor(
    private prisma: PrismaService,
    private qcGateway: QCGateway,
  ) {}

  private async findSubmissionByUPC(upc: string) {
    // release is a composite type, not a relation - filter in memory same as feature-reports pattern
    const allSubmissions = await this.prisma.submission.findMany();
    const submission = allSubmissions.find(
      (s) => (s.release as any)?.upc === upc,
    );

    if (!submission) {
      throw new NotFoundException(`Submission with UPC ${upc} not found`);
    }

    return submission;
  }

  async pushLogs(dto: ExternalLogDto) {
    const submission = await this.findSubmissionByUPC(dto.upc);

    const created = await Promise.all(
      dto.logs.map((log) =>
        this.prisma.qCLog.create({
          data: {
            submissionId: submission.id,
            createdBy: 'INTERNAL',
            trackId: log.trackId,
            source: 'INTERNAL',
            type: log.type,
            severity: log.severity,
            dsp: log.dsp,
            title: log.title,
            description: log.description,
            beforeValue: log.beforeValue,
            afterValue: log.afterValue,
            field: log.field,
          },
        }),
      ),
    );

    this.qcGateway.broadcastQCUpdate('qc-log-created', {
      submissionId: submission.id,
      logCount: created.length,
    });

    return { submissionId: submission.id, created: created.length };
  }

  async updateMetadata(upc: string, dto: ExternalMetadataDto) {
    const submission = await this.findSubmissionByUPC(upc);

    const overrides = await Promise.all(
      dto.overrides.map((override) =>
        this.prisma.dSPMetadataOverride.create({
          data: {
            submissionId: submission.id,
            appliedBy: 'OPENCLAW',
            dsp: dto.dsp,
            trackId: override.trackId,
            field: override.field,
            originalValue: override.originalValue,
            overrideValue: override.overrideValue,
            reason: override.reason,
          },
        }),
      ),
    );

    // Create an audit QCLog entry for the DSP override batch
    await this.prisma.qCLog.create({
      data: {
        submissionId: submission.id,
        createdBy: 'INTERNAL',
        source: 'INTERNAL',
        type: 'DSP_OVERRIDE',
        severity: 'INFO',
        dsp: dto.dsp,
        title: `DSP metadata override applied by OpenClaw`,
        description: `${overrides.length} field(s) overridden for ${dto.dsp}`,
      },
    });

    return { submissionId: submission.id, applied: overrides.length };
  }
}
