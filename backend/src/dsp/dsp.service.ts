import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ServiceType } from '@prisma/client';

export interface CreateDSPDto {
  name: string;
  serviceType?: ServiceType;
  logoUrl?: string;
  websiteUrl?: string;
  apiEndpoint?: string;
  territories: string[];
  marketShare?: number;
  features?: any;
}

export interface UpdateDSPDto extends Partial<CreateDSPDto> {
  isActive?: boolean;
}

@Injectable()
export class DSPService {
  constructor(private prisma: PrismaService) {}

  // Get all DSPs with optional filtering
  async findAll(
    search?: string,
    isActive?: boolean,
    serviceType?: ServiceType,
    limit: number = 100,
    offset: number = 0
  ) {
    const where: Prisma.DSPWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    const [dsps, total] = await Promise.all([
      this.prisma.dSP.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.dSP.count({ where })
    ]);

    return { dsps, total };
  }

  // Get a single DSP by ID
  async findOne(id: string) {
    return this.prisma.dSP.findUnique({
      where: { id }
    });
  }

  // Get a single DSP by name
  async findByName(name: string) {
    return this.prisma.dSP.findUnique({
      where: { name }
    });
  }

  // Create a new DSP
  async create(data: CreateDSPDto) {
    return this.prisma.dSP.create({
      data: {
        ...data,
        serviceType: data.serviceType || this.determineServiceType(data.name, (data as any).description)
      }
    });
  }

  // Update a DSP
  async update(id: string, data: UpdateDSPDto) {
    return this.prisma.dSP.update({
      where: { id },
      data
    });
  }

  // Delete a DSP (soft delete by setting isActive to false)
  async delete(id: string) {
    return this.prisma.dSP.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Bulk create/update DSPs
  async bulkUpsert(dsps: CreateDSPDto[]) {
    const operations = dsps.map(dsp => 
      this.prisma.dSP.upsert({
        where: { name: dsp.name },
        update: {
          serviceType: dsp.serviceType || this.determineServiceType(dsp.name),
          logoUrl: dsp.logoUrl,
          websiteUrl: dsp.websiteUrl,
          apiEndpoint: dsp.apiEndpoint,
          territories: dsp.territories,
          marketShare: dsp.marketShare,
          features: dsp.features,
          isActive: true,
        },
        create: {
          ...dsp,
          serviceType: dsp.serviceType || this.determineServiceType(dsp.name)
        }
      })
    );

    return Promise.all(operations);
  }

  // Helper method to determine service type based on name/description
  private determineServiceType(name: string, description?: string): ServiceType {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    // All non-standard types use OTHER as per Prisma schema
    if (text.includes('spotify')) return ServiceType.SPOTIFY;
    if (text.includes('apple')) return ServiceType.APPLE_MUSIC;
    if (text.includes('youtube')) return ServiceType.YOUTUBE_MUSIC;
    if (text.includes('amazon')) return ServiceType.AMAZON_MUSIC;
    if (text.includes('tidal')) return ServiceType.TIDAL;
    if (text.includes('deezer')) return ServiceType.DEEZER;
    
    return ServiceType.OTHER;
  }

  // Get DSP statistics
  async getStatistics() {
    const [
      total,
      active,
      inactive,
      byServiceType
    ] = await Promise.all([
      this.prisma.dSP.count(),
      this.prisma.dSP.count({ where: { isActive: true } }),
      this.prisma.dSP.count({ where: { isActive: false } }),
      this.prisma.dSP.groupBy({
        by: ['serviceType'],
        _count: true,
        where: { isActive: true }
      })
    ]);

    return {
      total,
      active,
      inactive,
      byServiceType: byServiceType.map(item => ({
        type: item.serviceType,
        count: item._count
      }))
    };
  }
}