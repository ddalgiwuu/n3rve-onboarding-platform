import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DropboxService } from '../dropbox/dropbox.service';
import { QCGateway } from '../websocket/qc.gateway';
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
  excludeFugaImports?: boolean;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private dropbox: DropboxService,
    private qcGateway: QCGateway,
  ) {}

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

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !user.isActive,
      },
    });

    const { password: _pw, ...safe } = updated;
    return safe;
  }

  async getAllSubmissions(options: PaginationOptions) {
    const { page = 1, limit = 10, status, search, startDate, endDate, excludeFugaImports } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.SubmissionWhereInput = {};

    // Exclude FUGA-imported submissions (already in catalog)
    if (excludeFugaImports) {
      where.catalogProductId = null;
    }

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

    // Base filter for stats (same excludeFugaImports but without status/search/date)
    const baseWhere: Prisma.SubmissionWhereInput = {};
    if (excludeFugaImports) {
      baseWhere.catalogProductId = null;
    }

    const [submissions, total, pending, approved, rejected] = await Promise.all([
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
          labelAccount: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
        },
      }),
      this.prisma.submission.count({ where }),
      this.prisma.submission.count({ where: { ...baseWhere, status: 'PENDING' } }),
      this.prisma.submission.count({ where: { ...baseWhere, status: 'APPROVED' } }),
      this.prisma.submission.count({ where: { ...baseWhere, status: 'REJECTED' } }),
    ]);

    return {
      submissions: submissions.map(submission => ({
        ...submission,
        submitterName: submission.submitter?.name,
        submitterEmail: submission.submitter?.email,
      })),
      total,
      stats: {
        total: pending + approved + rejected,
        pending,
        approved,
        rejected,
      },
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

    // Find all non-RELEASED submissions (catalog-linked OR release date in the past)
    const catalogSubmissions = await this.prisma.submission.findMany({
      where: {
        status: { notIn: ['RELEASED', 'REJECTED'] },
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

  /**
   * Update submission files fields with Dropbox URLs, matched by UPC.
   */
  async updateSubmissionFiles(fileLinks: Record<string, { coverImageUrl?: string; audioFiles?: any[] }>) {
    let updated = 0;
    const errors: string[] = [];

    for (const [upc, links] of Object.entries(fileLinks)) {
      try {
        // Find submission by UPC
        const submissions = await this.prisma.submission.findMany({
          select: { id: true, release: true, files: true },
        });

        const sub = submissions.find((s) => (s.release as any)?.upc === upc);
        if (!sub) {
          errors.push(`No submission for UPC ${upc}`);
          continue;
        }

        const currentFiles = (sub.files || {}) as any;
        const updateData: any = {};

        if (links.coverImageUrl) {
          updateData.files = {
            ...currentFiles,
            coverImageUrl: links.coverImageUrl,
            audioFiles: links.audioFiles || currentFiles.audioFiles || [],
            additionalFiles: currentFiles.additionalFiles || [],
            musicVideoFiles: currentFiles.musicVideoFiles || [],
            musicVideoThumbnails: currentFiles.musicVideoThumbnails || [],
            artistPhotoUrl: currentFiles.artistPhotoUrl || null,
            motionArtUrl: currentFiles.motionArtUrl || null,
            musicVideoUrl: currentFiles.musicVideoUrl || null,
          };
        } else if (links.audioFiles?.length) {
          updateData.files = {
            ...currentFiles,
            audioFiles: links.audioFiles,
            additionalFiles: currentFiles.additionalFiles || [],
            musicVideoFiles: currentFiles.musicVideoFiles || [],
            musicVideoThumbnails: currentFiles.musicVideoThumbnails || [],
            coverImageUrl: currentFiles.coverImageUrl || null,
            artistPhotoUrl: currentFiles.artistPhotoUrl || null,
            motionArtUrl: currentFiles.motionArtUrl || null,
            musicVideoUrl: currentFiles.musicVideoUrl || null,
          };
        }

        if (Object.keys(updateData).length > 0) {
          await this.prisma.submission.update({
            where: { id: sub.id },
            data: updateData,
          });
          updated++;
        }
      } catch (err: any) {
        errors.push(`UPC ${upc}: ${err.message}`);
      }
    }

    return { updated, errors: errors.length, errorDetails: errors };
  }

  async diagnoseSyncMismatches() {
    // Get all catalog products
    const catalogProducts = await this.prisma.catalogProduct.findMany({
      select: { id: true, upc: true, name: true, fugaId: true, submissionId: true },
    });
    const catalogByUpc = new Map(catalogProducts.map(cp => [cp.upc, cp]));

    // Get all submissions
    const submissions = await this.prisma.submission.findMany({
      select: { id: true, albumTitle: true, artistName: true, release: true, catalogProductId: true },
    });

    const submissionOnly: any[] = [];
    const catalogOnly: any[] = [];
    const matched: any[] = [];

    const submissionUpcs = new Set<string>();
    for (const sub of submissions) {
      const upc = (sub.release as any)?.upc;
      submissionUpcs.add(upc);
      const cp = upc ? catalogByUpc.get(upc) : null;
      if (cp) {
        matched.push({ submissionId: sub.id, catalogId: cp.id, upc, album: sub.albumTitle, linked: !!cp.submissionId });
      } else {
        submissionOnly.push({ id: sub.id, album: sub.albumTitle, artist: sub.artistName, upc: upc || 'NO_UPC', catalogProductId: sub.catalogProductId });
      }
    }

    for (const cp of catalogProducts) {
      if (!submissionUpcs.has(cp.upc)) {
        catalogOnly.push({ id: cp.id, name: cp.name, upc: cp.upc, fugaId: cp.fugaId?.toString() });
      }
    }

    return {
      matched: matched.length,
      submissionOnly: submissionOnly.length,
      catalogOnly: catalogOnly.length,
      submissionOnlyDetails: submissionOnly,
      catalogOnlyDetails: catalogOnly,
      // Show unlinked matched (UPC matches but not linked via submissionId)
      unlinkedMatched: matched.filter(m => !m.linked),
    };
  }

  async autoFixSyncMismatches() {
    // Get all catalog products
    const catalogProducts = await this.prisma.catalogProduct.findMany({
      select: { id: true, upc: true, fugaId: true, submissionId: true },
    });
    const catalogByUpc = new Map(catalogProducts.map(cp => [cp.upc, cp]));

    // Get all submissions
    const submissions = await this.prisma.submission.findMany({
      select: { id: true, release: true, catalogProductId: true },
    });

    let linked = 0;
    const errors: string[] = [];

    for (const sub of submissions) {
      const upc = (sub.release as any)?.upc;
      if (!upc) continue;

      const cp = catalogByUpc.get(upc);
      if (!cp) continue;

      // Link if not already linked
      try {
        if (!cp.submissionId || cp.submissionId !== sub.id) {
          await this.prisma.catalogProduct.update({
            where: { id: cp.id },
            data: { submissionId: sub.id },
          });
        }
        if (!sub.catalogProductId || sub.catalogProductId !== cp.id) {
          await this.prisma.submission.update({
            where: { id: sub.id },
            data: { catalogProductId: cp.id, fugaSyncStatus: 'SYNCED' },
          });
        }
        linked++;
      } catch (err: any) {
        errors.push(`${upc}: ${err.message}`);
      }
    }

    return { linked, errors: errors.length, errorDetails: errors };
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

    const created = await this.prisma.user.create({
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

    const { password: _pw, ...safe } = created;
    return safe;
  }

  async createQCLogByUpc(data: {
    upc: string;
    source: string;
    type: string;
    severity: string;
    dsp?: string;
    title: string;
    description: string;
    senderEmail?: string;
    receivedAt?: string;
    outlookMessageId?: string;
    metadata?: any;
  }) {
    // Find submission by UPC via CatalogProduct
    const catalogProduct = await this.prisma.catalogProduct.findFirst({
      where: { upc: data.upc },
    });

    let submissionId = catalogProduct?.submissionId;

    // If no catalog product match, try finding submission by release.upc
    if (!submissionId) {
      const submissions = await this.prisma.submission.findMany({
        select: { id: true, release: true },
      });
      const matched = submissions.find((s) => (s.release as any)?.upc === data.upc);
      submissionId = matched?.id ?? null;
    }

    const created = await this.prisma.qCLog.create({
      data: {
        submissionId: submissionId || undefined,
        source: data.source,
        type: data.type,
        severity: data.severity,
        dsp: data.dsp,
        title: data.title,
        description: data.description,
        senderEmail: data.senderEmail,
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : undefined,
        outlookMessageId: data.outlookMessageId,
        upc: data.upc,
        metadata: data.metadata,
        createdBy: 'nanoclaw-auto',
      },
    });

    this.qcGateway.broadcastQCUpdate('qc-log-created', {
      logId: created.id,
      submissionId: created.submissionId,
      upc: created.upc,
      type: created.type,
      severity: created.severity,
      dsp: created.dsp,
      source: created.source,
    });

    return created;
  }

  // ─── B2B → n3rve-submissions Migration ───────────────────────────

  private readonly B2B_ROOT = '/N3RVE B2B/Clients/Labels';
  private readonly SUBMISSIONS_ROOT = '/Ryan Song/Apps/N3RVE_ONBOARDING_DASHBOARD/n3rve-submissions';
  private readonly SUB_FOLDERS = ['Cover Art', 'Music', 'Lyrics', 'Marketing'];

  /**
   * Migrate files from B2B folder structure to n3rve-submissions.
   *
   * Source: /N3RVE B2B/Clients/Labels/{label}/Releases/{album_folder}/
   * Target: /n3rve-submissions/{label}/Releases/{YYYY-MM-DD}_{album}_{UPC}/
   *         ├── Cover Art/
   *         ├── Music/
   *         ├── Lyrics/
   *         └── Marketing/
   */
  async migrateB2BFiles(dryRun = false) {
    this.logger.log(`Starting B2B migration (dryRun=${dryRun})`);

    // 1. Get all submissions from DB for matching
    const submissions = await this.prisma.submission.findMany({
      select: { id: true, albumTitle: true, labelName: true, release: true, files: true },
    });

    const subMap = submissions.map((s) => ({
      id: s.id,
      albumName: (s.albumTitle || '').trim(),
      labelName: (s.labelName || '').trim(),
      upc: (s.release as any)?.upc || '',
      releaseDate: (s.release as any)?.releaseDate || (s.release as any)?.consumerReleaseDate || '',
      files: s.files as any,
    }));

    this.logger.log(`Found ${subMap.length} submissions in DB`);

    // 2. List all labels in B2B
    const b2bLabels = await this.dropbox.listFiles(this.B2B_ROOT);
    const labelFolders = b2bLabels.filter((e: any) => e['.tag'] === 'folder');
    this.logger.log(`Found ${labelFolders.length} label folders in B2B`);

    const results: any[] = [];
    const errors: string[] = [];
    const oldFoldersToDelete: string[] = [];

    for (const labelFolder of labelFolders) {
      const labelName = labelFolder.name;
      const releasesPath = `${labelFolder.path_display}/Releases`;

      // List releases for this label
      let releases: any[];
      try {
        releases = await this.dropbox.listFiles(releasesPath);
      } catch {
        this.logger.warn(`No Releases folder for label: ${labelName}`);
        continue;
      }

      const releaseFolders = releases.filter((e: any) => e['.tag'] === 'folder');

      for (const releaseFolder of releaseFolders) {
        const b2bAlbumName = releaseFolder.name; // e.g. "Yin and Yang_Jan_30_2026"
        // Extract album name (before the first underscore+date pattern)
        const cleanAlbumName = this.extractAlbumName(b2bAlbumName);

        // Match with DB submission by album name + label
        const match = this.findSubmissionMatch(subMap, cleanAlbumName, labelName);

        if (!match) {
          errors.push(`No DB match: "${cleanAlbumName}" (label: ${labelName}, folder: ${b2bAlbumName})`);
          continue;
        }

        // Build target folder name: YYYY-MM-DD_album_UPC
        const dateStr = this.formatReleaseDate(match.releaseDate);
        const safeName = match.albumName.replace(/[/\\:*?"<>|]/g, '_');
        const targetFolderName = `${dateStr}_${safeName}_${match.upc}`;
        const targetPath = `${this.SUBMISSIONS_ROOT}/${labelName}/Releases/${targetFolderName}`;

        // List source files
        const sourceEntries = await this.dropbox.listFolderRecursive(releaseFolder.path_display);
        const sourceFiles = sourceEntries.filter((e: any) => e['.tag'] === 'file');

        const entry: any = {
          label: labelName,
          b2bFolder: b2bAlbumName,
          matchedAlbum: match.albumName,
          upc: match.upc,
          targetPath,
          filesCopied: 0,
          coverArtUrl: null,
        };

        if (!dryRun) {
          // Create target subfolders
          for (const sub of this.SUB_FOLDERS) {
            await this.dropbox.createFolder(`${targetPath}/${sub}`);
          }

          // Copy files into appropriate subfolders
          let coverArtPath: string | null = null;

          for (const file of sourceFiles) {
            const relativePath = file.path_display.substring(releaseFolder.path_display.length);
            const targetSubfolder = this.classifyFile(relativePath, file.name);
            const destPath = `${targetPath}/${targetSubfolder}/${file.name}`;

            try {
              await this.dropbox.copyItem(file.path_display, destPath);
              entry.filesCopied++;

              // Track cover art file for DB update
              if (targetSubfolder === 'Cover Art' && this.isCoverArtFile(file.name)) {
                coverArtPath = destPath;
              }
            } catch (err: any) {
              errors.push(`Copy failed: ${file.path_display} → ${destPath}: ${err.message}`);
            }
          }

          // Create shared link for cover art and update DB
          if (coverArtPath) {
            try {
              const sharedUrl = await this.dropbox.getOrCreateSharedLink(coverArtPath);
              entry.coverArtUrl = sharedUrl;

              // Update submission in DB
              const currentFiles = match.files || {};
              await this.prisma.submission.update({
                where: { id: match.id },
                data: {
                  files: {
                    ...currentFiles,
                    coverImageUrl: sharedUrl,
                  },
                },
              });
            } catch (err: any) {
              errors.push(`Shared link failed for ${coverArtPath}: ${err.message}`);
            }
          }

          // Track old n3rve-submissions folders for cleanup
          // Old structure: /n3rve-submissions/{label}/{artist}/{date}_{album}_{UPC}/
          const oldLabelPath = `${this.SUBMISSIONS_ROOT}/${labelName}`;
          const oldLabelEntries = await this.dropbox.listFiles(oldLabelPath);
          for (const oldEntry of oldLabelEntries) {
            if (oldEntry['.tag'] === 'folder' && oldEntry.name !== 'Releases') {
              // This is an artist folder from old structure — mark for deletion
              oldFoldersToDelete.push(oldEntry.path_display);
            }
          }
        }

        results.push(entry);
      }
    }

    // Delete old thumbnail folders (artist-level folders from old structure)
    let deletedOldFolders = 0;
    if (!dryRun) {
      const uniqueOldFolders = [...new Set(oldFoldersToDelete)];
      for (const oldFolder of uniqueOldFolders) {
        try {
          await this.dropbox.deleteFolder(oldFolder);
          deletedOldFolders++;
        } catch (err: any) {
          errors.push(`Delete old folder failed: ${oldFolder}: ${err.message}`);
        }
      }
    }

    return {
      dryRun,
      totalMatched: results.length,
      totalFilesCopied: results.reduce((sum, r) => sum + (r.filesCopied || 0), 0),
      deletedOldFolders,
      errors: errors.length,
      errorDetails: errors,
      results,
    };
  }

  /**
   * Extract album name from B2B folder name.
   * e.g. "Yin and Yang_Jan_30_2026" → "Yin and Yang"
   * e.g. "BLACK CHRISTMAS" → "BLACK CHRISTMAS"
   */
  private extractAlbumName(folderName: string): string {
    // Try to match pattern: AlbumName_Month_Day_Year
    const datePattern = /^(.+?)_(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)_\d{1,2}_\d{4}$/i;
    const match = folderName.match(datePattern);
    if (match) return match[1].trim();

    // Try pattern: AlbumName_YYYY-MM-DD or AlbumName_YYYYMMDD
    const isoPattern = /^(.+?)_\d{4}[-]?\d{2}[-]?\d{2}$/;
    const isoMatch = folderName.match(isoPattern);
    if (isoMatch) return isoMatch[1].trim();

    return folderName.trim();
  }

  /**
   * Find a matching submission by album name + label.
   * Uses fuzzy matching (case-insensitive, trimmed).
   */
  private findSubmissionMatch(
    subs: { id: string; albumName: string; labelName: string; upc: string; releaseDate: string; files: any }[],
    albumName: string,
    labelName: string,
  ) {
    const normalizedAlbum = albumName.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedLabel = labelName.toLowerCase().replace(/\s+/g, ' ').trim();

    return subs.find((s) => {
      const sAlbum = s.albumName.toLowerCase().replace(/\s+/g, ' ').trim();
      const sLabel = s.labelName.toLowerCase().replace(/\s+/g, ' ').trim();

      // Exact label match + album match (or album contains or is contained)
      const labelMatch = sLabel === normalizedLabel ||
        sLabel.includes(normalizedLabel) ||
        normalizedLabel.includes(sLabel);

      const albumMatch = sAlbum === normalizedAlbum ||
        sAlbum.includes(normalizedAlbum) ||
        normalizedAlbum.includes(sAlbum);

      return labelMatch && albumMatch;
    });
  }

  /**
   * Format release date to YYYY-MM-DD.
   */
  private formatReleaseDate(dateStr: string): string {
    if (!dateStr) return 'unknown';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'unknown';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Classify a file into the appropriate subfolder based on its path/name.
   */
  private classifyFile(relativePath: string, fileName: string): string {
    const lower = relativePath.toLowerCase();
    const nameLower = fileName.toLowerCase();

    if (lower.includes('/cover art/') || lower.includes('/cover/') || lower.includes('/artwork/')) {
      return 'Cover Art';
    }
    if (lower.includes('/music/') || lower.includes('/audio/') || lower.includes('/tracks/')) {
      return 'Music';
    }
    if (lower.includes('/lyrics/')) {
      return 'Lyrics';
    }
    if (lower.includes('/marketing/') || lower.includes('/promo/')) {
      return 'Marketing';
    }

    // Classify by file extension
    const ext = nameLower.split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'tiff', 'tif', 'bmp', 'psd'].includes(ext)) {
      return 'Cover Art';
    }
    if (['wav', 'mp3', 'flac', 'aiff', 'aif', 'm4a', 'ogg'].includes(ext)) {
      return 'Music';
    }
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      return 'Marketing';
    }
    if (['txt', 'pdf', 'doc', 'docx', 'lrc'].includes(ext)) {
      return 'Lyrics';
    }

    return 'Marketing'; // Default
  }

  /**
   * Check if a file is a cover art image.
   */
  private isCoverArtFile(fileName: string): boolean {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    return ['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext);
  }
}