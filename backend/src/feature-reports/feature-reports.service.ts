import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddAdminPlaylistDto } from './dto/add-admin-playlist.dto';

@Injectable()
export class FeatureReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where: any = {};

    if (userId) {
      where.submission = {
        submitterId: userId
      };
    }

    return this.prisma.featureReport.findMany({
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
        updatedAt: 'desc'
      }
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.featureReport.findUnique({
      where: { id },
      include: {
        submission: true
      }
    });

    if (!report) {
      throw new NotFoundException(`Feature report with ID ${id} not found`);
    }

    return report;
  }

  async findByUPC(upc: string) {
    // Find feature reports by searching submissions with matching UPC
    // Note: release is a composite type, not a relation
    // We need to query through submission and filter in memory
    const allReports = await this.prisma.featureReport.findMany({
      include: {
        submission: true
      }
    });

    return allReports.filter(report =>
      (report.submission.release as any)?.upc === upc
    );
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
        updatedAt: new Date()
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

    const adminPlaylists = Array.isArray(report.adminPlaylists) 
      ? report.adminPlaylists 
      : (report.adminPlaylists as any)?.playlists || [];
    
    const updatedPlaylists = adminPlaylists.filter(
      (p: any) => p.id !== playlistId
    );

    return this.prisma.featureReport.update({
      where: { id: reportId },
      data: {
        adminPlaylists: updatedPlaylists,
        updatedAt: new Date()
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

    const adminPlaylists = Array.isArray(report.adminPlaylists) 
      ? report.adminPlaylists 
      : (report.adminPlaylists as any)?.playlists || [];
    
    const updatedPlaylists = adminPlaylists.map((p: any) =>
      p.id === playlistId ? { ...p, ...updates } : p
    );

    return this.prisma.featureReport.update({
      where: { id: reportId },
      data: {
        adminPlaylists: updatedPlaylists,
        updatedAt: new Date()
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
        updatedAt: new Date()
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
        submissionId: product.submissionId,
        platform: 'SPOTIFY', // Default platform
        featureType: 'AUTO_PLAYLIST',
        adminPlaylists: [],
        metrics: {},
      },
      include: {
        submission: true
      }
    });
  }
}
