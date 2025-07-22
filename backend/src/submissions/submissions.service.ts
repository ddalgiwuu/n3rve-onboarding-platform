import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { DropboxService } from '../dropbox/dropbox.service';
import { Prisma, SubmissionStatus } from '@prisma/client';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private dropboxService: DropboxService,
  ) {}

  /**
   * 발매일, 시간, 타임존을 UTC DateTime으로 변환
   * @param releaseDate 발매일 (YYYY-MM-DD 형식)
   * @param releaseTime 발매 시간 (HH:MM 형식, 선택적)
   * @param timezone 타임존 (예: 'Asia/Seoul', 선택적)
   * @returns UTC DateTime 또는 null
   */
  private convertToUTC(releaseDate: string, releaseTime?: string, timezone?: string): Date | null {
    if (!releaseDate) return null;
    
    try {
      // 기본 시간은 00:00 (자정)
      const timeString = releaseTime || '00:00';
      const timezoneString = timezone || 'UTC';
      
      // 날짜와 시간을 조합하여 ISO 문자열 생성
      const dateTimeString = `${releaseDate}T${timeString}:00`;
      
      // 지정된 타임존에서 Date 객체 생성
      const localDateTime = new Date(dateTimeString);
      
      // 타임존 오프셋 계산
      if (timezoneString !== 'UTC') {
        // 간단한 타임존 처리 (실제 운영에서는 moment-timezone 등 라이브러리 사용 권장)
        const timezoneOffsets: { [key: string]: number } = {
          'Asia/Seoul': 9 * 60, // UTC+9 (분 단위)
          'America/New_York': -5 * 60, // UTC-5 (분 단위)
          'Europe/London': 0, // UTC+0 (분 단위)
          'America/Los_Angeles': -8 * 60, // UTC-8 (분 단위)
          'Asia/Tokyo': 9 * 60, // UTC+9 (분 단위)
        };
        
        const offsetMinutes = timezoneOffsets[timezoneString] || 0;
        const utcDateTime = new Date(localDateTime.getTime() - (offsetMinutes * 60 * 1000));
        return utcDateTime;
      }
      
      return localDateTime;
    } catch (error) {
      console.error('UTC 변환 오류:', error);
      return null;
    }
  }

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
        // Basic release fields
        copyrightHolder: data.release?.copyrightHolder || data.copyrightHolder,
        copyrightYear: data.release?.copyrightYear || data.copyrightYear,
        recordingCountry: data.release?.recordingCountry || data.recordingCountry || 'KR',
        recordingLanguage: data.release?.recordingLanguage || data.recordingLanguage || 'ko',
        territories: data.release?.territories || data.territories || ['WORLDWIDE'],
        originalReleaseDate: data.release?.originalReleaseDate || data.releaseDate,
        consumerReleaseDate: data.release?.consumerReleaseDate || data.consumerReleaseDate || data.releaseDate,
        releaseTime: data.release?.releaseTime || data.releaseTime,
        selectedTimezone: data.release?.selectedTimezone || data.selectedTimezone,
        // UTC 변환 필드들 추가
        releaseUTC: data.release?.releaseUTC || this.convertToUTC(data.release?.consumerReleaseDate || data.consumerReleaseDate || data.releaseDate, data.release?.releaseTime || data.releaseTime, data.release?.selectedTimezone || data.selectedTimezone),
        originalReleaseUTC: data.release?.originalReleaseUTC || this.convertToUTC(data.release?.originalReleaseDate || data.releaseDate, data.release?.releaseTime || data.releaseTime, data.release?.selectedTimezone || data.selectedTimezone),
        consumerReleaseUTC: data.release?.consumerReleaseUTC || this.convertToUTC(data.release?.consumerReleaseDate || data.consumerReleaseDate || data.releaseDate, data.release?.releaseTime || data.releaseTime, data.release?.selectedTimezone || data.selectedTimezone),
        cRights: data.release?.cRights || data.cRights || data.release?.copyrightHolder || data.copyrightHolder || '',
        pRights: data.release?.pRights || data.pRights || data.release?.productionHolder || data.productionHolder || '',
        upc: data.release?.upc || data.upc,
        ean: data.release?.ean || data.ean,
        catalogNumber: data.release?.catalogNumber || data.catalogNumber,
        
        // All 31 marketing fields - check both release and root level
        albumIntroduction: data.release?.albumIntroduction || data.releaseInfo?.albumIntroduction || data.albumIntroduction,
        albumDescription: data.release?.albumDescription || data.releaseInfo?.albumDescription || data.albumDescription,
        marketingKeywords: data.release?.marketingKeywords || data.releaseInfo?.marketingKeywords || data.marketingKeywords,
        targetAudience: data.release?.targetAudience || data.releaseInfo?.targetAudience || data.targetAudience,
        promotionPlans: data.release?.promotionPlans || data.releaseInfo?.promotionPlans || data.promotionPlans,
        toundatesUrl: data.release?.toundatesUrl || data.releaseInfo?.toundatesUrl || data.toundatesUrl,
        artistGender: data.release?.artistGender || data.releaseInfo?.artistGender || data.artistGender,
        socialMovements: data.release?.socialMovements || data.releaseInfo?.socialMovements || data.socialMovements,
        artistBio: data.release?.artistBio || data.releaseInfo?.artistBio || data.artistBio || data.biography,
        similarArtists: data.release?.similarArtists || data.releaseInfo?.similarArtists || data.similarArtists,
        hasSyncHistory: data.release?.hasSyncHistory || data.releaseInfo?.hasSyncHistory || data.hasSyncHistory || false,
        syncHistory: data.release?.syncHistory || data.releaseInfo?.syncHistory || data.syncHistory,
        spotifyArtistId: data.release?.spotifyArtistId || data.releaseInfo?.spotifyArtistId || data.spotifyArtistId,
        appleMusicArtistId: data.release?.appleMusicArtistId || data.releaseInfo?.appleMusicArtistId || data.appleMusicArtistId,
        soundcloudArtistId: data.release?.soundcloudArtistId || data.releaseInfo?.soundcloudArtistId || data.soundcloudArtistId,
        artistUgcPriorities: data.release?.artistUgcPriorities || data.releaseInfo?.artistUgcPriorities || data.artistUgcPriorities,
        youtubeUrl: data.release?.youtubeUrl || data.releaseInfo?.youtubeUrl || data.youtubeUrl,
        tiktokUrl: data.release?.tiktokUrl || data.releaseInfo?.tiktokUrl || data.tiktokUrl,
        facebookUrl: data.release?.facebookUrl || data.releaseInfo?.facebookUrl || data.facebookUrl,
        instagramUrl: data.release?.instagramUrl || data.releaseInfo?.instagramUrl || data.instagramUrl,
        xUrl: data.release?.xUrl || data.releaseInfo?.xUrl || data.xUrl,
        twitchUrl: data.release?.twitchUrl || data.releaseInfo?.twitchUrl || data.twitchUrl,
        threadsUrl: data.release?.threadsUrl || data.releaseInfo?.threadsUrl || data.threadsUrl,
        moods: data.release?.moods || data.releaseInfo?.moods || data.moods || [],
        instruments: data.release?.instruments || data.releaseInfo?.instruments || data.instruments || [],
        hook: data.release?.hook || data.releaseInfo?.hook || data.hook,
        mainPitch: data.release?.mainPitch || data.releaseInfo?.mainPitch || data.mainPitch,
        marketingDrivers: data.release?.marketingDrivers || data.releaseInfo?.marketingDrivers || data.marketingDrivers,
        socialMediaPlan: data.release?.socialMediaPlan || data.releaseInfo?.socialMediaPlan || data.socialMediaPlan,
        artistName: data.release?.artistName || data.releaseInfo?.artistName || data.artistName,
        artistCountry: data.release?.artistCountry || data.releaseInfo?.artistCountry || data.artistCountry,
        artistCurrentCity: data.release?.artistCurrentCity || data.releaseInfo?.artistCurrentCity || data.artistCurrentCity,
        artistHometown: data.release?.artistHometown || data.releaseInfo?.artistHometown || data.artistHometown,
        artistAvatar: data.release?.artistAvatar || data.releaseInfo?.artistAvatar || data.artistAvatar,
        artistLogo: data.release?.artistLogo || data.releaseInfo?.artistLogo || data.artistLogo,
        pressShotUrl: data.release?.pressShotUrl || data.releaseInfo?.pressShotUrl || data.pressShotUrl,
        pressShotCredits: data.release?.pressShotCredits || data.releaseInfo?.pressShotCredits || data.pressShotCredits,
        
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
        // UTC 변환 필드들 업데이트
        releaseUTC: this.convertToUTC(data.releaseInfo.consumerReleaseDate || data.releaseInfo.releaseDate, data.releaseInfo.releaseTime, data.releaseInfo.selectedTimezone),
        originalReleaseUTC: this.convertToUTC(data.releaseInfo.originalReleaseDate || data.releaseInfo.releaseDate, data.releaseInfo.releaseTime, data.releaseInfo.selectedTimezone),
        consumerReleaseUTC: this.convertToUTC(data.releaseInfo.consumerReleaseDate || data.releaseInfo.releaseDate, data.releaseInfo.releaseTime, data.releaseInfo.selectedTimezone),
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