import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalLogDto } from './dto/external-log.dto';
import { ExternalMetadataDto } from './dto/external-metadata.dto';
import { ExternalSubmissionDto } from './dto/external-submission.dto';
import { QCGateway } from '../websocket/qc.gateway';

@Injectable()
export class ExternalService {
  constructor(
    private prisma: PrismaService,
    private qcGateway: QCGateway,
  ) {}

  private async findSubmissionByUPC(upc: string) {
    // release is a composite type, not a relation - filter in memory same as feature-reports pattern
    const allSubmissions = await this.prisma.submission.findMany();
    const submission = allSubmissions.find(
      (s) => (s.release as any)?.upc === upc,
    );

    if (!submission) {
      throw new NotFoundException(`Submission with UPC ${upc} not found`);
    }

    return submission;
  }

  async pushLogs(dto: ExternalLogDto) {
    const submission = await this.findSubmissionByUPC(dto.upc);

    // Auto-map label account if not set
    if (!submission.labelAccountId && submission.labelName) {
      const labelAccount = await this.prisma.user.findFirst({
        where: { company: submission.labelName, isCompanyAccount: true },
      });
      if (labelAccount) {
        await this.prisma.submission.update({
          where: { id: submission.id },
          data: { labelAccountId: labelAccount.id },
        });
      }
    }

    const created = await Promise.all(
      dto.logs.map((log) =>
        this.prisma.qCLog.create({
          data: {
            submissionId: submission.id,
            createdBy: 'INTERNAL',
            trackId: log.trackId,
            source: 'INTERNAL',
            type: log.type,
            severity: log.severity,
            dsp: log.dsp,
            title: log.title,
            description: log.description,
            beforeValue: log.beforeValue,
            afterValue: log.afterValue,
            field: log.field,
          },
        }),
      ),
    );

    this.qcGateway.broadcastQCUpdate('qc-log-created', {
      submissionId: submission.id,
      logCount: created.length,
    });

    return { submissionId: submission.id, created: created.length };
  }

  async updateMetadata(upc: string, dto: ExternalMetadataDto) {
    const submission = await this.findSubmissionByUPC(upc);

    const overrides = await Promise.all(
      dto.overrides.map((override) =>
        this.prisma.dSPMetadataOverride.create({
          data: {
            submissionId: submission.id,
            appliedBy: 'OPENCLAW',
            dsp: dto.dsp,
            trackId: override.trackId,
            field: override.field,
            originalValue: override.originalValue,
            overrideValue: override.overrideValue,
            reason: override.reason,
          },
        }),
      ),
    );

    // Create an audit QCLog entry for the DSP override batch
    await this.prisma.qCLog.create({
      data: {
        submissionId: submission.id,
        createdBy: 'INTERNAL',
        source: 'INTERNAL',
        type: 'DSP_OVERRIDE',
        severity: 'INFO',
        dsp: dto.dsp,
        title: `DSP metadata override applied by OpenClaw`,
        description: `${overrides.length} field(s) overridden for ${dto.dsp}`,
      },
    });

    return { submissionId: submission.id, applied: overrides.length };
  }

  async upsertSubmission(dto: ExternalSubmissionDto) {
    // Check if submission with this UPC already exists
    let existing: any = null;
    try {
      existing = await this.findSubmissionByUPC(dto.upc);
    } catch {
      // Not found — will create new
    }

    // Auto-map label account
    let labelAccountId: string | undefined;
    if (dto.labelName) {
      const labelAccount = await this.prisma.user.findFirst({
        where: { company: dto.labelName, isCompanyAccount: true },
      });
      if (labelAccount) {
        labelAccountId = labelAccount.id;
      }
    }

    // Build Dropbox path: /n3rve-submissions/{label}/{artist}/{YYYY-MM}_{album}_{UPC}/
    const releaseMonth = dto.releaseDate
      ? new Date(dto.releaseDate).toISOString().slice(0, 7)
      : new Date().toISOString().slice(0, 7);
    const dropboxPath =
      dto.dropboxPath ||
      `/n3rve-submissions/${dto.labelName}/${dto.artistName}/${releaseMonth}_${dto.albumTitle}_${dto.upc}`;

    // Build submission data
    const submissionData: any = {
      albumTitle: dto.albumTitle,
      albumTitleEn: dto.albumTitleEn || dto.albumTitle,
      artistName: dto.artistName,
      artistNameEn: dto.artistNameEn || dto.artistName,
      albumType: dto.albumType,
      labelName: dto.labelName,
      releaseDate: new Date(dto.releaseDate),
      status: 'PENDING',
      submitterEmail: 'openclaw@n3rve.com',
      submitterName: 'OpenClaw',
      genre: dto.albumGenre || (dto.genre ? [dto.genre] : []),
      albumGenre: dto.albumGenre || (dto.genre ? [dto.genre] : []),
      albumSubgenre: dto.albumSubgenre || (dto.subgenre ? [dto.subgenre] : []),
      explicitContent: dto.explicitContent || false,
      albumDescription: dto.albumDescription || '',
      albumVersion: dto.albumVersion || '',
      displayArtist: dto.displayArtist || dto.artistName,
      primaryTitle: dto.primaryTitle || dto.albumTitle,
      hasTranslation: dto.hasTranslation || false,
      translationLanguage: dto.translationLanguage || '',
      translatedTitle: dto.translatedTitle || '',
      totalVolumes: dto.totalVolumes || 1,
      albumNote: dto.albumNote || '',
      albumTranslations: dto.albumTranslations || {},
      albumContributors: dto.albumContributors || [],
      albumFeaturingArtists: dto.albumFeaturingArtists || [],
      artistType: dto.artistType || '',
      biography: dto.biography || '',
      spotifyId: dto.spotifyId || '',
      appleMusicId: dto.appleMusicId || '',
      youtubeChannelId: dto.youtubeChannelId || '',
      artistTranslations: dto.artistTranslations || {},
      socialLinks: dto.socialLinks || {},
      members: dto.members || [],
      marketing: dto.marketing || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      files: {
        coverImageUrl: dto.files?.coverImageUrl || null,
        artistPhotoUrl: dto.files?.artistPhotoUrl || null,
        motionArtUrl: dto.files?.motionArtUrl || null,
        musicVideoUrl: null,
        audioFiles: (dto.files?.audioFiles || []).map((f) => ({
          trackId: f.trackId || '',
          dropboxUrl: f.dropboxUrl,
          fileName: f.fileName,
          fileSize: f.fileSize || 0,
        })),
        additionalFiles: [],
        musicVideoFiles: (dto.files?.musicVideoFiles || []).map((f) => ({
          trackId: f.trackId || '',
          dropboxUrl: f.dropboxUrl,
          fileName: f.fileName,
        })),
        musicVideoThumbnails: (dto.files?.musicVideoThumbnails || []).map((f) => ({
          trackId: f.trackId || '',
          dropboxUrl: f.dropboxUrl,
          fileName: f.fileName,
        })),
      },
      tracks: (dto.tracks || []).map((t, idx) => ({
        id: `track-${idx + 1}`,
        trackNumber: t.trackNumber || idx + 1,
        titleKo: t.titleKo,
        titleEn: t.titleEn || t.titleKo,
        titleTranslations: t.titleTranslations || {},
        isrc: t.isrc || '',
        duration: t.duration || '',
        volume: t.volume || 1,
        discNumber: t.discNumber || 1,
        // Genre
        genre: t.genre || dto.genre || '',
        subgenre: t.subgenre || '',
        alternateGenre: t.alternateGenre || '',
        alternateSubgenre: t.alternateSubgenre || '',
        // Content
        explicitContent: t.explicitContent || false,
        lyrics: t.lyrics || '',
        lyricsLanguage: t.lyricsLanguage || '',
        language: t.language || '',
        audioLanguage: t.audioLanguage || '',
        metadataLanguage: t.metadataLanguage || '',
        titleLanguage: t.titleLanguage || '',
        // Version
        trackType: t.trackType || 'ORIGINAL',
        versionType: t.versionType || '',
        trackVersion: t.trackVersion || '',
        // Focus/Title
        isTitle: t.isTitle ?? (idx === 0),
        isFocusTrack: t.isFocusTrack ?? (idx === 0),
        // Audio
        dolbyAtmos: t.dolbyAtmos || false,
        stereo: t.stereo ?? true,
        previewStart: t.previewStart || '',
        previewEnd: t.previewEnd || '',
        previewLength: t.previewLength || 0,
        // Video
        hasMusicVideo: t.hasMusicVideo || false,
        musicVideoISRC: t.musicVideoISRC || '',
        // Custom release
        hasCustomReleaseDate: t.hasCustomReleaseDate || false,
        customConsumerReleaseDate: t.customConsumerReleaseDate || '',
        customReleaseTime: t.customReleaseTime || '',
        playtimeStartShortClip: 0,
        // Artists
        artists: t.artists || [],
        featuringArtists: t.featuringArtists || [],
        featuring: t.featuring || '',
        // Contributors (rich metadata per person)
        contributors: t.contributors || [],
        // Legacy individual fields
        composers: t.composers || '',
        lyricists: t.lyricists || '',
        arrangers: t.arrangers || '',
        producer: t.producer || '',
        mixer: t.mixer || '',
        masterer: t.masterer || '',
        // Publishers
        publishers: t.publishers || [],
        translations: [],
      })),
      release: {
        upc: dto.upc,
        catalogNumber: dto.catalogNumber || dto.upc,
        artistName: dto.artistName,
        copyrightHolder: dto.release?.copyrightHolder || dto.labelName,
        copyrightYear: dto.release?.copyrightYear || new Date().getFullYear().toString(),
        cRights: dto.release?.cRights || `© ${new Date().getFullYear()} ${dto.labelName}`,
        pRights: dto.release?.pRights || `℗ ${new Date().getFullYear()} ${dto.labelName}`,
        territories: dto.release?.territories || ['WORLDWIDE'],
        recordingCountry: dto.release?.recordingCountry || 'KR',
        recordingLanguage: dto.release?.recordingLanguage || 'ko',
        parentalAdvisory: dto.release?.parentalAdvisory || 'NONE',
        priceType: dto.release?.priceType || 'STANDARD',
        releaseFormat: dto.release?.releaseFormat || 'STANDARD',
        distributors: [],
        consumerReleaseDate: dto.releaseDate,
        originalReleaseDate: dto.releaseDate,
        productionHolder: dto.labelName,
        productionYear: new Date().getFullYear().toString(),
        isCompilation: false,
        previouslyReleased: false,
        preOrderEnabled: false,
        thisIsPlaylist: false,
        youtubeShortsPreviews: false,
        hasSyncHistory: false,
        motionArtwork: !!dto.files?.motionArtUrl,
        moods: [],
        instruments: [],
        selectedTimezone: 'Asia/Seoul',
        releaseTime: '',
      },
      ...(labelAccountId && { labelAccountId }),
    };

    if (existing) {
      // Update existing submission
      const updated = await this.prisma.submission.update({
        where: { id: existing.id },
        data: {
          ...submissionData,
          updatedAt: new Date(),
        },
      });
      return { action: 'updated', submissionId: updated.id, dropboxPath };
    } else {
      // Find or create a system submitter for OpenClaw
      let submitter = await this.prisma.user.findFirst({
        where: { email: 'openclaw@n3rve.com' },
      });
      if (!submitter) {
        submitter = await this.prisma.user.findFirst({
          where: { email: 'ai-agent@n3rve.com' },
        });
      }
      if (!submitter) {
        throw new NotFoundException('No system account found. Create ai-agent@n3rve.com first.');
      }

      const created = await this.prisma.submission.create({
        data: {
          ...submissionData,
          submitterId: submitter.id,
        },
      });
      return { action: 'created', submissionId: created.id, dropboxPath };
    }
  }

  async bulkUpsertSubmissions(submissions: ExternalSubmissionDto[]) {
    const results: Array<{ upc: string; action: string; submissionId?: string; error?: string }> = [];

    for (const dto of submissions) {
      try {
        const result = await this.upsertSubmission(dto);
        results.push({ upc: dto.upc, ...result });
      } catch (err: any) {
        results.push({ upc: dto.upc, action: 'error', error: err.message });
      }
    }

    const created = results.filter((r) => r.action === 'created').length;
    const updated = results.filter((r) => r.action === 'updated').length;
    const errors = results.filter((r) => r.action === 'error').length;

    return { total: submissions.length, created, updated, errors, results };
  }
}
