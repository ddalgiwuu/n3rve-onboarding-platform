import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

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
          _count: {
            select: {
              submissions: true,
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
    const [totalSubmissions, pendingReview, approved, rejected, totalUsers, usersWithSubmissions] = await Promise.all([
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { status: 'PENDING' } }),
      this.prisma.submission.count({ where: { status: 'APPROVED' } }),
      this.prisma.submission.count({ where: { status: 'REJECTED' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { submissions: { some: {} } } }),
    ]);

    return {
      totalSubmissions,
      pendingReview,
      approved,
      rejected,
      totalCustomers: totalUsers, // Total registered users
      activeArtists: usersWithSubmissions, // Users who have submitted
      totalRevenue: 0, // Placeholder - implement if needed
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

  async createUser(createUserDto: {
    name: string;
    email: string;
    password: string;
    role: string;
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
        preferences: {
          language: 'KO',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      },
    });
  }
}