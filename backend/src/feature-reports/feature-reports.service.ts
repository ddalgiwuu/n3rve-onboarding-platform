import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddAdminPlaylistDto } from './dto/add-admin-playlist.dto';

@Injectable()
export class FeatureReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where: any = {};

    if (userId) {
      where.digitalProduct = {
        submission: {
          submitterId: userId
        }
      };
    }

    return this.prisma.featureReport.findMany({
      where,
      include: {
        digitalProduct: {
          include: {
            submission: {
              select: {
                id: true,
                artistName: true,
                albumTitle: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.featureReport.findUnique({
      where: { id },
      include: {
        digitalProduct: {
          include: {
            submission: true
          }
        }
      }
    });

    if (!report) {
      throw new NotFoundException(`Feature report with ID ${id} not found`);
    }

    return report;
  }

  async findByUPC(upc: string) {
    return this.prisma.featureReport.findUnique({
      where: { upc },
      include: {
        digitalProduct: {
          include: {
            submission: true
          }
        }
      }
    });
  }

  // Admin: Add playlist placement
  async addAdminPlaylist(reportId: string, playlistDto: AddAdminPlaylistDto) {
    const report = await this.prisma.featureReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new NotFoundException('Feature report not found');
    }

    const newPlaylist = {
      id: `admin-${Date.now()}`,
      ...playlistDto,
      addedAt: new Date()
    };

    return this.prisma.featureReport.update({
      where: { id: reportId },
      data: {
        adminPlaylists: {
          push: newPlaylist
        },
        lastUpdated: new Date()
      }
    });
  }

  // Admin: Remove playlist placement
  async removeAdminPlaylist(reportId: string, playlistId: string) {
    const report = await this.prisma.featureReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new NotFoundException('Feature report not found');
    }

    const updatedPlaylists = report.adminPlaylists.filter(
      (p: any) => p.id !== playlistId
    );

    return this.prisma.featureReport.update({
      where: { id: reportId },
      data: {
        adminPlaylists: updatedPlaylists,
        lastUpdated: new Date()
      }
    });
  }

  // Admin: Update playlist placement
  async updateAdminPlaylist(
    reportId: string,
    playlistId: string,
    updates: Partial<AddAdminPlaylistDto>
  ) {
    const report = await this.prisma.featureReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new NotFoundException('Feature report not found');
    }

    const updatedPlaylists = report.adminPlaylists.map((p: any) =>
      p.id === playlistId ? { ...p, ...updates } : p
    );

    return this.prisma.featureReport.update({
      where: { id: reportId },
      data: {
        adminPlaylists: updatedPlaylists,
        lastUpdated: new Date()
      }
    });
  }

  // Admin: Bulk import playlists (CSV/Excel data)
  async bulkImportPlaylists(reportId: string, playlists: AddAdminPlaylistDto[]) {
    const report = await this.prisma.featureReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new NotFoundException('Feature report not found');
    }

    const newPlaylists = playlists.map((p, index) => ({
      id: `admin-bulk-${Date.now()}-${index}`,
      ...p,
      addedAt: new Date()
    }));

    return this.prisma.featureReport.update({
      where: { id: reportId },
      data: {
        adminPlaylists: {
          push: newPlaylists
        },
        lastUpdated: new Date()
      }
    });
  }

  // Helper: Create feature report for digital product
  async createForProduct(digitalProductId: string) {
    const product = await this.prisma.digitalProduct.findUnique({
      where: { id: digitalProductId },
      include: { submission: true }
    });

    if (!product) {
      throw new NotFoundException('Digital product not found');
    }

    return this.prisma.featureReport.create({
      data: {
        digitalProductId,
        upc: product.upc,
        autoPlaylists: [],
        adminPlaylists: [],
        reportStatus: 'NEW',
        genres: product.submission.albumGenre || [],
        moods: product.submission.release.moods || []
      },
      include: {
        digitalProduct: true
      }
    });
  }
}
