import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDigitalProductDto } from './dto/create-digital-product.dto';
import { UpdateDigitalProductDto } from './dto/update-digital-product.dto';
import { ProductFormat } from '@prisma/client';

@Injectable()
export class DigitalProductsService {
  constructor(private prisma: PrismaService) {}

  private mapToProductFormat(albumType: string): ProductFormat {
    const normalized = albumType.toUpperCase();
    switch (normalized) {
      case 'SINGLE':
      case 'FOCUS_TRACK':
        return ProductFormat.SINGLE;
      case 'EP':
        return ProductFormat.EP;
      case 'ALBUM':
      default:
        return ProductFormat.ALBUM;
    }
  }

  async create(createDto: CreateDigitalProductDto) {
    return this.prisma.digitalProduct.create({
      data: {
        ...createDto,
        releaseDate: new Date(createDto.releaseDate),
        marketingDriverIds: createDto.marketingDriverIds || [],
        status: createDto.status || 'PENDING'
      },
      include: {
        submission: true
      }
    });
  }

  async findAll(userId?: string, submissionId?: string) {
    const where: any = {};

    if (submissionId) {
      where.submissionId = submissionId;
    } else if (userId) {
      where.submission = {
        submitterId: userId
      };
    }

    return this.prisma.digitalProduct.findMany({
      where,
      include: {
        submission: {
          select: {
            id: true,
            artistName: true,
            albumTitle: true,
            status: true
          }
        }
      },
      orderBy: {
        releaseDate: 'desc'
      }
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.digitalProduct.findUnique({
      where: { id },
      include: {
        submission: true
      }
    });

    if (!product) {
      throw new NotFoundException(`Digital product with ID ${id} not found`);
    }

    return product;
  }

  async findByUPC(upc: string) {
    return this.prisma.digitalProduct.findMany({
      where: { upc },
      include: {
        submission: true
      }
    });
  }

  async update(id: string, updateDto: UpdateDigitalProductDto) {
    const exists = await this.prisma.digitalProduct.findUnique({ where: { id } });

    if (!exists) {
      throw new NotFoundException(`Digital product with ID ${id} not found`);
    }

    const data: any = { ...updateDto };

    if (updateDto.releaseDate) {
      data.releaseDate = new Date(updateDto.releaseDate);
    }

    return this.prisma.digitalProduct.update({
      where: { id },
      data,
      include: {
        submission: true
      }
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.digitalProduct.findUnique({ where: { id } });

    if (!exists) {
      throw new NotFoundException(`Digital product with ID ${id} not found`);
    }

    return this.prisma.digitalProduct.delete({
      where: { id }
    });
  }

  // Helper: Create products from submission
  async createFromSubmission(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const products: any[] = [];

    // Create main product (based on album type)
    const mainProduct = await this.create({
      submissionId,
      upc: submission.release?.upc || '',
      format: this.mapToProductFormat(submission.albumType),
      title: submission.albumTitle,
      artistName: submission.artistName,
      releaseDate: submission.releaseDate.toISOString(),
      territories: Array.isArray(submission.release?.territories) 
        ? submission.release.territories as string[] 
        : ['World'],
      status: submission.status as any
    });

    products.push(mainProduct);

    // Create focus track products
    const focusTracks = submission.tracks.filter((t: any) => t.isFocusTrack);

    for (const track of focusTracks) {
      const focusProduct = await this.create({
        submissionId,
        upc: submission.release?.upc || '',
        format: 'SINGLE', // Focus tracks use SINGLE format (ProductFormat enum)
        title: track.titleKo,
        artistName: submission.artistName,
        linkedTrackId: track.id,
        trackIndex: submission.tracks.findIndex((t: any) => t.id === track.id),
        releaseDate: submission.releaseDate.toISOString(),
        territories: Array.isArray(submission.release?.territories) 
        ? submission.release.territories as string[] 
        : ['World'],
        status: submission.status as any
      });

      products.push(focusProduct);
    }

    return products;
  }
}
