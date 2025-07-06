import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { Prisma, SubmissionStatus } from '@prisma/client';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async create(userId: string, data: any) {
    // Transform the frontend data structure to match Prisma schema
    const submissionData: Prisma.SubmissionCreateInput = {
      submitter: {
        connect: { id: userId }
      },
      submitterEmail: data.submitterEmail,
      submitterName: data.submitterName,
      status: SubmissionStatus.PENDING,
      
      // Artist info
      artistName: data.artistName,
      artistNameEn: data.artistNameEn,
      labelName: data.labelName,
      genre: data.genre || [],
      
      // Album info
      albumTitle: data.albumTitle,
      albumTitleEn: data.albumTitleEn,
      albumType: data.albumType,
      releaseDate: new Date(data.releaseDate),
      albumVersion: data.albumVersion,
      releaseVersion: data.releaseVersion,
      albumGenre: data.genre || [],
      albumSubgenre: data.subgenre || [],
      primaryTitle: data.primaryTitle,
      hasTranslation: data.hasTranslation,
      translationLanguage: data.translationLanguage,
      translatedTitle: data.translatedTitle,
      
      // Tracks
      tracks: data.tracks?.map((track: any) => ({
        id: track.id,
        titleKo: track.titleKo,
        titleEn: track.titleEn,
        artists: track.artists || [],
        featuringArtists: track.featuringArtists || [],
        composer: track.composer,
        lyricist: track.lyricist,
        arranger: track.arranger,
        isTitle: track.isTitle,
        isrc: track.isrc,
        explicitContent: track.explicitContent,
        dolbyAtmos: track.dolbyAtmos,
        genre: track.genre,
        subgenre: track.subgenre,
        audioFiles: track.audioFileUrl ? [{
          trackId: track.id,
          dropboxUrl: track.audioFileUrl,
          fileName: `track_${track.id}.wav`
        }] : []
      })) || [],
      
      // Files
      files: {
        coverImageUrl: data.files?.coverImageUrl,
        artistPhotoUrl: data.files?.artistPhotoUrl,
        coverImage: data.files?.coverImageUrl,
        artistPhoto: data.files?.artistPhotoUrl,
        additionalFiles: [
          data.files?.pressShotUrl && {
            dropboxUrl: data.files.pressShotUrl,
            fileType: 'press_shot',
            fileName: 'press_shot.jpg'
          },
          data.files?.artistAvatarUrl && {
            dropboxUrl: data.files.artistAvatarUrl,
            fileType: 'avatar',
            fileName: 'avatar.jpg'
          },
          data.files?.artistLogoUrl && {
            dropboxUrl: data.files.artistLogoUrl,
            fileType: 'logo',
            fileName: 'logo.png'
          }
        ].filter(Boolean)
      },
      
      // Release info with all 31 marketing fields
      release: {
        copyrightHolder: data.copyrightHolder,
        copyrightYear: data.copyrightYear,
        recordingCountry: data.recordingCountry,
        recordingLanguage: data.recordingLanguage,
        territories: data.territories || ['WORLDWIDE'],
        originalReleaseDate: data.releaseDate,
        consumerReleaseDate: data.consumerReleaseDate || data.releaseDate,
        releaseTime: data.releaseTime,
        selectedTimezone: data.selectedTimezone,
        cRights: data.cRights,
        pRights: data.pRights,
        
        // All 31 marketing fields from releaseInfo
        albumIntroduction: data.releaseInfo?.albumIntroduction,
        albumDescription: data.releaseInfo?.albumDescription,
        marketingKeywords: data.releaseInfo?.marketingKeywords,
        targetAudience: data.releaseInfo?.targetAudience,
        promotionPlans: data.releaseInfo?.promotionPlans,
        toundatesUrl: data.releaseInfo?.toundatesUrl,
        artistGender: data.releaseInfo?.artistGender,
        socialMovements: data.releaseInfo?.socialMovements,
        artistBio: data.releaseInfo?.artistBio,
        similarArtists: data.releaseInfo?.similarArtists,
        hasSyncHistory: data.releaseInfo?.hasSyncHistory || false,
        syncHistory: data.releaseInfo?.syncHistory,
        spotifyArtistId: data.releaseInfo?.spotifyArtistId,
        appleMusicArtistId: data.releaseInfo?.appleMusicArtistId,
        soundcloudArtistId: data.releaseInfo?.soundcloudArtistId,
        artistUgcPriorities: data.releaseInfo?.artistUgcPriorities,
        youtubeUrl: data.releaseInfo?.youtubeUrl,
        tiktokUrl: data.releaseInfo?.tiktokUrl,
        facebookUrl: data.releaseInfo?.facebookUrl,
        instagramUrl: data.releaseInfo?.instagramUrl,
        xUrl: data.releaseInfo?.xUrl,
        twitchUrl: data.releaseInfo?.twitchUrl,
        threadsUrl: data.releaseInfo?.threadsUrl,
        moods: data.releaseInfo?.moods || [],
        instruments: data.releaseInfo?.instruments || [],
        hook: data.releaseInfo?.hook,
        mainPitch: data.releaseInfo?.mainPitch,
        marketingDrivers: data.releaseInfo?.marketingDrivers,
        socialMediaPlan: data.releaseInfo?.socialMediaPlan,
        artistName: data.releaseInfo?.artistName || data.artistName,
        artistCountry: data.releaseInfo?.artistCountry,
        artistCurrentCity: data.releaseInfo?.artistCurrentCity,
        artistHometown: data.releaseInfo?.artistHometown,
        artistAvatar: data.releaseInfo?.artistAvatar,
        artistLogo: data.releaseInfo?.artistLogo,
        pressShotUrl: data.releaseInfo?.pressShotUrl,
        pressShotCredits: data.releaseInfo?.pressShotCredits,
        
        // Default values for required fields
        distributors: [],
        priceType: 'FREE',
        territoryType: 'WORLDWIDE',
        parentalAdvisory: 'NONE',
        releaseFormat: 'STANDARD',
      }
    };
    
    return this.prisma.submission.create({
      data: submissionData,
      include: {
        submitter: true,
      }
    });
  }

  async findAll(userId: string, isAdmin: boolean) {
    if (isAdmin) {
      return this.prisma.submission.findMany({
        include: {
          submitter: true,
          reviewer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return this.prisma.submission.findMany({
      where: {
        submitterId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, isAdmin: boolean) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        submitter: true,
        reviewer: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (!isAdmin && submission.submitterId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return submission;
  }

  async update(id: string, userId: string, isAdmin: boolean, data: any) {
    const submission = await this.findOne(id, userId, isAdmin);

    // Transform update data similar to create
    const updateData: Prisma.SubmissionUpdateInput = {};
    
    if (data.artistName) updateData.artistName = data.artistName;
    if (data.albumTitle) updateData.albumTitle = data.albumTitle;
    if (data.releaseDate) updateData.releaseDate = new Date(data.releaseDate);
    
    if (data.tracks) {
      updateData.tracks = data.tracks.map((track: any) => ({
        id: track.id,
        titleKo: track.titleKo,
        titleEn: track.titleEn,
        artists: track.artists || [],
        featuringArtists: track.featuringArtists || [],
        composer: track.composer,
        lyricist: track.lyricist,
        arranger: track.arranger,
        isTitle: track.isTitle,
        isrc: track.isrc,
        explicitContent: track.explicitContent,
        dolbyAtmos: track.dolbyAtmos,
        genre: track.genre,
        subgenre: track.subgenre,
      }));
    }
    
    if (data.releaseInfo) {
      updateData.release = {
        ...submission.release as any,
        ...data.releaseInfo,
      };
    }

    return this.prisma.submission.update({
      where: { id },
      data: updateData,
    });
  }

  async updateStatus(id: string, status: SubmissionStatus, reviewerId: string) {
    return this.prisma.submission.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }

  async getStatistics(userId?: string) {
    const where = userId ? { submitterId: userId } : {};

    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.submission.count({ where }),
      this.prisma.submission.count({ where: { ...where, status: SubmissionStatus.PENDING } }),
      this.prisma.submission.count({ where: { ...where, status: SubmissionStatus.APPROVED } }),
      this.prisma.submission.count({ where: { ...where, status: SubmissionStatus.REJECTED } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }

  async findByUser(userId: string, options: { page: number; limit: number }) {
    const skip = (options.page - 1) * options.limit;
    
    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where: { submitterId: userId },
        skip,
        take: options.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.submission.count({
        where: { submitterId: userId },
      }),
    ]);

    return {
      submissions,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }
}