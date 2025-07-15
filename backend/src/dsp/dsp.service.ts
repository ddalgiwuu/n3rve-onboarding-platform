import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ServiceType } from '@prisma/client';

export interface CreateDSPDto {
  dspId: string;
  name: string;
  code?: string;
  description?: string;
  contactEmail?: string;
  territories: string[];
  availability: string;
  isHD?: boolean;
  serviceType?: ServiceType;
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
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { dspId: { contains: search, mode: 'insensitive' } }
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

  // Get a single DSP by FUGA ID
  async findByDspId(dspId: string) {
    return this.prisma.dSP.findUnique({
      where: { dspId }
    });
  }

  // Create a new DSP
  async create(data: CreateDSPDto) {
    return this.prisma.dSP.create({
      data: {
        ...data,
        serviceType: data.serviceType || this.determineServiceType(data.name, data.description)
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
        where: { dspId: dsp.dspId },
        update: {
          name: dsp.name,
          code: dsp.code,
          description: dsp.description,
          contactEmail: dsp.contactEmail,
          territories: dsp.territories,
          availability: dsp.availability,
          isHD: dsp.isHD,
          serviceType: dsp.serviceType || this.determineServiceType(dsp.name, dsp.description),
          isActive: true,
        },
        create: {
          ...dsp,
          serviceType: dsp.serviceType || this.determineServiceType(dsp.name, dsp.description)
        }
      })
    );

    return Promise.all(operations);
  }

  // Helper method to determine service type based on name/description
  private determineServiceType(name: string, description?: string): ServiceType {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    if (text.includes('fingerprint')) return ServiceType.FINGERPRINTING;
    if (text.includes('video')) return ServiceType.VIDEO;
    if (text.includes('download')) return ServiceType.DOWNLOAD;
    if (text.includes('radio')) return ServiceType.RADIO;
    if (text.includes('facebook') || text.includes('tiktok')) return ServiceType.SOCIAL;
    if (text.includes('streaming') || text.includes('music')) return ServiceType.STREAMING;
    
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