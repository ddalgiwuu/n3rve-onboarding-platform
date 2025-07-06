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

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'artistPhoto', maxCount: 1 },
      { name: 'audioFiles', maxCount: 10 },
      { name: 'additionalFiles', maxCount: 5 },
      { name: 'motionArt', maxCount: 1 },
      { name: 'musicVideo', maxCount: 1 },
    ]),
  )
  async create(
    @CurrentUser() user: User,
    @Body() body: any,
    @UploadedFiles()
    files?: {
      coverImage?: Express.Multer.File[];
      artistPhoto?: Express.Multer.File[];
      audioFiles?: Express.Multer.File[];
      additionalFiles?: Express.Multer.File[];
      motionArt?: Express.Multer.File[];
      musicVideo?: Express.Multer.File[];
    },
  ) {
    // Handle both FormData and JSON payloads
    let submissionData;
    if (body.data && typeof body.data === 'string') {
      // FormData submission - parse the JSON data field
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
        cRights: submissionData.release?.cRights || '',
        pRights: submissionData.release?.pRights || '',
        originalReleaseDate:
          submissionData.release?.originalReleaseDate ||
          new Date().toISOString(),
        consumerReleaseDate:
          submissionData.release?.consumerReleaseDate ||
          new Date().toISOString(),
        releaseTime: submissionData.release?.releaseTime,
        selectedTimezone: submissionData.release?.selectedTimezone,
        upc: submissionData.release?.upc,
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
