import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async getAllUsers() {
    return this.prisma.user.findMany({
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
    });
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

  async getAllSubmissions() {
    return this.prisma.submission.findMany({
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
    });
  }

  async updateSubmissionStatus(submissionId: string, status: string, reviewerId: string) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        submitter: true,
        reviewer: true,
      },
    });
  }
}