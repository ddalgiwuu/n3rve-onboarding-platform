import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommunicationDto) {
    const catalogProduct = await this.prisma.catalogProduct.findFirst({
      where: { upc: dto.upc },
    });
    const submissionId = catalogProduct?.submissionId || null;

    return this.prisma.communicationLog.create({
      data: {
        upc: dto.upc,
        type: dto.type as any,
        source: dto.source as any,
        subject: dto.subject,
        summary: dto.summary,
        senderEmail: dto.senderEmail,
        dsp: dto.dsp,
        receivedAt: new Date(dto.receivedAt),
        outlookMessageId: dto.outlookMessageId,
        metadata: dto.metadata,
        catalogProductId: catalogProduct?.id,
        submissionId,
      },
    });
  }

  async findAll(filters?: {
    upc?: string;
    type?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.upc) where.upc = filters.upc;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.from || filters?.to) {
      where.receivedAt = {};
      if (filters.from) where.receivedAt.gte = new Date(filters.from);
      if (filters.to) where.receivedAt.lte = new Date(filters.to);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    const [items, total] = await Promise.all([
      this.prisma.communicationLog.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.communicationLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const log = await this.prisma.communicationLog.findUnique({
      where: { id },
    });
    if (!log) throw new NotFoundException('Communication log not found');
    return log;
  }

  async findByUpc(upc: string) {
    return this.prisma.communicationLog.findMany({
      where: { upc },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateCommunicationDto) {
    const data: any = { ...dto };
    if (dto.status === 'RESOLVED') {
      data.resolvedAt = new Date();
    }
    return this.prisma.communicationLog.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.communicationLog.delete({ where: { id } });
  }

  async getStats() {
    const [byType, byStatus] = await Promise.all([
      this.prisma.communicationLog.groupBy({ by: ['type'], _count: true }),
      this.prisma.communicationLog.groupBy({ by: ['status'], _count: true }),
    ]);
    return { byType, byStatus };
  }
}
