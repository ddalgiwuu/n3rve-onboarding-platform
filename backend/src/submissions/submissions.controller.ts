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
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, Prisma } from '@prisma/client';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { FilesService } from '../files/files.service';
import { DropboxService } from '../dropbox/dropbox.service';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
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
    ]),
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
    // Handle both FormData and JSON payloads
    let submissionData;
    if (body.releaseData && typeof body.releaseData === 'string') {
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
        tracks: releaseData.tracks || [],
        release: {
          consumerReleaseDate: releaseData.consumerReleaseDate,
          originalReleaseDate: releaseData.originalReleaseDate,
          releaseTime: releaseData.releaseTime,
          timezone: releaseData.timezone,
          consumerReleaseUTC: releaseData.consumerReleaseUTC,
          originalReleaseUTC: releaseData.originalReleaseUTC,
          upc: releaseData.upc,
          ean: releaseData.ean,
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
    if (
      submissionData.files &&
      (submissionData.files.coverImageUrl || submissionData.files.audioFiles)
    ) {
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
      // Upload files to Dropbox if configured
      if (this.dropboxService.isConfigured() && files) {
        try {
          const submissionId = Date.now().toString(); // Create a unique submission ID
          const artistName = submissionData.artist?.nameKo || 'Unknown Artist';
          const albumTitle = submissionData.album?.titleKo || 'Unknown Album';
          
          const dropboxFiles = [];
          
          // Upload cover image
          if (files.coverImage?.[0]) {
            dropboxFiles.push({
              buffer: files.coverImage[0].buffer,
              fileName: files.coverImage[0].originalname,
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
            files.audioFiles.forEach(file => {
              dropboxFiles.push({
                buffer: file.buffer,
                fileName: file.originalname,
                fileType: 'audio'
              });
            });
          }
          
          // Upload motion art
          if (files.motionArt?.[0] || files.motionArtFile?.[0]) {
            const motionFile = files.motionArt?.[0] || files.motionArtFile?.[0];
            dropboxFiles.push({
              buffer: motionFile.buffer,
              fileName: motionFile.originalname,
              fileType: 'motion'
            });
          }
          
          // Upload music video
          if (files.musicVideo?.[0] || files.musicVideoFiles?.[0]) {
            const videoFile = files.musicVideo?.[0] || files.musicVideoFiles?.[0];
            dropboxFiles.push({
              buffer: videoFile.buffer,
              fileName: videoFile.originalname,
              fileType: 'video'
            });
          }
          
          // Upload all files to Dropbox
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
            additionalFiles: []
          };
          
          console.log('Files uploaded to Dropbox successfully:', dropboxResults);
        } catch (error) {
          console.error('Error uploading to Dropbox, falling back to local storage:', error);
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

      // Artist Information
      artistName: submissionData.artist?.nameKo || '',
      artistNameEn: submissionData.artist?.nameEn,
      labelName: submissionData.artist?.labelName,
      genre: submissionData.artist?.genre || [],
      biography: submissionData.artist?.biography,
      artistType: 'SOLO', // Default, can be enhanced based on artist data

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

      // Tracks with all fields from consumer form
      tracks:
        submissionData.tracks?.map((track, index) => ({
          id: track.id || `track-${index + 1}`,
          titleKo: track.titleKo || track.title || '',
          titleEn: track.titleEn || track.title || '',
          composer: track.composer || '',
          lyricist: track.lyricist || '',
          arranger: track.arranger,
          featuring: track.featuring || track.featuringArtists?.join(', '),
          isTitle: track.isTitle || false,
          explicitContent: track.explicitContent || false,
          isrc: track.isrc,
          genre: track.genre,
          subgenre: track.subgenre,
          alternateGenre: track.alternateGenre,
          alternateSubgenre: track.alternateSubgenre,
          lyrics: track.lyrics,
          lyricsLanguage: track.lyricsLanguage,
          audioLanguage: track.audioLanguage,
          metadataLanguage: track.metadataLanguage,
          dolbyAtmos: track.dolbyAtmos || false,
          producer: track.producer,
          mixer: track.mixer,
          masterer: track.masterer,
          previewStart: track.previewStart,
          previewEnd: track.previewEnd,
          trackVersion: track.trackVersion,
          trackType: track.trackType?.toUpperCase() || 'AUDIO',
          translations: track.translations || [],
        })) || [],

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
        audioFiles: processedFiles.audioFiles.map((file: any) => ({
          trackId:
            file.trackId ||
            `track-${processedFiles.audioFiles.indexOf(file) + 1}`,
          dropboxUrl: file.dropboxUrl,
          fileName: file.fileName || file.filename,
          fileSize: file.fileSize,
        })),
        additionalFiles: processedFiles.additionalFiles.map((file: any) => ({
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
        price: submissionData.release?.price,
        copyrightHolder: submissionData.release?.copyrightHolder,
        copyrightYear:
          submissionData.release?.copyrightYear ||
          new Date().getFullYear().toString(),
        recordingCountry: submissionData.release?.recordingCountry || 'KR',
        recordingLanguage: submissionData.release?.recordingLanguage || 'ko',
        cRights: submissionData.release?.cRights || submissionData.release?.copyrightHolder || '',
        pRights: submissionData.release?.pRights || submissionData.release?.productionHolder || '',
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
        ean: submissionData.release?.ean,
        catalogNumber: submissionData.release?.catalogNumber,
        notes: submissionData.release?.notes,
        albumNotes: submissionData.release?.albumNotes,
        parentalAdvisory:
          submissionData.release?.parentalAdvisory?.toUpperCase() || 'NONE',
        preOrderEnabled: submissionData.release?.preOrderEnabled || false,
        preOrderDate: submissionData.release?.preOrderDate,
        releaseFormat:
          submissionData.release?.releaseFormat?.toUpperCase() || 'STANDARD',
        isCompilation: submissionData.release?.isCompilation || false,
        previouslyReleased: submissionData.release?.previouslyReleased || false,
        previousReleaseDate: submissionData.release?.previousReleaseDate,
        previousReleaseInfo: submissionData.release?.previousReleaseInfo,
        trackGenres: submissionData.release?.trackGenres,
        dspProfileUpdate: submissionData.release?.dspProfileUpdate,
        
        // All 31 marketing fields from marketingInfo
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

    return this.submissionsService.create(user.id, prismaData);
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

    const result = await this.submissionsService.findByUser(user.id, {
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
    const submission = await this.submissionsService.findOne(id, user.id, user.role === 'ADMIN');

    // Users can only view their own submissions unless they're admin
    if (submission.submitterId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('Unauthorized to view this submission');
    }

    return submission;
  }
}
