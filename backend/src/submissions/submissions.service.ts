import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { DropboxService } from '../dropbox/dropbox.service';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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
      createdAt: new Date(),
      updatedAt: new Date(),

      // Artist info - Extract from artist object or direct fields
      artistName: data.artist?.nameKo || data.artistName || data.artist?.name || '',
      artistNameEn: data.artist?.nameEn || data.artistNameEn || data.artist?.name || '',
      labelName: data.artist?.labelName || data.labelName || '',
      genre: data.artist?.genre || data.genre || [],

      // Artist extended info - Extract from artist.artists array if present
      artistTranslations: data.artist?.artists?.[0]?.translations || data.artistTranslations || [],
      biography: data.artist?.biography || data.biography || '',
      socialLinks: data.artist?.socialLinks || data.socialLinks || {},
      artistType: data.artist?.type || data.artistType || 'SOLO',
      members: data.artist?.members || data.members || [],

      // Platform IDs - Extract from artist.artists[0].identifiers array
      spotifyId: data.artist?.artists?.[0]?.identifiers?.find?.((id: any) => id.type === 'spotify')?.value ||
                 data.artist?.spotifyId || data.spotifyId || '',
      appleMusicId: data.artist?.artists?.[0]?.identifiers?.find?.((id: any) => id.type === 'apple' || id.type === 'appleMusic')?.value ||
                    data.artist?.appleMusicId || data.appleMusicId || '',
      youtubeChannelId: data.artist?.artists?.[0]?.identifiers?.find?.((id: any) => id.type === 'youtube')?.value ||
                        data.artist?.youtubeChannelId || data.youtubeChannelId || '',
      
      // Album info - Extract from album object or direct fields
      albumTitle: data.album?.titleKo || data.albumTitle || '',
      albumTitleEn: data.album?.titleEn || data.albumTitleEn || data.albumTitle || '',
      albumType: data.album?.type?.toUpperCase() || data.albumType?.toUpperCase() || 'SINGLE',
      releaseDate: new Date(data.album?.releaseDate || data.releaseDate || Date.now()),
      albumVersion: data.album?.version || data.albumVersion || '',
      releaseVersion: data.releaseVersion || '',
      albumGenre: data.genre?.primary || data.primaryGenre || data.albumGenre || data.genre || [],
      albumSubgenre: data.genre?.primarySub || data.primarySubgenre || data.albumSubgenre || data.subgenre || [],
      albumDescription: data.album?.description || data.albumDescription || '',
      albumTranslations: data.album?.translations || data.albumTranslations || {},
      albumContributors: data.albumContributors || [],
      primaryTitle: data.primaryTitle || '',
      hasTranslation: data.hasTranslation || false,
      translationLanguage: data.translationLanguage || '',
      translatedTitle: data.translatedTitle || '',
      albumFeaturingArtists: data.albumFeaturingArtists || [],
      totalVolumes: data.totalVolumes || 1,
      albumNote: data.albumNote || '',
      explicitContent: data.explicitContent || false,
      displayArtist: data.displayArtist || data.artistName || '',
      
      // Tracks
      tracks: data.tracks?.map((track: any) => {
        // Deduplicate contributors by name within each track
        const uniqueContributors = track.contributors ?
          Array.from(
            new Map(track.contributors.map((c: any) => [c.name, c])).values()
          ) : [];

        return {
          id: track.id || track._id || uuidv4(),
          titleKo: track.titleKo || track.title || '',
          titleEn: track.titleEn || track.titleTranslation || track.title || '',
          titleTranslations: track.titleTranslations || {},
          artists: track.artists || [],
          featuringArtists: track.featuringArtists || [],
          contributors: uniqueContributors,
          composer: track.composer || '',
          lyricist: track.lyricist || '',
          arranger: track.arranger || '',
          isTitle: track.isTitle || false,
          isFocusTrack: track.isFocusTrack || false,
          isrc: track.isrc || '',
          musicVideoISRC: track.musicVideoISRC || '',
          hasMusicVideo: track.hasMusicVideo || false,
          explicitContent: track.explicitContent || track.explicit || false,
          dolbyAtmos: track.dolbyAtmos || false,
          stereo: track.stereo !== false,
          trackType: track.trackType || 'AUDIO',
          versionType: track.versionType || 'ORIGINAL',
          genre: track.genre || '',
          subgenre: track.subgenre || '',
          alternateGenre: track.alternateGenre || '',
          alternateSubgenre: track.alternateSubgenre || '',
          language: track.language || '',
          audioLanguage: track.audioLanguage || '',
          lyricsLanguage: track.lyricsLanguage || '',
          metadataLanguage: track.metadataLanguage || '',
          lyrics: track.lyrics || '',
          trackNumber: track.trackNumber,
          volume: track.volume,
          discNumber: track.discNumber,
          duration: track.duration || '',
          producer: track.producer || '',
          mixer: track.mixer || '',
          masterer: track.masterer || '',
          previewStart: track.previewStart || '',
          previewEnd: track.previewEnd || '',
          trackVersion: track.trackVersion || '',
          translations: track.translations || [],
          publishers: track.publishers || [],
          titleLanguage: track.titleLanguage || track.language || '',
          featuring: track.featuring || (track.featuringArtists?.map?.((a: any) => a.name).join(', ')) || '',
          hasCustomReleaseDate: track.hasCustomReleaseDate || false,
          customConsumerReleaseDate: track.consumerReleaseDate || '',
          customReleaseTime: track.releaseTime || '',
          playtimeStartShortClip: track.playtimeStartShortClip || '',
          previewLength: track.previewLength
        };
      }) || [],
      
      // Files - Map all file fields
      files: {
        coverImageUrl: data.files?.coverImageUrl,
        artistPhotoUrl: data.files?.artistPhotoUrl,
        motionArtUrl: data.files?.motionArtUrl,
        musicVideoUrl: data.files?.musicVideoUrl,
        audioFiles: data.files?.audioFiles?.map((af: any) => ({
          trackId: af.trackId,
          dropboxUrl: af.dropboxUrl || af.url,
          fileName: af.fileName,
          fileSize: af.fileSize
        })) || [],
        musicVideoFiles: data.files?.musicVideoFiles?.map((mvf: any) => ({
          trackId: mvf.trackId,
          dropboxUrl: mvf.dropboxUrl || mvf.url,
          fileName: mvf.fileName
        })) || [],
        musicVideoThumbnails: data.files?.musicVideoThumbnails?.map((mvt: any) => ({
          trackId: mvt.trackId,
          dropboxUrl: mvt.dropboxUrl || mvt.url,
          fileName: mvt.fileName
        })) || [],
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
          },
          ...(data.files?.additionalFiles || [])
        ].filter(Boolean)
      },
      
      // Release info with all 31 marketing fields
      release: {
        // Basic release fields
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
        // Copyright fields - store both original and formatted
        copyrightHolder: data.release?.copyrightHolder || data.copyrightHolder || '',
        copyrightYear: data.release?.copyrightYear || data.copyrightYear || new Date().getFullYear().toString(),
        productionHolder: data.release?.productionHolder || data.productionHolder || '',
        productionYear: data.release?.productionYear || data.productionYear || new Date().getFullYear().toString(),
        // Copyright transformation: combine holder + year
        cRights: data.release?.cRights || data.cRights ||
                 (data.release?.copyrightHolder || data.copyrightHolder
                   ? `© ${data.release?.copyrightYear || data.copyrightYear || new Date().getFullYear()} ${data.release?.copyrightHolder || data.copyrightHolder}`
                   : ''),
        pRights: data.release?.pRights || data.pRights ||
                 (data.release?.productionHolder || data.productionHolder
                   ? `℗ ${data.release?.productionYear || data.productionYear || new Date().getFullYear()} ${data.release?.productionHolder || data.productionHolder}`
                   : ''),
        upc: data.release?.upc || data.upc,
        catalogNumber: data.release?.catalogNumber || data.catalogNumber,

        // Default values for required fields
        artistName: data.release?.artistName || data.artistName || '',
        distributors: [],
        priceType: 'FREE',
        territoryType: 'WORLDWIDE',
        parentalAdvisory: 'NONE',
        releaseFormat: 'STANDARD',
        hasSyncHistory: data.release?.hasSyncHistory || data.releaseInfo?.hasSyncHistory || data.hasSyncHistory || false,
        isCompilation: data.release?.isCompilation || false,
        motionArtwork: data.release?.motionArtwork || false,
        preOrderEnabled: data.release?.preOrderEnabled || false,
        previouslyReleased: data.release?.previouslyReleased || false,
        thisIsPlaylist: data.release?.thisIsPlaylist || false,
        youtubeShortsPreviews: data.release?.youtubeShortsPreviews || false,
        moods: data.release?.moods || data.releaseInfo?.moods || data.moods || [],
        instruments: data.release?.instruments || data.releaseInfo?.instruments || data.instruments || [],
      },

      // All marketing fields stored in marketing JSON field
      // Note: data.marketingInfo can be empty object {}, so check if it has meaningful data
      marketing: (data.marketingInfo && Object.keys(data.marketingInfo).length > 0)
        ? {
            ...data.marketingInfo,
            // Merge with other sources for fields that might not be in marketingInfo
            artistBio: data.marketingInfo.artistBio || data.biography || '',
            spotifyArtistId: data.marketingInfo.artist_spotify_id || data.spotifyId || '',
            appleMusicArtistId: data.marketingInfo.artist_apple_id || data.appleMusicId || '',
            facebookUrl: data.marketingInfo.artist_facebook_url || data.socialLinks?.facebook || '',
            instagramUrl: data.marketingInfo.artist_instagram_handle || data.socialLinks?.instagram || '',
            youtubeUrl: data.marketingInfo.youtubeUrl || data.socialLinks?.youtube || '',
            tiktokUrl: data.marketingInfo.tiktokUrl || data.socialLinks?.tiktok || '',
          }
        : {
          // Fallback: extract from other sources if marketingInfo is empty
          // Album marketing
          albumIntroduction: data.marketingInfo?.albumIntroduction || data.release?.albumIntroduction || '',
        albumDescription: data.marketingInfo?.albumDescription || data.release?.albumDescription || data.albumDescription || '',
        marketingKeywords: data.marketingInfo?.marketingKeywords || data.release?.marketingKeywords || '',
        targetAudience: data.marketingInfo?.targetAudience || data.release?.targetAudience || '',
        promotionPlans: data.marketingInfo?.promotionPlans || data.release?.promotionPlans || '',

        // Artist info
        artistGender: data.marketingInfo?.artistGender || data.release?.artistGender || '',
        artistBio: data.marketingInfo?.artistBio || data.release?.artistBio || data.biography || '',
        artistCountry: data.marketingInfo?.artistCountry || data.release?.artistCountry || '',
        artistCurrentCity: data.marketingInfo?.artistCurrentCity || data.release?.artistCurrentCity || '',
        artistHometown: data.marketingInfo?.artistHometown || data.release?.artistHometown || '',
        artistAvatar: data.marketingInfo?.artistAvatar || data.release?.artistAvatar || '',
        artistLogo: data.marketingInfo?.artistLogo || data.release?.artistLogo || '',

        // Social movements
        socialMovements: data.marketingInfo?.socialMovements || data.release?.socialMovements || '',

        // DSP IDs
        spotifyArtistId: data.marketingInfo?.artist_spotify_id || data.spotifyId || '',
        appleMusicArtistId: data.marketingInfo?.artist_apple_id || data.appleMusicId || '',
        soundcloudArtistId: data.marketingInfo?.soundcloudArtistId || '',

        // URLs
        toundatesUrl: data.marketingInfo?.toundatesUrl || '',
        youtubeUrl: data.marketingInfo?.youtubeUrl || data.socialLinks?.youtube || '',
        tiktokUrl: data.marketingInfo?.tiktokUrl || data.socialLinks?.tiktok || '',
        facebookUrl: data.marketingInfo?.artist_facebook_url || data.socialLinks?.facebook || '',
        instagramUrl: data.marketingInfo?.artist_instagram_handle || data.socialLinks?.instagram || '',
        xUrl: data.marketingInfo?.xUrl || data.socialLinks?.twitter || '',
        twitchUrl: data.marketingInfo?.twitchUrl || data.socialLinks?.twitch || '',
        threadsUrl: data.marketingInfo?.threadsUrl || '',

        // Marketing content
        hook: data.marketingInfo?.hook || '',
        mainPitch: data.marketingInfo?.mainPitch || '',
        similarArtists: data.marketingInfo?.similarArtists || '',
        syncHistory: data.marketingInfo?.syncHistory || '',
        artistUgcPriorities: data.marketingInfo?.artistUgcPriorities || '',
        marketingDrivers: data.marketingInfo?.marketingDrivers || '',
        socialMediaPlan: data.marketingInfo?.socialMediaPlan || '',

        // Music characteristics
        moods: data.marketingInfo?.moods || [],
        instruments: data.marketingInfo?.instruments || [],

        // Press materials
        pressShotUrl: data.marketingInfo?.pressShotUrl || '',
        pressShotCredits: data.marketingInfo?.pressShotCredits || '',

        // Goals & project info
        priorityLevel: data.marketingInfo?.priorityLevel,
        projectType: data.marketingInfo?.projectType,
        campaignGoals: data.marketingInfo?.campaignGoals || [],

        // Internal notes
        pr_line: data.marketingInfo?.pr_line || '',
        internal_note: data.marketingInfo?.internal_note || ''
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
      updateData.tracks = data.tracks.map((track: any) => {
        // Deduplicate contributors by name within each track
        const uniqueContributors = track.contributors ?
          Array.from(
            new Map(track.contributors.map((c: any) => [c.name, c])).values()
          ) : [];

        return {
          id: track.id,
          titleKo: track.titleKo,
          titleEn: track.titleEn,
          artists: track.artists || [],
          featuringArtists: track.featuringArtists || [],
          contributors: uniqueContributors,  // ✅ Added with deduplication
          composer: track.composer,
          lyricist: track.lyricist,
          arranger: track.arranger,
          isTitle: track.isTitle,
          isrc: track.isrc,
          explicitContent: track.explicitContent,
          dolbyAtmos: track.dolbyAtmos,
          genre: track.genre,
          subgenre: track.subgenre,
        };
      });
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

  async updateMarketing(id: string, marketingData: any) {
    // Get current submission
    const current = await this.prisma.submission.findUnique({ where: { id } });
    if (!current) throw new Error('Submission not found');

    // Update submission with marketing fields
    const updateData: any = {};

    if (marketingData.hook !== undefined) updateData.hook = marketingData.hook;
    if (marketingData.mainPitch !== undefined) updateData.mainPitch = marketingData.mainPitch;
    if (marketingData.moods !== undefined) updateData.moods = marketingData.moods;
    if (marketingData.instruments !== undefined) updateData.instruments = marketingData.instruments;
    if (marketingData.socialMediaPlan !== undefined) updateData.socialMediaPlan = marketingData.socialMediaPlan;
    if (marketingData.marketingDrivers !== undefined) updateData.marketingDrivers = marketingData.marketingDrivers;
    if (marketingData.tracks !== undefined) updateData.tracks = marketingData.tracks;

    // Update release fields
    if (marketingData.release) {
      updateData.release = {
        ...current.release,
        ...marketingData.release
      };
    }

    return this.prisma.submission.update({
      where: { id },
      data: updateData
    });
  }
}