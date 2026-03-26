import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { CreateQCLogDto } from './dto/create-qc-log.dto';
import { CreateDSPOverrideDto } from './dto/create-dsp-override.dto';

interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { status: 'PENDING' } }),
      this.prisma.submission.count({ where: { status: 'APPROVED' } }),
      this.prisma.submission.count({ where: { status: 'REJECTED' } }),
    ]);

    const recentSubmissions = await this.prisma.submission.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const recentUsers = await this.prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        isActive: true,
      },
    });

    return {
      stats: {
        totalUsers,
        activeUsers,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
      },
      recentSubmissions,
      recentUsers,
    };
  }

  async getAllUsers(options: PaginationOptions) {
    const { page = 1, limit = 10, search, status } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          isProfileComplete: true,
          createdAt: true,
          lastLogin: true,
          company: true,
          isCompanyAccount: true,
          parentAccountId: true,
          parentAccount: {
            select: {
              id: true,
              name: true,
              company: true,
            },
          },
          subAccounts: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              submissions: true,
              subAccounts: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        ...user,
        submissions: user._count.submissions,
        subAccountsCount: user._count.subAccounts,
        status: user.isActive ? 'active' : 'inactive',
      })),
      total,
    };
  }

  async getUserStats() {
    const [totalUsers, activeUsers, newUsersThisMonth] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)), // First day of current month
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      newUsersThisMonth,
    };
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !user.isActive,
      },
    });
  }

  async getAllSubmissions(options: PaginationOptions) {
    const { page = 1, limit = 10, status, search, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.SubmissionWhereInput = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED';
    }

    if (search) {
      where.OR = [
        { albumTitle: { contains: search, mode: 'insensitive' } },
        { albumTitleEn: { contains: search, mode: 'insensitive' } },
        { submitter: { name: { contains: search, mode: 'insensitive' } } },
        { submitter: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      submissions: submissions.map(submission => ({
        ...submission,
        submitterName: submission.submitter?.name,
        submitterEmail: submission.submitter?.email,
      })),
      total,
    };
  }

  async getSubmissionStats() {
    const [totalSubmissions, pendingReview, approved, rejected, released, totalUsers, usersWithSubmissions] = await Promise.all([
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { status: 'PENDING' } }),
      this.prisma.submission.count({ where: { status: 'APPROVED' } }),
      this.prisma.submission.count({ where: { status: 'REJECTED' } }),
      this.prisma.submission.count({ where: { status: 'RELEASED' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { submissions: { some: {} } } }),
    ]);

    return {
      totalSubmissions,
      pendingReview,
      approved,
      rejected,
      released,
      totalCustomers: totalUsers,
      activeArtists: usersWithSubmissions,
      totalRevenue: 0,
    };
  }

  /**
   * Mark all catalog-synced submissions as RELEASED.
   * Also returns upcoming releases with countdown.
   */
  async markCatalogSubmissionsReleased() {
    const now = new Date();

    // Find all submissions linked to catalog (already released through FUGA)
    const catalogSubmissions = await this.prisma.submission.findMany({
      where: {
        OR: [
          { catalogProductId: { not: null } },
          { fugaSyncStatus: 'SYNCED' },
        ],
        status: { not: 'RELEASED' },
      },
      select: { id: true, releaseDate: true, albumTitle: true, artistName: true },
    });

    const alreadyReleased: string[] = [];
    const upcoming: { id: string; albumTitle: string; artistName: string; releaseDate: Date; countdown: string }[] = [];

    for (const sub of catalogSubmissions) {
      const releaseDate = new Date(sub.releaseDate);
      if (releaseDate <= now) {
        // Already released — mark as RELEASED
        alreadyReleased.push(sub.id);
      } else {
        // Upcoming — calculate countdown
        const diff = releaseDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        upcoming.push({
          id: sub.id,
          albumTitle: sub.albumTitle,
          artistName: sub.artistName,
          releaseDate,
          countdown: `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`,
        });
      }
    }

    // Batch update already-released submissions
    if (alreadyReleased.length > 0) {
      await this.prisma.submission.updateMany({
        where: { id: { in: alreadyReleased } },
        data: { status: 'RELEASED' },
      });
    }

    return {
      markedReleased: alreadyReleased.length,
      upcoming,
      total: catalogSubmissions.length,
    };
  }

  async getSubmissionById(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        labelAccount: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        _count: {
          select: {
            qcLogs: true,
            dspOverrides: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Construct submissionData from the various fields
    const submissionData = {
      artist: {
        artistName: submission.artistName,
        artistNameEn: submission.artistNameEn,
        artistTranslations: submission.artistTranslations,
        labelName: submission.labelName,
        genre: submission.genre,
        biography: submission.biography,
        socialLinks: submission.socialLinks,
        artistType: submission.artistType,
        members: submission.members,
        spotifyId: submission.spotifyId,
        appleMusicId: submission.appleMusicId,
        youtubeChannelId: submission.youtubeChannelId,
      },
      album: {
        albumTitle: submission.albumTitle,
        albumTitleEn: submission.albumTitleEn,
        albumTranslations: submission.albumTranslations,
        albumType: submission.albumType,
        releaseDate: submission.releaseDate,
        albumDescription: submission.albumDescription,
        albumVersion: submission.albumVersion,
        releaseVersion: submission.releaseVersion,
        albumGenre: submission.albumGenre,
        albumSubgenre: submission.albumSubgenre,
        primaryTitle: submission.primaryTitle,
        hasTranslation: submission.hasTranslation,
        translationLanguage: submission.translationLanguage,
        translatedTitle: submission.translatedTitle,
        albumContributors: submission.albumContributors,
      },
      tracks: submission.tracks,
      files: submission.files,
      release: submission.release,
      marketing: submission.marketing,
    };

    return {
      ...submission,
      submissionData,
      submitterName: submission.submitter?.name,
      submitterEmail: submission.submitter?.email,
    };
  }

  async updateSubmissionStatus(submissionId: string, status: string, reviewerId: string, adminNotes?: string) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        adminNotes,
      },
      include: {
        submitter: true,
        reviewer: true,
      },
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: role.toUpperCase() as 'USER' | 'ADMIN',
      },
    });
  }

  async getQCLogs(submissionId: string, filters?: { source?: string; severity?: string; status?: string; dsp?: string }) {
    const where: any = { submissionId };

    if (filters?.source) where.source = filters.source;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;
    if (filters?.dsp) where.dsp = filters.dsp;

    return this.prisma.qCLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQCLog(submissionId: string, data: CreateQCLogDto, createdBy: string) {
    return this.prisma.qCLog.create({
      data: {
        submissionId,
        createdBy,
        trackId: data.trackId,
        source: data.source,
        type: data.type,
        severity: data.severity,
        dsp: data.dsp,
        title: data.title,
        description: data.description,
        beforeValue: data.beforeValue,
        afterValue: data.afterValue,
        field: data.field,
      },
    });
  }

  async updateQCLogStatus(logId: string, status: string, resolvedBy?: string) {
    const data: any = { status };

    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
      if (resolvedBy) data.resolvedBy = resolvedBy;
    }

    return this.prisma.qCLog.update({
      where: { id: logId },
      data,
    });
  }

  async getDSPOverrides(submissionId: string, dsp?: string) {
    const where: any = { submissionId };
    if (dsp) where.dsp = dsp;

    return this.prisma.dSPMetadataOverride.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDSPOverride(submissionId: string, data: CreateDSPOverrideDto, appliedBy: string) {
    return this.prisma.dSPMetadataOverride.create({
      data: {
        submissionId,
        appliedBy,
        trackId: data.trackId,
        dsp: data.dsp,
        field: data.field,
        originalValue: data.originalValue,
        overrideValue: data.overrideValue,
        reason: data.reason,
      },
    });
  }

  async deleteSubmission(submissionId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.qCLog.deleteMany({ where: { submissionId } });
      await tx.dSPMetadataOverride.deleteMany({ where: { submissionId } });
      await tx.digitalProduct.deleteMany({ where: { submissionId } });
      await tx.featureReport.deleteMany({ where: { submissionId } });
      return tx.submission.delete({ where: { id: submissionId } });
    });
  }

  async assignLabelAccount(submissionId: string, labelAccountId: string | null) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { labelAccountId },
    });
  }

  async getSubmissionsByLabel(labelAccountId: string) {
    return this.prisma.submission.findMany({
      where: { labelAccountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async autoMapLabelAccounts() {
    const unmapped = await this.prisma.submission.findMany({
      where: { labelAccountId: null },
    });

    const companyAccounts = await this.prisma.user.findMany({
      where: { isCompanyAccount: true },
    });

    let mapped = 0;
    for (const submission of unmapped) {
      if (!submission.labelName) continue;
      const match = companyAccounts.find(
        (account) => account.company?.toLowerCase() === submission.labelName.toLowerCase(),
      );
      if (match) {
        await this.prisma.submission.update({
          where: { id: submission.id },
          data: { labelAccountId: match.id },
        });
        mapped++;
      }
    }
    return { total: unmapped.length, mapped };
  }

  async getLabelAccounts() {
    const accounts = await this.prisma.user.findMany({
      where: { isCompanyAccount: true },
      include: { _count: { select: { labelSubmissions: true } } },
      orderBy: { company: 'asc' },
    });
    return accounts;
  }

  async createUser(createUserDto: {
    name: string;
    email: string;
    password: string;
    role: string;
    company?: string;
    isCompanyAccount?: boolean;
    parentAccountId?: string;
  }) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role.toUpperCase() as 'USER' | 'ADMIN',
        provider: 'EMAIL',
        isProfileComplete: true,
        company: createUserDto.company,
        isCompanyAccount: createUserDto.isCompanyAccount || false,
        parentAccountId: createUserDto.parentAccountId,
        preferences: {
          language: 'KO',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      },
      include: {
        parentAccount: true,
        subAccounts: true,
      },
    });
  }
}