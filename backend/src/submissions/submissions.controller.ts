import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
  Patch,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, Prisma } from '@prisma/client';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { FilesService } from '../files/files.service';
import { DropboxService } from '../dropbox/dropbox.service';
import { Logger } from '@nestjs/common';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  private readonly logger = new Logger(SubmissionsController.name);

  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly filesService: FilesService,
    private readonly dropboxService: DropboxService,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverArt', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
      { name: 'artistPhoto', maxCount: 1 },
      { name: 'audioFiles', maxCount: 50 },
      { name: 'dolbyAtmosFiles', maxCount: 50 },
      { name: 'additionalFiles', maxCount: 10 },
      { name: 'motionArt', maxCount: 1 },
      { name: 'motionArtFile', maxCount: 1 },
      { name: 'musicVideo', maxCount: 1 },
      { name: 'musicVideoFiles', maxCount: 10 },
      { name: 'musicVideoThumbnails', maxCount: 10 },
      { name: 'lyricsFiles', maxCount: 50 },
      { name: 'marketingAssets', maxCount: 20 },
    ], {
      limits: { fileSize: 500 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(wav|mp3|flac|aiff|aac|ogg|jpg|jpeg|png|gif|webp|mp4|mov|avi|pdf|doc|docx|xlsx)$/i;
        if (!allowed.test(file.originalname)) {
          cb(new Error('Invalid file type'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async create(
    @CurrentUser() user: User,
    @Body() body: any,
    @UploadedFiles()
    files?: {
      coverArt?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
      artistPhoto?: Express.Multer.File[];
      audioFiles?: Express.Multer.File[];
      dolbyAtmosFiles?: Express.Multer.File[];
      additionalFiles?: Express.Multer.File[];
      motionArt?: Express.Multer.File[];
      motionArtFile?: Express.Multer.File[];
      musicVideo?: Express.Multer.File[];
      musicVideoFiles?: Express.Multer.File[];
      musicVideoThumbnails?: Express.Multer.File[];
      lyricsFiles?: Express.Multer.File[];
      marketingAssets?: Express.Multer.File[];
    },
  ) {
    try {
      this.logger.log('Submission creation started');

      // Handle both FormData and JSON payloads
      let submissionData;
      if (body.releaseData && typeof body.releaseData === 'string') {
        this.logger.debug('Parsing FormData submission');
      // FormData submission from consumer form - parse the JSON releaseData field
      const releaseData = JSON.parse(body.releaseData);
      submissionData = {
        artist: {
          nameKo: releaseData.albumArtist,
          nameEn: releaseData.albumArtist,
          labelName: releaseData.recordLabel,
          artists: releaseData.albumArtists || [],
        },
        album: {
          titleKo: releaseData.albumTitle,
          titleEn: releaseData.albumTitle,
          type: releaseData.releaseType?.toLowerCase() || 'single',
          version: releaseData.albumVersion,
        },
        albumFeaturingArtists: releaseData.albumFeaturingArtists || [],
        totalVolumes: releaseData.totalVolumes || 1,
        albumNote: releaseData.albumNote || '',
        explicitContent: releaseData.explicitContent || false,
        displayArtist: releaseData.displayArtist || releaseData.albumArtist || '',
        tracks: releaseData.tracks || [],
        release: {
          consumerReleaseDate: releaseData.consumerReleaseDate,
          originalReleaseDate: releaseData.originalReleaseDate,
          releaseTime: releaseData.releaseTime,
          timezone: releaseData.timezone,
          consumerReleaseUTC: releaseData.consumerReleaseUTC,
          originalReleaseUTC: releaseData.originalReleaseUTC,
          upc: releaseData.upc,
          catalogNumber: releaseData.catalogNumber,
          copyrightHolder: releaseData.copyrightHolder,
          copyrightYear: releaseData.copyrightYear,
          productionHolder: releaseData.productionHolder,
          productionYear: releaseData.productionYear,
          distributionType: releaseData.distributionType,
          selectedStores: releaseData.selectedStores,
          excludedStores: releaseData.excludedStores,
          territories: releaseData.territories,
          excludedTerritories: releaseData.excludedTerritories,
          previouslyReleased: releaseData.previouslyReleased,
        },
        marketingInfo: releaseData.marketingInfo || {},
        genre: {
          primary: releaseData.primaryGenre,
          primarySub: releaseData.primarySubgenre,
          secondary: releaseData.secondaryGenre,
          secondarySub: releaseData.secondarySubgenre,
        },
        language: releaseData.language,
      };
    } else if (body.data && typeof body.data === 'string') {
      // Legacy FormData submission - parse the JSON data field
      submissionData = JSON.parse(body.data);
    } else if (body.artist || body.album || body.tracks) {
      // Direct JSON submission (with Dropbox URLs)
      submissionData = body;
    } else {
      // Legacy CreateSubmissionDto format
      submissionData = {
        artist: {
          nameKo: body.artistName,
          nameEn: body.artistNameEn,
          labelName: body.recordLabel,
          genre: body.genre || [],
          biography: body.artistBio,
        },
        album: {
          titleKo: body.albumTitle,
          titleEn: body.albumTitleEn,
          type: body.albumType?.toLowerCase(),
          releaseDate: body.releaseDate,
          description: body.albumDescription,
        },
        tracks: body.tracks || [],
        release: body.release || {},
        files: body.files || {},
      };
    }
    // Process files - handle both local uploads and Dropbox URLs from the submission
    let processedFiles;

    this.logger.debug('Processing submission files');

    // Check if we have Dropbox URLs from frontend OR need to process local files
    const hasDropboxUrls = submissionData.files &&
      (submissionData.files.coverImageUrl || submissionData.files.audioFiles?.length > 0);
    const hasLocalFiles = files && (files.coverArt || files.audioFiles);


    if (hasDropboxUrls && !hasLocalFiles) {
      this.logger.debug('Using Dropbox URLs from frontend');
      // Files already contain Dropbox URLs from frontend
      processedFiles = {
        coverImage: submissionData.files.coverImageUrl
          ? { dropboxUrl: submissionData.files.coverImageUrl }
          : undefined,
        artistPhoto: submissionData.files.artistPhotoUrl
          ? { dropboxUrl: submissionData.files.artistPhotoUrl }
          : undefined,
        motionArt: submissionData.files.motionArtUrl
          ? { dropboxUrl: submissionData.files.motionArtUrl }
          : undefined,
        musicVideo: submissionData.files.musicVideoUrl
          ? { dropboxUrl: submissionData.files.musicVideoUrl }
          : undefined,
        audioFiles: submissionData.files.audioFiles || [],
        additionalFiles: submissionData.files.additionalFiles || [],
      };
    } else {
      this.logger.debug('Processing local files');

      // Upload files to Dropbox if configured
      if (this.dropboxService.isConfigured() && files) {
        this.logger.debug('Using Dropbox upload path');
        try {
          const submissionId = Date.now().toString(); // Create a unique submission ID
          const artistName = submissionData.artist?.nameKo || 'Unknown Artist';
          const albumTitle = submissionData.album?.titleKo || 'Unknown Album';
          
          const dropboxFiles: { buffer: Buffer; fileName: string; fileType: string }[] = [];
          
          // Upload cover image (check both coverArt and coverImage)
          const coverFile = files.coverArt?.[0] || files.coverImage?.[0];
          if (coverFile) {
            dropboxFiles.push({
              buffer: coverFile.buffer,
              fileName: coverFile.originalname,
              fileType: 'cover'
            });
          }
          
          // Upload artist photo
          if (files.artistPhoto?.[0]) {
            dropboxFiles.push({
              buffer: files.artistPhoto[0].buffer,
              fileName: files.artistPhoto[0].originalname,
              fileType: 'artist'
            });
          }
          
          // Upload audio files
          if (files.audioFiles) {
            files.audioFiles.forEach((file, index) => {
              dropboxFiles.push({
                buffer: file.buffer,
                fileName: file.originalname,
                fileType: `audio_${index}`
              });
            });
          } else {
          }
          
          // Upload motion art
          if (files.motionArt?.[0] || files.motionArtFile?.[0]) {
            const motionFile = files.motionArt?.[0] || files.motionArtFile?.[0];
            if (motionFile) {
              dropboxFiles.push({
                buffer: motionFile.buffer,
                fileName: motionFile.originalname,
                fileType: 'motion'
              });
            }
          }
          
          // Upload music videos (track-level)
          if (files.musicVideoFiles) {
            files.musicVideoFiles.forEach((videoFile, index) => {
              dropboxFiles.push({
                buffer: videoFile.buffer,
                fileName: videoFile.originalname,
                fileType: `video_track_${index}`
              });
            });
          }

          // Upload music video thumbnails (track-level)
          if (files.musicVideoThumbnails) {
            files.musicVideoThumbnails.forEach((thumbnailFile, index) => {
              dropboxFiles.push({
                buffer: thumbnailFile.buffer,
                fileName: thumbnailFile.originalname,
                fileType: `video_thumbnail_${index}`
              });
            });
          }
          
          // Upload all files to Dropbox
          this.logger.log(`Uploading ${dropboxFiles.length} files to Dropbox`);
          const dropboxResults = await this.dropboxService.uploadMultipleFiles(
            dropboxFiles,
            submissionId,
            artistName,
            albumTitle
          );


          // Process the results to match expected format
          processedFiles = {
            coverImage: dropboxResults.cover ? {
              dropboxUrl: dropboxResults.cover.url,
              path: dropboxResults.cover.path
            } : undefined,
            artistPhoto: dropboxResults.artist ? {
              dropboxUrl: dropboxResults.artist.url,
              path: dropboxResults.artist.path
            } : undefined,
            motionArt: dropboxResults.motion ? {
              dropboxUrl: dropboxResults.motion.url,
              path: dropboxResults.motion.path
            } : undefined,
            musicVideo: dropboxResults.video ? {
              dropboxUrl: dropboxResults.video.url,
              path: dropboxResults.video.path
            } : undefined,
            audioFiles: Object.entries(dropboxResults)
              .filter(([key]) => key.startsWith('audio'))
              .map(([_, value]: [string, any]) => ({
                dropboxUrl: value.url,
                path: value.path,
                fileName: value.path.split('/').pop()
              })),
            musicVideoFiles: Object.entries(dropboxResults)
              .filter(([key]) => key.startsWith('video_track_'))
              .map(([key, value]: [string, any]) => {
                const trackIndex = parseInt(key.replace('video_track_', ''));
                return {
                  trackId: body.tracks?.[trackIndex]?.id,
                  dropboxUrl: value.url,
                  path: value.path,
                  fileName: value.path.split('/').pop()
                };
              }),
            musicVideoThumbnails: Object.entries(dropboxResults)
              .filter(([key]) => key.startsWith('video_thumbnail_'))
              .map(([key, value]: [string, any]) => {
                const trackIndex = parseInt(key.replace('video_thumbnail_', ''));
                return {
                  trackId: body.tracks?.[trackIndex]?.id,
                  dropboxUrl: value.url,
                  path: value.path,
                  fileName: value.path.split('/').pop()
                };
              }),
            additionalFiles: []
          };
          
          this.logger.log('Files uploaded to Dropbox successfully');
        } catch (error) {
          this.logger.warn('Dropbox upload failed, falling back to local storage');
          // Fall back to local file processing
          processedFiles = this.filesService.processSubmissionFiles(
            files ? Object.values(files).flat() : [],
            {}
          );
        }
      } else {
        // Process local file uploads
        processedFiles = this.filesService.processSubmissionFiles(
          files ? Object.values(files).flat() : [],
          {
            coverImage: body.coverImageDropboxUrl,
            artistPhoto: body.artistPhotoDropboxUrl,
            audioFiles: body.tracks
              ?.map((t) => t.dropboxUrl)
              .filter(Boolean) as string[],
            additionalFiles: body.additionalFileDropboxUrls,
            motionArt: body.motionArtDropboxUrl,
            musicVideo: body.musicVideoDropboxUrl,
          },
        );
      }
    }

    // Build submission data for Prisma
    const prismaData: Prisma.SubmissionCreateInput = {
      submitterEmail: user.email,
      submitterName: user.name,
      submitter: {
        connect: { id: user.id },
      },
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),

      // Artist Information - Extract from albumArtists if available
      artistName: submissionData.artist?.nameKo ||
                  submissionData.artist?.artists?.[0]?.name || '',
      artistNameEn: submissionData.artist?.nameEn ||
                    submissionData.artist?.artists?.[0]?.name || '',
      labelName: submissionData.artist?.labelName,
      genre: submissionData.artist?.genre || [],
      biography: submissionData.artist?.biography,
      artistType: submissionData.artist?.type || 'SOLO',

      // Extract platform IDs from albumArtists[0] if available
      spotifyId: submissionData.artist?.artists?.[0]?.spotifyId || '',
      appleMusicId: submissionData.artist?.artists?.[0]?.appleId || '',

      // Extract translations from albumArtists[0]
      artistTranslations: submissionData.artist?.artists?.[0]?.translations || {},

      // Extract social links if available
      socialLinks: submissionData.artist?.socialLinks || {},

      // Album Information
      albumTitle:
        submissionData.album?.titleKo ||
        submissionData.album?.primaryTitle ||
        '',
      albumTitleEn: submissionData.album?.titleEn,
      albumType: submissionData.album?.type?.toUpperCase() || 'SINGLE',
      albumDescription: submissionData.album?.description,
      releaseDate: new Date(
        submissionData.album?.releaseDate ||
          submissionData.release?.consumerReleaseDate ||
          Date.now(),
      ),
      albumTranslations: submissionData.album?.translations || [],
      albumFeaturingArtists: submissionData.albumFeaturingArtists || [],
      totalVolumes: submissionData.totalVolumes || 1,
      albumNote: submissionData.albumNote || '',
      explicitContent: submissionData.explicitContent || false,
      displayArtist: submissionData.displayArtist || submissionData.artist?.nameKo || '',

      // Tracks with all fields from consumer form
      tracks:
        submissionData.tracks?.map((track, index) => {
          // Remove file-related fields that don't belong in Track type
          const { audioFiles, musicVideoFile, musicVideoThumbnail, lyricsFile, ...trackData } = track;

          return {
            id: trackData.id || `track-${index + 1}`,
            titleKo: trackData.titleKo || trackData.title || '',
            titleEn: trackData.titleEn || trackData.title || '',
            composer: trackData.composer || '',
            lyricist: trackData.lyricist || '',
            arranger: trackData.arranger,
            featuring: trackData.featuring || trackData.featuringArtists?.join(', '),
            isTitle: trackData.isTitle || false,
            explicitContent: trackData.explicitContent || false,
            isrc: trackData.isrc,
            genre: trackData.genre,
            subgenre: trackData.subgenre,
            alternateGenre: trackData.alternateGenre,
            alternateSubgenre: trackData.alternateSubgenre,
            lyrics: trackData.lyrics,
            lyricsLanguage: trackData.lyricsLanguage,
            audioLanguage: trackData.audioLanguage,
            metadataLanguage: trackData.metadataLanguage,
            dolbyAtmos: trackData.dolbyAtmos || false,
            producer: trackData.producer,
            mixer: trackData.mixer,
            masterer: trackData.masterer,
            previewStart: trackData.previewStart,
            previewEnd: trackData.previewEnd,
            trackVersion: trackData.trackVersion,
            trackType: trackData.trackType?.toUpperCase() || 'AUDIO',
            versionType: trackData.versionType || 'ORIGINAL',
            stereo: trackData.stereo !== false,
            isFocusTrack: trackData.isFocusTrack || false,
            titleTranslations: trackData.titleTranslations || {},
            language: trackData.language,
            trackNumber: trackData.trackNumber,
            volume: trackData.volume,
            discNumber: trackData.discNumber,
            duration: trackData.duration,
            musicVideoISRC: trackData.musicVideoISRC,
            hasMusicVideo: trackData.hasMusicVideo || false,
            translations: trackData.translations || [],
            artists: trackData.artists || [],
            featuringArtists: trackData.featuringArtists || [],
            contributors: trackData.contributors || [],
            publishers: trackData.publishers || [],
            titleLanguage: trackData.titleLanguage || trackData.language,
            hasCustomReleaseDate: trackData.hasCustomReleaseDate || false,
            customConsumerReleaseDate: trackData.consumerReleaseDate || '',
            customReleaseTime: trackData.releaseTime || '',
            playtimeStartShortClip: trackData.playtimeStartShortClip || '',
            previewLength: trackData.previewLength
          };
        }) || [],

      // Files
      files: {
        coverImageUrl:
          processedFiles.coverImage?.dropboxUrl ||
          processedFiles.coverImage?.path,
        artistPhotoUrl:
          processedFiles.artistPhoto?.dropboxUrl ||
          processedFiles.artistPhoto?.path,
        motionArtUrl:
          processedFiles.motionArt?.dropboxUrl ||
          processedFiles.motionArt?.path,
        musicVideoUrl:
          processedFiles.musicVideo?.dropboxUrl ||
          processedFiles.musicVideo?.path,
        audioFiles: (processedFiles.audioFiles || []).map((file: any) => ({
          trackId:
            file.trackId ||
            `track-${(processedFiles.audioFiles || []).indexOf(file) + 1}`,
          dropboxUrl: file.dropboxUrl,
          fileName: file.fileName || file.filename,
          fileSize: file.fileSize,
        })),
        additionalFiles: (processedFiles.additionalFiles || []).map((file: any) => ({
          dropboxUrl: file.dropboxUrl,
          fileName: file.fileName || file.filename,
          fileType: file.fileType || file.mimetype,
          fileSize: file.fileSize,
        })),
      },

      // Release Information - all fields from consumer form
      release: {
        territories: submissionData.release?.territories || ['WORLDWIDE'],
        territoryType:
          submissionData.release?.territoryType?.toUpperCase() || 'WORLDWIDE',
        distributors: submissionData.release?.distributors || [],
        priceType: submissionData.release?.priceType?.toUpperCase() || 'PAID',
        copyrightHolder: submissionData.release?.copyrightHolder,
        copyrightYear:
          submissionData.release?.copyrightYear ||
          new Date().getFullYear().toString(),
        productionHolder: submissionData.release?.productionHolder,
        productionYear:
          submissionData.release?.productionYear ||
          new Date().getFullYear().toString(),
        recordingCountry: submissionData.release?.recordingCountry || 'KR',
        recordingLanguage: submissionData.release?.recordingLanguage || 'ko',
        // Copyright transformation: combine holder + year into standard format
        cRights: submissionData.release?.cRights ||
                 (submissionData.release?.copyrightHolder
                   ? `© ${submissionData.release?.copyrightYear || new Date().getFullYear()} ${submissionData.release?.copyrightHolder}`
                   : ''),
        pRights: submissionData.release?.pRights ||
                 (submissionData.release?.productionHolder
                   ? `℗ ${submissionData.release?.productionYear || new Date().getFullYear()} ${submissionData.release?.productionHolder}`
                   : ''),
        originalReleaseDate:
          submissionData.release?.originalReleaseDate ||
          new Date().toISOString(),
        consumerReleaseDate:
          submissionData.release?.consumerReleaseDate ||
          new Date().toISOString(),
        releaseTime: submissionData.release?.releaseTime,
        selectedTimezone: submissionData.release?.selectedTimezone || submissionData.release?.timezone,
        // UTC fields
        consumerReleaseUTC: submissionData.release?.consumerReleaseUTC,
        originalReleaseUTC: submissionData.release?.originalReleaseUTC,
        upc: submissionData.release?.upc,
        catalogNumber: submissionData.release?.catalogNumber,
        parentalAdvisory:
          submissionData.release?.parentalAdvisory?.toUpperCase() || 'NONE',
        preOrderEnabled: submissionData.release?.preOrderEnabled || false,
        releaseFormat:
          submissionData.release?.releaseFormat?.toUpperCase() || 'STANDARD',
        isCompilation: submissionData.release?.isCompilation || false,
        previouslyReleased: submissionData.release?.previouslyReleased || false,
      },
      
      // Marketing info stored separately (not in release object)
      marketing: {
        albumIntroduction: submissionData.marketingInfo?.albumIntroduction,
        albumDescription: submissionData.marketingInfo?.albumDescription,
        marketingKeywords: submissionData.marketingInfo?.marketingKeywords,
        targetAudience: submissionData.marketingInfo?.targetAudience,
        promotionPlans: submissionData.marketingInfo?.promotionPlans,
        toundatesUrl: submissionData.marketingInfo?.toundatesUrl,
        artistGender: submissionData.marketingInfo?.artistGender,
        socialMovements: submissionData.marketingInfo?.socialMovements,
        artistBio: submissionData.marketingInfo?.artistBio,
        similarArtists: submissionData.marketingInfo?.similarArtists,
        hasSyncHistory: submissionData.marketingInfo?.hasSyncHistory || false,
        syncHistory: submissionData.marketingInfo?.syncHistory,
        spotifyArtistId: submissionData.marketingInfo?.spotifyArtistId,
        appleMusicArtistId: submissionData.marketingInfo?.appleMusicArtistId,
        soundcloudArtistId: submissionData.marketingInfo?.soundcloudArtistId,
        artistUgcPriorities: submissionData.marketingInfo?.artistUgcPriorities,
        youtubeUrl: submissionData.marketingInfo?.youtubeUrl,
        tiktokUrl: submissionData.marketingInfo?.tiktokUrl,
        facebookUrl: submissionData.marketingInfo?.facebookUrl,
        instagramUrl: submissionData.marketingInfo?.instagramUrl,
        xUrl: submissionData.marketingInfo?.xUrl,
        twitchUrl: submissionData.marketingInfo?.twitchUrl,
        threadsUrl: submissionData.marketingInfo?.threadsUrl,
        moods: submissionData.marketingInfo?.moods || [],
        instruments: submissionData.marketingInfo?.instruments || [],
        hook: submissionData.marketingInfo?.hook,
        mainPitch: submissionData.marketingInfo?.mainPitch,
        marketingDrivers: submissionData.marketingInfo?.marketingDrivers,
        socialMediaPlan: submissionData.marketingInfo?.socialMediaPlan,
        artistName: submissionData.marketingInfo?.artistName || submissionData.artist?.nameKo,
        artistCountry: submissionData.marketingInfo?.artistCountry,
        artistCurrentCity: submissionData.marketingInfo?.artistCurrentCity,
        artistHometown: submissionData.marketingInfo?.artistHometown,
        artistAvatar: submissionData.marketingInfo?.artistAvatar,
        artistLogo: submissionData.marketingInfo?.artistLogo,
        pressShotUrl: submissionData.marketingInfo?.pressShotUrl,
        pressShotCredits: submissionData.marketingInfo?.pressShotCredits,
      },

      // Submission Metadata
      adminNotes: body.submissionNotes,
    };

      const result = await this.submissionsService.create(user.id, prismaData);
      this.logger.log('Submission created successfully');
      return result;
    } catch (error) {
      this.logger.error('Submission creation failed', error.message);
      throw error;
    }
  }

  @Get('user')
  async findUserSubmissions(
    @CurrentUser() user: User,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (pageNum - 1) * limitNum;

    const result = user.isCompanyAccount
      ? await this.submissionsService.findByLabelAccount(user.id, {
          page: pageNum,
          limit: limitNum,
        })
      : await this.submissionsService.findByUser(user.id, {
          page: pageNum,
          limit: limitNum,
        });

    return {
      data: result.submissions,
      total: result.total,
      page: pageNum,
      totalPages: Math.ceil(result.total / limitNum),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    const isAdmin = user.role === 'ADMIN';
    const submission = await this.submissionsService.findOne(id, user.id, isAdmin);

    if (!isAdmin) {
      const isOwner = user.isCompanyAccount
        ? submission.labelAccountId === user.id
        : submission.submitterId === user.id;

      if (!isOwner) {
        throw new BadRequestException('Unauthorized to view this submission');
      }
    }

    return submission;
  }

  @Patch(':id/marketing')
  async updateMarketing(
    @Param('id') id: string,
    @Body() marketingData: any,
    @CurrentUser() user: User
  ) {
    // Verify ownership
    const isAdmin = user.role === 'ADMIN';
    const submission = await this.submissionsService.findOne(id, user.id, isAdmin);

    if (!isAdmin) {
      const isOwner = user.isCompanyAccount
        ? submission.labelAccountId === user.id
        : submission.submitterId === user.id;

      if (!isOwner) {
        throw new BadRequestException('Unauthorized to update this submission');
      }
    }

    // Update marketing fields
    return this.submissionsService.updateMarketing(id, marketingData);
  }
}
