import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FugaApiService } from './fuga-api.service';
import { DropboxService } from '../dropbox/dropbox.service';
import fetch from 'node-fetch';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private prisma: PrismaService,
    private fugaApi: FugaApiService,
    private dropbox: DropboxService,
  ) {}

  // ==================== SYNC ====================

  async syncProducts(products: any[]) {
    const results = { created: 0, updated: 0, linked: 0, errors: [] as string[] };

    for (const product of products) {
      try {
        const data = this.mapProductData(product);

        const existing = await this.prisma.catalogProduct.findUnique({
          where: { fugaId: BigInt(product.id) },
        });

        if (existing) {
          await this.prisma.catalogProduct.update({
            where: { fugaId: BigInt(product.id) },
            data: { ...data, syncedAt: new Date() },
          });
          results.updated++;
        } else {
          await this.prisma.catalogProduct.create({ data });
          results.created++;
        }

        // Upsert assets
        for (const asset of product.assets || []) {
          await this.upsertAsset(asset, product.id);
        }

        // Upsert artists from product + assets
        await this.upsertArtistsFromProduct(product);

        // Auto-link to Submission by UPC
        if (product.upc) {
          const linked = await this.autoLinkSubmission(product.upc, BigInt(product.id));
          if (linked) results.linked++;
        }

        // Sync artists/contributors to the submitter's SavedArtist/SavedContributor
        await this.syncArtistsToSavedArtists(product);
      } catch (error) {
        results.errors.push(`Product ${product.id}: ${error.message}`);
      }
    }

    return results;
  }

  async syncArtists(data: { artists?: any[]; people?: any[] }) {
    const results = { created: 0, updated: 0 };

    const entries = [
      ...(data.artists || []).map(a => ({ ...a, type: 'ARTIST' })),
      ...(data.people || []).map(p => ({ ...p, type: 'CONTRIBUTOR' })),
    ];

    for (const entry of entries) {
      try {
        const artistData = {
          fugaId: BigInt(entry.id),
          name: entry.name,
          type: entry.type as any,
          spotifyId: entry.spotify_id || null,
          spotifyUrl: entry.spotify_url || null,
          appleMusicId: entry.apple_music_id || null,
          appleMusicUrl: entry.apple_music_url || null,
          roles: entry.roles || [],
          syncedAt: new Date(),
        };

        const existing = await this.prisma.catalogArtist.findUnique({
          where: { fugaId: BigInt(entry.id) },
        });

        if (existing) {
          await this.prisma.catalogArtist.update({
            where: { fugaId: BigInt(entry.id) },
            data: artistData,
          });
          results.updated++;
        } else {
          await this.prisma.catalogArtist.create({ data: artistData });
          results.created++;
        }
      } catch (error) {
        console.warn(`Failed to upsert artist ${entry.id}: ${error.message}`);
      }
    }

    return results;
  }

  async getSyncStatus() {
    const [productCount, assetCount, artistCount, lastProduct] = await Promise.all([
      this.prisma.catalogProduct.count(),
      this.prisma.catalogAsset.count(),
      this.prisma.catalogArtist.count(),
      this.prisma.catalogProduct.findFirst({ orderBy: { syncedAt: 'desc' } }),
    ]);

    return {
      products: productCount,
      assets: assetCount,
      artists: artistCount,
      lastSyncedAt: lastProduct?.syncedAt || null,
    };
  }

  // ==================== QUERY ====================

  async findProducts(params: {
    search?: string;
    state?: string;
    label?: string;
    format?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, state, label, format, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { upc: { contains: search } },
        { displayArtist: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (state) where.state = state;
    if (label) where.label = label;
    if (format) where.releaseFormatType = format;

    const [products, total] = await Promise.all([
      this.prisma.catalogProduct.findMany({
        where,
        include: { _count: { select: { assets: true } }, submission: { select: { id: true, status: true } } },
        orderBy: { consumerReleaseDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.catalogProduct.count({ where }),
    ]);

    return {
      data: products.map(p => this.serializeProduct(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findProductById(id: string) {
    const product = await this.prisma.catalogProduct.findUnique({
      where: { id },
      include: {
        assets: { orderBy: { sequence: 'asc' } },
        submission: { select: { id: true, status: true, albumTitle: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return this.serializeProduct(product);
  }

  async findArtists(params: { search?: string; type?: string; label?: string; page?: number; limit?: number }) {
    const { search, type, label, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (type) where.type = type;
    if (label) where.labels = { has: label };

    const [artists, total] = await Promise.all([
      this.prisma.catalogArtist.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.catalogArtist.count({ where }),
    ]);

    return {
      data: artists.map(a => this.serializeArtist(a)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateArtist(id: string, data: any) {
    const allowedFields = [
      'name', 'type', 'biography', 'countryOfOrigin', 'genres', 'subgenres',
      'labels', 'contactDetails', 'bookingAgent', 'roles', 'spotifyUrl',
      'spotifyId', 'appleMusicUrl', 'appleMusicId', 'isni', 'ipi', 'ipn',
      'youtubeOac', 'translations', 'customIdentifiers', 'spotifyDjMixesOptIn',
    ];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    updateData.updatedAt = new Date();

    const updated = await this.prisma.catalogArtist.update({ where: { id }, data: updateData });

    // Reverse sync: propagate name change to all linked SavedArtists
    const savedArtistData: any = { updatedAt: new Date() };
    if (data.name !== undefined) savedArtistData.name = updated.name;

    // Rebuild identifiers array if spotifyId or appleMusicId changed
    if (data.spotifyId !== undefined || data.appleMusicId !== undefined) {
      // Fetch each linked SavedArtist and update its identifiers individually
      const linkedArtists = await this.prisma.savedArtist.findMany({
        where: { catalogArtistId: id },
        select: { id: true, identifiers: true },
      });

      for (const saved of linkedArtists) {
        const identifiers: any[] = Array.isArray(saved.identifiers) ? [...(saved.identifiers as any[])] : [];

        if (data.spotifyId !== undefined) {
          const idx = identifiers.findIndex((x: any) => x.type === 'SPOTIFY');
          if (idx >= 0) identifiers[idx] = { ...identifiers[idx], value: updated.spotifyId };
          else if (updated.spotifyId) identifiers.push({ type: 'SPOTIFY', value: updated.spotifyId, url: null });
        }

        if (data.appleMusicId !== undefined) {
          const idx = identifiers.findIndex((x: any) => x.type === 'APPLE_MUSIC');
          if (idx >= 0) identifiers[idx] = { ...identifiers[idx], value: updated.appleMusicId };
          else if (updated.appleMusicId) identifiers.push({ type: 'APPLE_MUSIC', value: updated.appleMusicId, url: null });
        }

        await this.prisma.savedArtist.update({
          where: { id: saved.id },
          data: { ...savedArtistData, identifiers },
        });
      }
    } else if (Object.keys(savedArtistData).length > 1) {
      // Only name (or updatedAt) changed — use updateMany for efficiency
      await this.prisma.savedArtist.updateMany({
        where: { catalogArtistId: id },
        data: savedArtistData,
      });
    }

    return this.serializeArtist(updated);
  }

  async deleteArtist(id: string) {
    await this.prisma.catalogArtist.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Delete a catalog product and all of its child assets from the local DB.
   *
   * This is a *local-only* delete — it does NOT touch FUGA. The next weekly
   * pullFromFuga cron will re-import the product if it still exists upstream,
   * which is usually fine; for permanent removal the operator should also
   * delete (or untag) the product on the FUGA side.
   *
   * Mongo+Prisma has no automatic cascade, so we manually:
   *   1. Delete every CatalogAsset whose productId matches.
   *   2. Delete the CatalogProduct itself.
   *
   * Wrapped in a transaction so a partial failure leaves DB consistent.
   */
  async deleteCatalogProduct(id: string) {
    const product = await this.prisma.catalogProduct.findUnique({
      where: { id },
      select: { id: true, name: true, upc: true, fugaId: true },
    });
    if (!product) {
      throw new NotFoundException(`CatalogProduct ${id} not found`);
    }

    const [{ count: assetsDeleted }] = await this.prisma.$transaction([
      this.prisma.catalogAsset.deleteMany({ where: { productId: id } }),
      this.prisma.catalogProduct.delete({ where: { id } }),
    ]);

    this.logger.log(
      `Deleted CatalogProduct id=${id} name="${product.name}" upc=${product.upc} (assets removed: ${assetsDeleted})`,
    );

    return {
      deleted: true,
      product: {
        id: product.id,
        name: product.name,
        upc: product.upc,
        fugaId: product.fugaId.toString(),
      },
      assetsDeleted,
    };
  }

  async findArtistById(id: string) {
    const artist = await this.prisma.catalogArtist.findUnique({ where: { id } });
    if (!artist) throw new NotFoundException('Artist not found');

    // Find products/assets where this artist appears
    const products = await this.prisma.catalogProduct.findMany({
      where: {
        OR: [
          { assets: { some: { contributors: { some: { personId: artist.fugaId } } } } },
        ],
      },
      include: { assets: true },
    });

    return { ...this.serializeArtist(artist), products: products.map(p => this.serializeProduct(p)) };
  }

  async searchAssets(params: { search?: string; isrc?: string; page?: number; limit?: number }) {
    const { search, isrc, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isrc) {
      where.isrc = isrc;
    } else if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { isrc: { contains: search } },
        { displayArtist: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      this.prisma.catalogAsset.findMany({
        where,
        include: { product: { select: { id: true, name: true, upc: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.catalogAsset.count({ where }),
    ]);

    return {
      data: assets.map(a => this.serializeAsset(a)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [productCount, assetCount, artistCount, labels, syncStatus] = await Promise.all([
      this.prisma.catalogProduct.count(),
      this.prisma.catalogAsset.count(),
      this.prisma.catalogArtist.count(),
      this.prisma.catalogProduct.groupBy({ by: ['label'], _count: true }),
      this.getSyncStatus(),
    ]);

    const linkedCount = await this.prisma.catalogProduct.count({ where: { submissionId: { not: null } } });

    return {
      products: productCount,
      assets: assetCount,
      artists: artistCount,
      labels: labels.length,
      linked: linkedCount,
      unlinked: productCount - linkedCount,
      lastSyncedAt: syncStatus.lastSyncedAt,
    };
  }

  async findUnifiedProducts(params: {
    search?: string;
    state?: string;
    label?: string;
    format?: string;
    source?: string; // 'all' | 'both' | 'submission' | 'catalog'
    page?: number;
    limit?: number;
  }) {
    const { search, state, label, format, source = 'all', page = 1, limit = 20 } = params;

    // Get all catalog products
    const catalogProducts = await this.prisma.catalogProduct.findMany({
      include: {
        assets: { orderBy: { sequence: 'asc' } },
        submission: true,
      },
    });

    // Get all submissions
    const allSubmissions = await this.prisma.submission.findMany({
      select: {
        id: true,
        albumTitle: true,
        albumTitleEn: true,
        albumType: true,
        artistName: true,
        artistNameEn: true,
        labelName: true,
        genre: true,
        albumGenre: true,
        albumSubgenre: true,
        releaseDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        biography: true,
        socialLinks: true,
        artistType: true,
        spotifyId: true,
        appleMusicId: true,
        youtubeChannelId: true,
        albumTranslations: true,
        albumDescription: true,
        albumVersion: true,
        releaseVersion: true,
        displayArtist: true,
        explicitContent: true,
        albumContributors: true,
        albumFeaturingArtists: true,
        totalVolumes: true,
        albumNote: true,
        marketing: true,
        adminNotes: true,
        reviewedBy: true,
        reviewedAt: true,
        submitterName: true,
        submitterEmail: true,
        tracks: true,
        files: true,
        release: true,
        catalogProductId: true,
        fugaSyncStatus: true,
      },
    });

    // Build UPC-keyed maps
    const catalogByUpc = new Map<string, any>();
    for (const cp of catalogProducts) {
      catalogByUpc.set(cp.upc, cp);
    }

    const submissionByUpc = new Map<string, any>();
    for (const sub of allSubmissions) {
      const upc = (sub.release as any)?.upc;
      if (upc) submissionByUpc.set(upc, sub);
    }

    // Merge
    const allUpcs = new Set([...catalogByUpc.keys(), ...submissionByUpc.keys()]);
    let unified: any[] = [];

    for (const upc of allUpcs) {
      const catalog = catalogByUpc.get(upc);
      const submission = submissionByUpc.get(upc);
      const itemSource = catalog && submission ? 'both' : catalog ? 'catalog' : 'submission';

      const item: any = {
        // Identity
        upc,
        source: itemSource,
        catalogProductId: catalog?.id || null,
        submissionId: submission?.id || null,

        // === Album level (prefer catalog for FUGA data, submission for user-submitted data) ===
        name: catalog?.name || submission?.albumTitle || '',
        nameEn: submission?.albumTitleEn || '',
        displayArtist: catalog?.displayArtist || submission?.displayArtist || submission?.artistName || '',
        artistName: submission?.artistName || catalog?.displayArtist || '',
        artistNameEn: submission?.artistNameEn || '',
        label: catalog?.label || submission?.labelName || '',
        albumType: catalog?.releaseFormatType || submission?.albumType || '',
        state: catalog?.state || null, // FUGA delivery state
        submissionStatus: submission?.status || null,

        // Dates
        consumerReleaseDate: catalog?.consumerReleaseDate || null,
        originalReleaseDate: catalog?.originalReleaseDate || null,
        releaseDate: submission?.releaseDate || null,
        addedDate: catalog?.addedDate || null,
        createdAt: submission?.createdAt || catalog?.createdAt || null,

        // Genre
        genre: catalog?.genre || submission?.albumGenre || submission?.genre || null,
        subgenre: catalog?.subgenre || submission?.albumSubgenre || null,
        language: catalog?.language || null,

        // Copyright
        cLineText: catalog?.cLineText || null,
        pLineText: catalog?.pLineText || null,
        catalogNumber: catalog?.catalogNumber || null,
        releaseVersion: catalog?.releaseVersion || submission?.releaseVersion || submission?.albumVersion || '',
        parentalAdvisory: catalog?.parentalAdvisory || false,

        // FUGA-only
        fugaId: catalog?.fugaId?.toString() || null,
        labelId: catalog?.labelId?.toString() || null,
        productType: catalog?.productType || null,
        suborg: catalog?.suborg || [],
        syncedAt: catalog?.syncedAt || null,

        // FUGA Product extended
        courtesyLine: catalog?.courtesyLine || null,
        labelCopyInfo: catalog?.labelCopyInfo || null,
        albumNotes: catalog?.albumNotes || submission?.albumNote || null,
        metadataLanguage: catalog?.metadataLanguage || null,
        catalogTier: catalog?.catalogTier || null,
        totalVolumes: catalog?.totalVolumes || submission?.totalVolumes || null,
        isCompilation: catalog?.isCompilation || (submission?.release as any)?.isCompilation || false,
        deliveryInstructions: catalog?.deliveryInstructions || null,
        extraFields: catalog?.extraFields || null,
        productTags: catalog?.tags || [],
        productTerritories: catalog?.territories || null,

        // Submission-only (album-level rich data)
        albumDescription: submission?.albumDescription || null,
        biography: submission?.biography || null,
        socialLinks: submission?.socialLinks || null,
        artistType: submission?.artistType || null,
        spotifyId: submission?.spotifyId || null,
        appleMusicId: submission?.appleMusicId || null,
        youtubeChannelId: submission?.youtubeChannelId || null,
        albumTranslations: submission?.albumTranslations || null,
        albumContributors: submission?.albumContributors || null,
        albumFeaturingArtists: submission?.albumFeaturingArtists || null,
        albumNote: submission?.albumNote || null,
        explicitContent: submission?.explicitContent || false,
        marketing: submission?.marketing || null,
        adminNotes: submission?.adminNotes || null,
        submitterName: submission?.submitterName || null,
        submitterEmail: submission?.submitterEmail || null,
        reviewedBy: submission?.reviewedBy || null,
        reviewedAt: submission?.reviewedAt || null,

        // Release details from submission
        release: submission?.release || null,

        // Full files object from submission
        files: submission?.files || null,

        // Release details extracted to top-level for easy access
        copyrightHolder: (submission?.release as any)?.copyrightHolder || null,
        copyrightYear: (submission?.release as any)?.copyrightYear || null,
        productionHolder: (submission?.release as any)?.productionHolder || null,
        productionYear: (submission?.release as any)?.productionYear || null,
        recordingCountry: (submission?.release as any)?.recordingCountry || null,
        recordingLanguage: (submission?.release as any)?.recordingLanguage || null,
        territories: (submission?.release as any)?.territories || null,
        territoryType: (submission?.release as any)?.territoryType || null,
        priceType: (submission?.release as any)?.priceType || null,
        preOrderEnabled: (submission?.release as any)?.preOrderEnabled || false,
        previouslyReleased: (submission?.release as any)?.previouslyReleased || false,
        releaseFormat: (submission?.release as any)?.releaseFormat || null,
        releaseTime: catalog?.consumerReleaseTime || (submission?.release as any)?.releaseTime || null,
        selectedTimezone: (submission?.release as any)?.selectedTimezone || null,
        hasSyncHistory: (submission?.release as any)?.hasSyncHistory || false,
        motionArtwork: (submission?.release as any)?.motionArtwork || false,

        // Files from submission (convert Dropbox shared links to raw URLs for img rendering)
        // Falls back to catalog.coverArtUrl for FUGA-only products that have
        // no n3rve submission record.
        coverImageUrl:
          this.toRawDropboxUrl((submission?.files as any)?.coverImageUrl) ||
          this.toRawDropboxUrl((catalog as any)?.coverArtUrl) ||
          null,
        artistPhotoUrl: this.toRawDropboxUrl((submission?.files as any)?.artistPhotoUrl) || null,
        audioFiles: ((submission?.files as any)?.audioFiles || []).map((af: any) => ({
          ...af,
          dropboxUrl: this.toRawDropboxUrl(af.dropboxUrl) || af.dropboxUrl,
        })),

        // Artists (catalog has DSP URLs)
        artists: catalog?.artists?.map((a: any) => ({
          ...a,
          fugaId: a.fugaId?.toString(),
        })) || [],

        // Assets/tracks — merge catalog assets (rich FUGA data) with submission tracks
        assets: this.mergeTracksAndAssets(
          catalog?.assets || [],
          (submission?.tracks as any[]) || []
        ),

        // Track count
        trackCount: (catalog?.assets?.length || 0) || ((submission?.tracks as any[])?.length || 0),
      };

      unified.push(item);
    }

    // Apply filters
    if (search) {
      const q = search.toLowerCase();
      unified = unified.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.displayArtist.toLowerCase().includes(q) ||
        item.upc.includes(q) ||
        item.artistName.toLowerCase().includes(q)
      );
    }
    if (state) unified = unified.filter(item => item.state === state);
    if (label) unified = unified.filter(item => item.label === label);
    if (format) unified = unified.filter(item => item.albumType?.toUpperCase() === format);
    if (source && source !== 'all') unified = unified.filter(item => item.source === source);

    // Sort by date (newest first)
    unified.sort((a, b) => {
      const dateA = new Date(a.consumerReleaseDate || a.releaseDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.consumerReleaseDate || b.releaseDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const total = unified.length;
    const skip = (page - 1) * limit;
    const data = unified.slice(skip, skip + limit);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: unified.length,
        both: unified.filter(i => i.source === 'both').length,
        catalogOnly: unified.filter(i => i.source === 'catalog').length,
        submissionOnly: unified.filter(i => i.source === 'submission').length,
      },
    };
  }

  private mergeTracksAndAssets(assets: any[], tracks: any[]): any[] {
    // If we have catalog assets, they have richer FUGA data — enrich with submission track data
    if (assets.length > 0) {
      return assets.map((asset: any) => {
        // Try to match by ISRC or by sequence/track number
        const matchedTrack = tracks.find((t: any) =>
          (t.isrc && t.isrc === asset.isrc) ||
          (t.trackNumber && t.trackNumber === asset.sequence)
        );

        return {
          // Asset (FUGA) data
          id: asset.id,
          fugaId: asset.fugaId?.toString(),
          isrc: asset.isrc,
          name: asset.name,
          displayArtist: asset.displayArtist,
          version: asset.version,
          duration: asset.duration,
          sequence: asset.sequence,
          genre: asset.genre,
          subgenre: asset.subgenre,
          alternateGenre: asset.alternateGenre,
          alternateSubgenre: asset.alternateSubgenre,
          language: asset.language,
          audioLocale: asset.audioLocale,
          assetVersion: asset.assetVersion,
          versionTypes: asset.versionTypes,
          hasLyrics: asset.hasLyrics,
          lyrics: asset.lyrics || matchedTrack?.lyrics || null,
          pLineYear: asset.pLineYear,
          pLineText: asset.pLineText,
          parentalAdvisory: asset.parentalAdvisory,
          rightsClaim: asset.rightsClaim,
          rightsHolderName: asset.rightsHolderName,
          recordingYear: asset.recordingYear,
          recordingLocation: asset.recordingLocation,
          countryOfRecording: asset.countryOfRecording,
          assetCatalogTier: asset.assetCatalogTier,
          // audio: normalized to camelCase + enriched from originalEncodings
          // (FUGA's `audio` dict is shallow snake_case; UI reads asset.audio?.sampleRate
          // / .bitDepth / .format / .size / .duration / etc).
          audio:
            asset.audio || (asset.originalEncodings && asset.originalEncodings.length > 0)
              ? {
                  ...asset.audio,
                  sampleRate: this.firstAudioField(asset, 'samplingRate', 'sampling_rate'),
                  bitDepth: this.firstAudioField(asset, 'bitDepth', 'bit_depth'),
                  numberOfChannels: this.firstAudioField(asset, 'numberOfChannels', 'number_of_channels'),
                  fileSize: this.firstAudioField(asset, 'fileSize', 'file_size'),
                  mimeType: this.firstAudioField(asset, 'mimeType', 'mime_type'),
                  format: this.firstAudioField(asset, 'mimeType', 'mime_type'),
                  filename: asset.audio?.original_filename || asset.audio?.filename || null,
                  vaultHook: asset.audio?.vault_hook || asset.audio?.vaultHook || null,
                  hasUploaded: asset.audio?.has_uploaded ?? asset.audio?.hasUploaded ?? null,
                }
              : null,
          originalEncodings: asset.originalEncodings,
          artists: asset.artists?.map((a: any) => ({ ...a, fugaId: a.fugaId?.toString() })),
          contributors: asset.contributors?.map((c: any) => ({ ...c, personId: c.personId?.toString() })),
          publishers: asset.publishers,
          // (audioFileInfo normalized below — see {filename, size, mimeType, ...} block)
          dolbyAtmosFileInfo: asset.dolbyAtmosFileInfo,
          availableSeparately: asset.availableSeparately,
          allowPreorder: asset.allowPreorder,
          preorderType: asset.preorderType,
          rightsOwnershipName: asset.rightsOwnershipName,
          rightsContractBeginDate: asset.rightsContractBeginDate,
          iswc: asset.iswc || matchedTrack?.iswc || null,
          extraFields: asset.extraFields,
          tags: asset.tags,
          assetTerritories: asset.assetTerritories,
          assetTranslations: asset.assetTranslations,
          metadataLanguage: asset.metadataLanguage,
          audioLanguage: asset.audioLanguage || matchedTrack?.audioLanguage || null,
          youtubeShortPreview: asset.youtubeShortPreview,
          previewLength: asset.previewLength || matchedTrack?.previewLength || null,
          assetReleaseDate: asset.assetReleaseDate,
          // Enriched from submission track
          titleKo: matchedTrack?.titleKo || null,
          titleEn: matchedTrack?.titleEn || asset.name,
          composer: matchedTrack?.composer || null,
          lyricist: matchedTrack?.lyricist || null,
          arranger: matchedTrack?.arranger || null,
          producer: matchedTrack?.producer || null,
          mixer: matchedTrack?.mixer || null,
          masterer: matchedTrack?.masterer || null,
          dolbyAtmos: matchedTrack?.dolbyAtmos || !!asset.dolbyAtmosFileInfo || false,
          // Audio technical metadata: prefer submission track values (user-
          // entered), then derive from FUGA's originalEncodings (rich, real)
          // → asset.audio. originalEncodings is an array of {bitDepth,
          // samplingRate, fileSize, mimeType, originalFilename, vaultItem...}
          // straight from FUGA. Pick the first entry as the canonical audio.
          sampleRate:
            matchedTrack?.sampleRate ||
            this.firstAudioField(asset, 'samplingRate', 'sampling_rate') ||
            null,
          bitDepth:
            matchedTrack?.bitDepth ||
            this.firstAudioField(asset, 'bitDepth', 'bit_depth') ||
            null,
          audioFormat:
            matchedTrack?.audioFormat ||
            this.firstAudioField(asset, 'mimeType', 'mime_type') ||
            null,
          numberOfChannels:
            this.firstAudioField(asset, 'numberOfChannels', 'number_of_channels') || null,
          fileSize: this.firstAudioField(asset, 'fileSize', 'file_size') || null,
          stereo:
            ((): boolean | null => {
              const ch = this.firstAudioField(asset, 'numberOfChannels', 'number_of_channels');
              if (ch == null) return null;
              return Number(ch) === 2;
            })(),
          // Normalized audioFileInfo for the UI: { filename, size, mimeType,
          // duration, vaultHook } — flattens FUGA's heterogeneous shape.
          audioFileInfo:
            asset.audioFileInfo || asset.audio
              ? {
                  filename:
                    asset.audioFileInfo?.filename ||
                    asset.audioFileInfo?.original_filename ||
                    asset.audio?.original_filename ||
                    null,
                  size:
                    asset.audioFileInfo?.size ||
                    asset.audioFileInfo?.file_size ||
                    asset.audio?.file_size ||
                    this.firstAudioField(asset, 'fileSize', 'file_size') ||
                    null,
                  mimeType:
                    asset.audioFileInfo?.mimeType ||
                    asset.audio?.mime_type ||
                    this.firstAudioField(asset, 'mimeType', 'mime_type') ||
                    null,
                  duration:
                    asset.audioFileInfo?.duration ||
                    asset.audio?.duration ||
                    null,
                  vaultHook:
                    asset.audioFileInfo?.vaultHook ||
                    asset.audioFileInfo?.vault_hook ||
                    asset.audio?.vault_hook ||
                    null,
                  hasUploaded:
                    asset.audioFileInfo?.has_uploaded ??
                    asset.audio?.has_uploaded ??
                    null,
                }
              : null,
          // previewStart: asset has authoritative value (FUGA preview_start),
          // submission track is the fallback.
          previewStart: asset.previewStart ?? matchedTrack?.previewStart ?? null,
          previewEnd: matchedTrack?.previewEnd || null,
          explicitContent: asset.parentalAdvisory || matchedTrack?.explicitContent || false,
          // Asset-level type (TRACK / VIDEO) — frontend reads as `asset.trackType`
          trackType: matchedTrack?.trackType || asset.assetType || null,
          // Disc number from submission track (FUGA's `volume` is on asset.volume already)
          discNumber: matchedTrack?.discNumber || null,
          // Extra asset fields the UI surfaces in the preview/video card
          videoHd: asset.videoHd || false,
          videoPreviewImage: asset.videoPreviewImage || null,
          assetState: asset.assetState || null,
          musicalWork: asset.musicalWork || null,
          previewReleaseDateTime: asset.previewReleaseDateTime || null,
          previewReleaseDateTimeZone: asset.previewReleaseDateTimeZone || null,
          source: 'catalog',
        };
      });
    }

    // If only submission tracks exist
    return tracks.map((track: any) => ({
      id: track.id,
      isrc: track.isrc,
      name: track.titleKo || track.titleEn || '',
      titleKo: track.titleKo,
      titleEn: track.titleEn,
      displayArtist: track.displayArtist || '',
      version: track.trackVersion || '',
      duration: track.duration ? parseInt(track.duration) || null : null,
      sequence: track.trackNumber,
      genre: track.genre ? { id: '', name: track.genre } : null,
      subgenre: track.subgenre ? { id: '', name: track.subgenre } : null,
      language: track.language,
      hasLyrics: !!track.lyrics,
      lyrics: track.lyrics,
      parentalAdvisory: track.explicitContent || false,
      explicitContent: track.explicitContent || false,
      artists: track.artists || [],
      contributors: (track.contributors || []).map((c: any) => ({
        name: c.name || c.nameEn,
        role: (c.roles || [])[0] || '',
        roles: c.roles || [],
      })),
      publishers: track.publishers || [],
      composer: track.composer,
      lyricist: track.lyricist,
      arranger: track.arranger,
      producer: track.producer,
      mixer: track.mixer,
      masterer: track.masterer,
      dolbyAtmos: track.dolbyAtmos,
      sampleRate: track.sampleRate,
      bitDepth: track.bitDepth,
      audioFormat: track.audioFormat,
      previewStart: track.previewStart,
      previewEnd: track.previewEnd,
      versionTypes: track.versionType ? [{ id: track.versionType, name: track.versionType }] : [],
      source: 'submission',
    }));
  }

  async findUnifiedProductById(id: string, idType: 'catalog' | 'submission' = 'catalog') {
    let catalogProduct: any = null;
    let submission: any = null;

    if (idType === 'catalog') {
      catalogProduct = await this.prisma.catalogProduct.findUnique({
        where: { id },
        include: { assets: { orderBy: { sequence: 'asc' } } },
      });
      // Find linked submission
      if (catalogProduct?.submissionId) {
        submission = await this.prisma.submission.findUnique({ where: { id: catalogProduct.submissionId } });
      } else if (catalogProduct?.upc) {
        // Try UPC match
        const subs = await this.prisma.submission.findMany();
        submission = subs.find((s: any) => (s.release as any)?.upc === catalogProduct.upc) || null;
      }
    } else {
      submission = await this.prisma.submission.findUnique({ where: { id } });
      if (submission) {
        const upc = (submission.release as any)?.upc;
        if (upc) {
          catalogProduct = await this.prisma.catalogProduct.findFirst({
            where: { upc },
            include: { assets: { orderBy: { sequence: 'asc' } } },
          });
        }
        // Also check direct link
        if (!catalogProduct && submission.catalogProductId) {
          catalogProduct = await this.prisma.catalogProduct.findUnique({
            where: { id: submission.catalogProductId },
            include: { assets: { orderBy: { sequence: 'asc' } } },
          });
        }
      }
    }

    if (!catalogProduct && !submission) {
      throw new NotFoundException('Product not found');
    }

    const itemSource = catalogProduct && submission ? 'both' : catalogProduct ? 'catalog' : 'submission';
    const upc = catalogProduct?.upc || (submission?.release as any)?.upc || '';

    return {
      upc,
      source: itemSource,
      catalogProductId: catalogProduct?.id || null,
      submissionId: submission?.id || null,

      // Album level
      name: catalogProduct?.name || submission?.albumTitle || '',
      nameEn: submission?.albumTitleEn || '',
      displayArtist: catalogProduct?.displayArtist || submission?.displayArtist || submission?.artistName || '',
      artistName: submission?.artistName || catalogProduct?.displayArtist || '',
      artistNameEn: submission?.artistNameEn || '',
      label: catalogProduct?.label || submission?.labelName || '',
      albumType: catalogProduct?.releaseFormatType || submission?.albumType || '',
      state: catalogProduct?.state || null,
      submissionStatus: submission?.status || null,

      // Dates
      consumerReleaseDate: catalogProduct?.consumerReleaseDate || null,
      originalReleaseDate: catalogProduct?.originalReleaseDate || null,
      releaseDate: submission?.releaseDate || null,
      addedDate: catalogProduct?.addedDate || null,
      createdAt: submission?.createdAt || catalogProduct?.createdAt || null,

      // Genre
      genre: catalogProduct?.genre || submission?.albumGenre || submission?.genre || null,
      subgenre: catalogProduct?.subgenre || submission?.albumSubgenre || null,
      language: catalogProduct?.language || null,

      // Copyright
      cLineText: catalogProduct?.cLineText || (submission?.release as any)?.cRights || null,
      pLineText: catalogProduct?.pLineText || (submission?.release as any)?.pRights || null,
      catalogNumber: catalogProduct?.catalogNumber || null,
      releaseVersion: catalogProduct?.releaseVersion || submission?.releaseVersion || submission?.albumVersion || '',
      parentalAdvisory: catalogProduct?.parentalAdvisory || false,

      // FUGA
      fugaId: catalogProduct?.fugaId?.toString() || null,
      labelId: catalogProduct?.labelId?.toString() || null,
      productType: catalogProduct?.productType || null,
      suborg: catalogProduct?.suborg || [],
      syncedAt: catalogProduct?.syncedAt || null,

      // FUGA Product extended
      courtesyLine: catalogProduct?.courtesyLine || null,
      labelCopyInfo: catalogProduct?.labelCopyInfo || null,
      albumNotes: catalogProduct?.albumNotes || submission?.albumNote || null,
      metadataLanguage: catalogProduct?.metadataLanguage || null,
      catalogTier: catalogProduct?.catalogTier || null,
      totalVolumes: catalogProduct?.totalVolumes || submission?.totalVolumes || null,
      isCompilation: catalogProduct?.isCompilation || (submission?.release as any)?.isCompilation || false,
      deliveryInstructions: catalogProduct?.deliveryInstructions || null,
      extraFields: catalogProduct?.extraFields || null,
      productTags: catalogProduct?.tags || [],
      productTerritories: catalogProduct?.territories || null,

      // Submission rich data
      albumDescription: submission?.albumDescription || null,
      biography: submission?.biography || null,
      socialLinks: submission?.socialLinks || null,
      artistType: submission?.artistType || null,
      spotifyId: submission?.spotifyId || null,
      appleMusicId: submission?.appleMusicId || null,
      youtubeChannelId: submission?.youtubeChannelId || null,
      albumTranslations: submission?.albumTranslations || null,
      albumContributors: submission?.albumContributors || null,
      albumFeaturingArtists: submission?.albumFeaturingArtists || null,
      albumNote: submission?.albumNote || null,
      // Prefer submission's explicitContent (boolean from the form). For
      // catalog-only products fall back to CatalogProduct.explicitContent
      // which can be a string (FUGA's value).
      explicitContent: submission?.explicitContent ?? catalogProduct?.explicitContent ?? false,
      // Marketing fallback for catalog-only products:
      // 1. Submission.marketing (filled by user form or FUGA Score sync)
      // 2. CatalogProduct.marketing (filled by FugaScoreSyncService when no
      //    matching submission exists for this UPC — see PR-3 catalog-only path)
      marketing: submission?.marketing || (catalogProduct as any)?.marketing || null,
      marketingSyncedAt:
        (submission?.marketing as any)?.fugaScoreSyncedAt ||
        (catalogProduct as any)?.marketingSyncedAt ||
        null,
      adminNotes: submission?.adminNotes || null,

      // Catalog-only extended FUGA fields surfaced for the admin detail page.
      // The UI reads these as `p.<fieldName>`; they were previously dropped
      // by the unified mapper so the page rendered empty even when the DB
      // had data.
      preorderDate: catalogProduct?.preorderDate || null,
      recordingYear: catalogProduct?.recordingYear || null,
      recordingLocation: catalogProduct?.recordingLocation || null,
      alternateGenre: catalogProduct?.alternateGenre || null,
      alternateSubgenre: catalogProduct?.alternateSubgenre || null,
      catalogTerritories: catalogProduct?.territories || null,
      acquisition: (catalogProduct as any)?.acquisition || null,
      artwork: (catalogProduct as any)?.artwork || null,
      cLineYear: (catalogProduct as any)?.cLineYear || null,
      pLineYear: (catalogProduct as any)?.pLineYear || null,
      hasBeenDelivered: (catalogProduct as any)?.hasBeenDelivered || false,
      masteredForItunes: (catalogProduct as any)?.masteredForItunes || false,
      parentalAdvisoryNext: (catalogProduct as any)?.parentalAdvisoryNext || null,
      organization: (catalogProduct as any)?.organization || null,
      suborgOwners: (catalogProduct as any)?.suborgOwners || null,
      totalAssets: (catalogProduct as any)?.totalAssets || null,
      catalogCustomFields: (catalogProduct as any)?.customFields || null,
      catalogExtraFields: catalogProduct
        ? {
            extra1: (catalogProduct as any).extra1,
            extra2: (catalogProduct as any).extra2,
            extra3: (catalogProduct as any).extra3,
            extra4: (catalogProduct as any).extra4,
            extra5: (catalogProduct as any).extra5,
            extra6: (catalogProduct as any).extra6,
            extra7: (catalogProduct as any).extra7,
            extra8: (catalogProduct as any).extra8,
            extra9: (catalogProduct as any).extra9,
            extra10: (catalogProduct as any).extra10,
          }
        : null,
      submitterName: submission?.submitterName || null,
      submitterEmail: submission?.submitterEmail || null,
      reviewedBy: submission?.reviewedBy || null,
      reviewedAt: submission?.reviewedAt || null,
      release: submission?.release || null,

      // Full files object from submission
      files: submission?.files || null,

      // Release details extracted to top-level for easy access.
      // For catalog-only products (no linked Submission) we fall back to the
      // equivalent CatalogProduct fields so the admin detail page renders
      // the data FUGA already gives us instead of showing all "미입력".
      //   c/p line:    cLineText/cLineYear, pLineText/pLineYear
      //   territories: catalogProduct.territories (full 255-territory list)
      //   language:    catalogProduct.language (FUGA `language`)
      //   format:      catalogProduct.releaseFormatType (SINGLE/ALBUM/EP)
      // Fields with no catalog equivalent (priceType, territoryType,
      // preOrderEnabled, previouslyReleased, motionArtwork, recordingCountry,
      // selectedTimezone, hasSyncHistory) stay submission-only — they don't
      // exist in the FUGA product payload.
      copyrightHolder:
        (submission?.release as any)?.copyrightHolder ||
        catalogProduct?.cLineText ||
        null,
      copyrightYear:
        (submission?.release as any)?.copyrightYear ||
        ((catalogProduct as any)?.cLineYear != null ? String((catalogProduct as any).cLineYear) : null),
      productionHolder:
        (submission?.release as any)?.productionHolder ||
        catalogProduct?.pLineText ||
        null,
      productionYear:
        (submission?.release as any)?.productionYear ||
        ((catalogProduct as any)?.pLineYear != null ? String((catalogProduct as any).pLineYear) : null),
      recordingCountry: (submission?.release as any)?.recordingCountry || null,
      recordingLanguage:
        (submission?.release as any)?.recordingLanguage ||
        catalogProduct?.language ||
        null,
      territories:
        (submission?.release as any)?.territories ||
        catalogProduct?.territories ||
        null,
      territoryType: (submission?.release as any)?.territoryType || null,
      priceType: (submission?.release as any)?.priceType || null,
      preOrderEnabled: (submission?.release as any)?.preOrderEnabled || false,
      previouslyReleased: (submission?.release as any)?.previouslyReleased || false,
      releaseFormat:
        (submission?.release as any)?.releaseFormat ||
        catalogProduct?.releaseFormatType ||
        null,
      releaseTime: catalogProduct?.consumerReleaseTime || (submission?.release as any)?.releaseTime || null,
      selectedTimezone: (submission?.release as any)?.selectedTimezone || null,
      hasSyncHistory: (submission?.release as any)?.hasSyncHistory || false,
      motionArtwork: (submission?.release as any)?.motionArtwork || false,
      // (albumNotes / courtesyLine / labelCopyInfo / metadataLanguage /
      //  isCompilation / parentalAdvisory are already mapped earlier in
      //  this object with catalog fallback — see lines 848-864.)

      // Files — submission has priority, catalog.coverArtUrl is the fallback
      // for FUGA-only products that were never submitted through n3rve.
      coverImageUrl:
        this.toRawDropboxUrl((submission?.files as any)?.coverImageUrl) ||
        this.toRawDropboxUrl((catalogProduct as any)?.coverArtUrl) ||
        null,
      artistPhotoUrl: this.toRawDropboxUrl((submission?.files as any)?.artistPhotoUrl) || null,
      audioFiles: ((submission?.files as any)?.audioFiles || []).map((af: any) => ({
        ...af,
        dropboxUrl: this.toRawDropboxUrl(af.dropboxUrl) || af.dropboxUrl,
      })),
      lyricsFiles: (submission?.files as any)?.lyricsFiles || [],
      dolbyAtmosFiles: (submission?.files as any)?.dolbyAtmosFiles || [],
      additionalFiles: (submission?.files as any)?.additionalFiles || [],
      motionArtUrl: this.toRawDropboxUrl((submission?.files as any)?.motionArtUrl) || null,
      musicVideoUrl: this.toRawDropboxUrl((submission?.files as any)?.musicVideoUrl) || null,

      // Artists — batch resolve MongoDB _id from fugaId (single query instead of N)
      artists: await (async () => {
        const productArtists = catalogProduct?.artists || [];
        const fugaIds = productArtists.map((a: any) => a.fugaId).filter(Boolean).map((id: any) => BigInt(id));
        const idMap = new Map<string, string>();
        if (fugaIds.length > 0) {
          const dbArtists = await this.prisma.catalogArtist.findMany({
            where: { fugaId: { in: fugaIds } },
            select: { fugaId: true, id: true },
          });
          dbArtists.forEach(a => idMap.set(a.fugaId.toString(), a.id));
        }
        return productArtists.map((a: any) => ({
          ...a,
          fugaId: a.fugaId?.toString(),
          id: idMap.get(a.fugaId?.toString()) || null,
        }));
      })(),

      // Merged tracks/assets
      assets: this.mergeTracksAndAssets(
        catalogProduct?.assets || [],
        (submission?.tracks as any[]) || []
      ),

      trackCount: (catalogProduct?.assets?.length || 0) || ((submission?.tracks as any[])?.length || 0),
    };
  }

  // ==================== BACKFILL ====================

  /**
   * One-time backfill: sync all existing CatalogArtists to SavedArtist/SavedContributor
   * for each user who has a submission linked to a catalog product.
   */
  async backfillSavedArtists() {
    const results = { artists: 0, contributors: 0, skipped: 0, errors: [] as string[] };

    // Collect unique userIds from all linked submissions
    const linkedProducts = await this.prisma.catalogProduct.findMany({
      where: { submissionId: { not: null } },
      select: { submissionId: true },
    });

    const submissionIds = [...new Set(linkedProducts.map((p) => p.submissionId!))];
    const submissions = await this.prisma.submission.findMany({
      where: { id: { in: submissionIds } },
      select: { submitterId: true, labelAccountId: true },
    });

    // Use labelAccountId (label account) if available, otherwise fall back to submitterId
    const userIds = [...new Set(submissions.map((s) => s.labelAccountId || s.submitterId))];

    // Get all catalog artists once
    const catalogArtists = await this.prisma.catalogArtist.findMany();

    for (const userId of userIds) {
      for (const ca of catalogArtists) {
        try {
          if (ca.type === 'ARTIST') {
            const existing = await this.prisma.savedArtist.findFirst({
              where: { userId, name: ca.name },
            });
            if (existing) { results.skipped++; continue; }

            const identifiers: any[] = [];
            if (ca.spotifyUrl) identifiers.push({ type: 'SPOTIFY', value: ca.spotifyId || '', url: ca.spotifyUrl });
            if (ca.appleMusicUrl) identifiers.push({ type: 'APPLE_MUSIC', value: ca.appleMusicId || '', url: ca.appleMusicUrl });

            await this.prisma.savedArtist.create({
              data: {
                userId,
                name: ca.name,
                identifiers,
                translations: [],
                completionScore: BigInt(0),
                releaseCount: BigInt(1),
                usageCount: BigInt(1),
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
                lastUsed: new Date(),
              },
            });
            results.artists++;
          } else {
            const existing = await this.prisma.savedContributor.findFirst({
              where: { userId, name: ca.name },
            });
            if (existing) { results.skipped++; continue; }

            await this.prisma.savedContributor.create({
              data: {
                userId,
                name: ca.name,
                roles: ca.roles || [],
                instruments: [],
                translations: [],
                identifiers: [],
                createdAt: new Date(),
                lastUsed: new Date(),
                usageCount: BigInt(1),
              },
            });
            results.contributors++;
          }
        } catch (err) {
          results.errors.push(`${ca.name}: ${err.message}`);
        }
      }
    }

    return results;
  }

  // ==================== LINKING ====================

  async linkToSubmission(productId: string, submissionId: string) {
    await this.prisma.catalogProduct.update({
      where: { id: productId },
      data: { submissionId },
    });

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { catalogProductId: productId, fugaSyncStatus: 'SYNCED' },
    });

    return { linked: true };
  }

  async findUnlinked(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.catalogProduct.findMany({
        where: { submissionId: null },
        orderBy: { consumerReleaseDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.catalogProduct.count({ where: { submissionId: null } }),
    ]);

    return {
      data: products.map(p => this.serializeProduct(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== FUGA PUSH / PULL ====================

  async pushToFuga(submissionId: string): Promise<any> {
    const result: any = {
      submissionId,
      success: false,
      fugaProductId: null,
      errors: [] as string[],
    };

    try {
      // 1. Load submission with all data
      const submission = await this.prisma.submission.findUnique({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      const release = submission.release as any;
      const tracks: any[] = (submission.tracks as any[]) || [];
      const files = submission.files as any;

      // 2. Validate required fields
      const missing: string[] = [];
      if (!release?.upc) missing.push('UPC');
      if (!submission.albumTitle && !submission.albumTitleEn) missing.push('Album title');
      if (!submission.artistName && !submission.artistNameEn) missing.push('Artist name');
      if (!submission.labelName) missing.push('Label name');

      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      // 3. Create FUGA product
      const fugaProductData = this.fugaApi.mapSubmissionToFugaProduct(submission);
      this.logger.log(`Pushing submission ${submissionId} to FUGA: ${fugaProductData.name}`);

      const fugaProduct = await this.fugaApi.createProduct(fugaProductData);
      const fugaProductId = String(fugaProduct.id || fugaProduct.product?.id);
      result.fugaProductId = fugaProductId;

      this.logger.log(`FUGA product created: ${fugaProductId}`);

      // 4. Add primary artist to FUGA product
      const primaryArtistName = submission.artistNameEn || submission.artistName;
      try {
        const artist = await this.fugaApi.findOrCreateArtist(primaryArtistName, true);
        await this.fugaApi.addArtistToProduct(fugaProductId, String(artist.id), true);
      } catch (artistErr) {
        result.errors.push(`Primary artist error: ${artistErr.message}`);
        this.logger.warn(`Failed to add primary artist: ${artistErr.message}`);
      }

      // Featuring artists at album level
      const albumFeaturing = (submission.albumFeaturingArtists as any[]) || [];
      for (const featuring of albumFeaturing) {
        try {
          const featuringName = featuring.nameEn || featuring.name;
          if (!featuringName) continue;
          const featuringArtist = await this.fugaApi.findOrCreateArtist(featuringName, false);
          await this.fugaApi.addArtistToProduct(fugaProductId, String(featuringArtist.id), false);
        } catch (err) {
          result.errors.push(`Featuring artist error: ${err.message}`);
        }
      }

      // 5. Add assets (tracks) to FUGA product
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        try {
          const assetData = this.fugaApi.mapSubmissionTrackToFugaAsset(track, i + 1);
          const fugaAsset = await this.fugaApi.addAsset(fugaProductId, assetData);
          const fugaAssetId = String(fugaAsset.id || fugaAsset.asset?.id);

          // Add track-level artists
          const trackArtists: any[] = track.artists || [];
          for (const ta of trackArtists) {
            try {
              const taName = ta.nameEn || ta.name;
              if (!taName) continue;
              const isPrimary = (ta.type || '').toUpperCase() !== 'FEATURING';
              const taArtist = await this.fugaApi.findOrCreateArtist(taName, isPrimary);
              await this.fugaApi.addArtistToAsset(fugaAssetId, String(taArtist.id), isPrimary);
            } catch (err) {
              result.errors.push(`Track ${i + 1} artist error: ${err.message}`);
            }
          }
        } catch (trackErr) {
          result.errors.push(`Track ${i + 1} (${track.titleKo || track.titleEn}) error: ${trackErr.message}`);
          this.logger.warn(`Failed to add track ${i + 1}: ${trackErr.message}`);
        }
      }

      // 6. Upload cover art if available (download from Dropbox first)
      const coverUrl = files?.coverImageUrl;
      if (coverUrl) {
        try {
          const rawUrl = this.toRawDropboxUrl(coverUrl);
          if (rawUrl) {
            const imageRes = await fetch(rawUrl);
            if (imageRes.ok) {
              const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
              const filename = coverUrl.split('/').pop()?.split('?')[0] || 'cover.jpg';
              await this.fugaApi.uploadCoverArt(fugaProductId, imageBuffer, filename);
              this.logger.log(`Cover art uploaded for FUGA product ${fugaProductId}`);
            } else {
              result.errors.push(`Cover art download failed: HTTP ${imageRes.status}`);
            }
          }
        } catch (coverErr) {
          result.errors.push(`Cover art upload error: ${coverErr.message}`);
          this.logger.warn(`Cover art upload failed: ${coverErr.message}`);
        }
      }

      // 7. Create / update CatalogProduct in our DB
      const existingCatalog = await this.prisma.catalogProduct.findUnique({
        where: { fugaId: BigInt(fugaProductId) },
      });

      let catalogProduct;
      const catalogData = {
        fugaId: BigInt(fugaProductId),
        name: fugaProductData.name,
        upc: release.upc,
        state: 'DRAFT',
        label: submission.labelName,
        displayArtist: submission.displayArtist || submission.artistName,
        consumerReleaseDate: release.consumerReleaseDate || null,
        originalReleaseDate: release.originalReleaseDate || null,
        language: release.recordingLanguage || null,
        releaseFormatType: this.mapReleaseFormatForDb(submission.albumType),
        cLineText: release.cRights || null,
        pLineText: release.pRights || null,
        parentalAdvisory: release.parentalAdvisory === 'EXPLICIT' || submission.explicitContent || false,
        catalogNumber: release.catalogNumber || null,
        totalVolumes: submission.totalVolumes || 1,
        isCompilation: release.isCompilation || false,
        submissionId,
        syncedAt: new Date(),
        syncSource: 'push',
      };

      if (existingCatalog) {
        catalogProduct = await this.prisma.catalogProduct.update({
          where: { fugaId: BigInt(fugaProductId) },
          data: catalogData,
        });
      } else {
        catalogProduct = await this.prisma.catalogProduct.create({ data: catalogData });
      }

      // 8. Link submission to catalog product
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: {
          catalogProductId: catalogProduct.id,
          fugaSyncStatus: result.errors.length === 0 ? 'SYNCED' : 'MISMATCH',
        },
      });

      result.success = true;
      result.catalogProductId = catalogProduct.id;
      this.logger.log(
        `pushToFuga complete for submission ${submissionId} — FUGA product: ${fugaProductId}, errors: ${result.errors.length}`,
      );
    } catch (error) {
      result.errors.push(error.message);
      this.logger.error(`pushToFuga failed for submission ${submissionId}: ${error.message}`);

      // Mark as MISMATCH so admin knows action is needed
      try {
        await this.prisma.submission.update({
          where: { id: submissionId },
          data: { fugaSyncStatus: 'MISMATCH' },
        });
      } catch (_) {
        // Ignore — submission may not exist
      }
    }

    return result;
  }

  async fugaVerify2FA(otpCode: string): Promise<void> {
    await this.fugaApi.verify2FA(otpCode);
  }

  fugaRequires2FA(): boolean {
    return this.fugaApi.is2FARequired();
  }

  // The `otp` parameter is preserved for the admin manual-trigger HTTP path
  // (catalog.controller.ts → POST /admin/sync-fuga). It is no longer used
  // internally because FUGA auth is now driven entirely by the session cookie
  // pushed via NanoClaw / FUGA_SESSION_COOKIE env, not by a TOTP login. Kept
  // to avoid breaking that controller signature.
  async pullFromFuga(_otp?: string): Promise<any> {
    const result = { created: 0, updated: 0, errors: [] as string[] };

    try {
      this.logger.log('Starting pullFromFuga...');

      let page = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        let response: any;
        try {
          response = await this.fugaApi.getProducts({ page, limit });
        } catch (fetchErr) {
          result.errors.push(`Page ${page} fetch error: ${fetchErr.message}`);
          break;
        }

        // FUGA wraps results in `product` array
        const products: any[] =
          response?.product ||
          response?.products ||
          response?.data ||
          (Array.isArray(response) ? response : []);

        if (products.length === 0) {
          hasMore = false;
          break;
        }

        for (const product of products) {
          try {
            // Fetch full product details (includes assets and artists).
            // detailFetchFailed is the gate for the mapper: when we couldn't
            // get a full payload we must NOT run mapProductData over the
            // sparse summary — its `... || null` defaults would clobber rich
            // data already persisted from earlier successful syncs.
            let fullProduct: any;
            let detailFetchFailed = false;
            try {
              fullProduct = await this.fugaApi.getProduct(String(product.id));
            } catch (detailErr) {
              detailFetchFailed = true;
              fullProduct = product;
              result.errors.push(`Product ${product.id} detail fetch failed: ${detailErr.message}`);
            }

            // The embedded `assets[]` in /products/{id} is summary-shaped
            // (~16 fields per asset; missing lyrics, contributors, language,
            // preview info, rights, etc.). Always overwrite with the rich
            // payload from /products/{id}/assets (~70 fields). Only skip
            // when the dedicated endpoint also fails — otherwise we'd be
            // persisting the same sparse asset shape that caused the data
            // loss in production.
            if (!detailFetchFailed) {
              try {
                const assetsResponse = await this.fugaApi.getProductAssets(String(product.id));
                const richAssets =
                  assetsResponse?.asset ||
                  assetsResponse?.assets ||
                  assetsResponse?.data ||
                  [];
                if (Array.isArray(richAssets) && richAssets.length > 0) {
                  fullProduct.assets = richAssets;
                }
              } catch (assetsErr) {
                // Asset detail fetch failure is non-fatal — we keep the
                // embedded sparse assets to maintain link integrity, but
                // log so operators can see why some assets are not enriched.
                this.logger.warn(
                  `Product ${product.id} assets-detail fetch failed; falling back to embedded summary: ${(assetsErr as Error).message}`,
                );
              }
            }

            // Only run the mapper when we have a real detail payload. With a
            // sparse summary fallback, skip the update so the DB keeps
            // whatever rich data the previous successful sync wrote.
            const data = detailFetchFailed ? null : this.mapProductData(fullProduct);

            const existing = await this.prisma.catalogProduct.findUnique({
              where: { fugaId: BigInt(product.id) },
              select: { id: true },
            });

            if (data) {
              if (existing) {
                // MongoDB Atlas caps update aggregation pipelines at 50 stages.
                // Prisma's `update({ data })` serializes every field as its own
                // `$set` stage, so our enriched ~60-field CatalogProduct hit
                // the cap (`Error code 8000 (AtlasError): Pipeline length
                // greater than 50 not supported`) on first re-sync after
                // PR #16. Bypass with a single-stage raw `$set` command —
                // same pattern already used at catalog.service.ts:1505 for
                // cover-art backfill.
                await this.atomicUpdateCatalogProduct(existing.id, { ...data, syncedAt: new Date() });
                result.updated++;
              } else {
                await this.prisma.catalogProduct.create({ data });
                result.created++;
              }
            } else if (!existing) {
              // Detail fetch failed AND product is new — we cannot persist
              // anything safely without a real payload. Record an error and
              // move on; next sync should retry.
              result.errors.push(`Product ${product.id} skipped: detail fetch failed and no prior record exists`);
              continue;
            }
            // (If data is null but existing row already exists, we keep it.
            //  Better to serve a slightly stale rich record than to overwrite
            //  with summary fields and clear lyrics/contributors/etc.)

            // Upsert assets — only when we have rich asset data.
            // With a fallback summary payload, asset data would be sparse
            // and could clobber lyrics/contributors/etc. on existing
            // CatalogAsset rows.
            if (!detailFetchFailed) {
              for (const asset of fullProduct.assets || []) {
                try {
                  await this.upsertAsset(asset, product.id);
                } catch (assetErr) {
                  result.errors.push(`Asset ${asset.id} in product ${product.id}: ${assetErr.message}`);
                }
              }
            }

            // Upsert artists
            await this.upsertArtistsFromProduct(fullProduct);

            // Auto-link to Submission by UPC
            if (fullProduct.upc) {
              await this.autoLinkSubmission(fullProduct.upc, BigInt(product.id));
            }

            // Sync artists to per-user saved lists
            await this.syncArtistsToSavedArtists(fullProduct);

            // Sync files to Dropbox (cover art + audio)
            try {
              await this.syncProductToDropbox(fullProduct, product.id);
            } catch (dbxErr) {
              result.errors.push(`Dropbox sync for ${product.id}: ${dbxErr.message}`);
            }
          } catch (productErr) {
            result.errors.push(`Product ${product.id}: ${productErr.message}`);
          }
        }

        // FUGA pagination: stop if fewer than `limit` results were returned
        if (products.length < limit) {
          hasMore = false;
        } else {
          page++;
        }
      }

      this.logger.log(
        `pullFromFuga complete — created: ${result.created}, updated: ${result.updated}, errors: ${result.errors.length}`,
      );
    } catch (error) {
      result.errors.push(`pullFromFuga fatal: ${error.message}`);
      this.logger.error(`pullFromFuga fatal error: ${error.message}`);
    }

    return result;
  }

  /**
   * Sync a FUGA product's files to Dropbox:
   * Cover art → /n3rve-submissions/{label}/Releases/{date}_{name}_{upc}/Cover Art/
   * Audio → .../Music/
   */
  /**
   * Strip everything that could break a Dropbox path or filename:
   *  - path separators       / \
   *  - shell/url metacharacters # @
   *  - Windows-reserved      : * ? " < > |
   *  - control chars + NUL    -
   *  - leading/trailing space and dot (Dropbox rejects trailing dots)
   * Also caps length at 120 chars to stay well inside Dropbox's 255-char
   * filename limit even when extensions get appended later.
   */
  private sanitizeForDropbox(input: string, fallback = 'untitled'): string {
    const cleaned = String(input ?? '')
      .replace(/[ -]/g, '') // control chars + NUL + DEL
      .replace(/[/\\:*?"<>|#@]/g, '_') // path/url/shell metacharacters
      .replace(/^[\s.]+|[\s.]+$/g, '') // leading/trailing whitespace + dots
      .slice(0, 120);
    return cleaned || fallback;
  }

  private async syncProductToDropbox(fugaProduct: any, fugaId: string | number): Promise<void> {
    const name = this.sanitizeForDropbox(fugaProduct.name, 'untitled-product');
    const upc = fugaProduct.upc || '';

    // Cover and audio are decided independently now. The previous implementation
    // bailed out as soon as a Dropbox "Cover Art" folder had any file, which
    // silently skipped audio sync for any product that already had a cover.
    // The "already-exists" guard also relied on a derived Dropbox path that
    // dropbox.uploadFile() does not actually use — uploadFile owns the path
    // layout internally and returns the real path + shared link.
    const fugaBig = BigInt(fugaId);
    const existing = await this.prisma.catalogProduct.findUnique({
      where: { fugaId: fugaBig },
      select: { coverArtUrl: true },
    });
    const coverAlreadyPersisted = !!existing?.coverArtUrl;

    // ---- Cover art ----
    if (!coverAlreadyPersisted && fugaProduct.cover_image?.has_uploaded) {
      try {
        const cover = await this.fugaApi.downloadProductCoverArt(fugaId);
        if (cover) {
          const isPng = cover.contentType.includes('png') ||
            (cover.buffer[0] === 0x89 && cover.buffer[1] === 0x50);
          const coverFileName = `cover.${isPng ? 'png' : 'jpg'}`;
          // dropbox.uploadFile() decides the destination path and returns the
          // real path + shared URL. We must not pre-construct a path and call
          // getOrCreateSharedLink against it — that path is never created.
          const uploadResult = await this.dropbox.uploadFile(
            cover.buffer,
            coverFileName,
            '',
            '',
            name,
            'cover',
          );
          if (uploadResult?.url) {
            await this.persistCoverArtUrl(fugaId, uploadResult.url);
          }
        }
      } catch (err) {
        this.logger.warn(`Cover art sync failed for ${name}: ${(err as Error).message}`);
      }
    }

    // ---- Audio ----
    for (const asset of fugaProduct.assets || []) {
      if (!asset.audio?.has_uploaded) continue;
      try {
        const audio = await this.fugaApi.downloadAssetAudio(asset.id);
        if (
          audio &&
          audio.buffer.length > 1000 &&
          audio.buffer.length < 150 * 1024 * 1024
        ) {
          const rawName = asset.audio?.original_filename || `${asset.name || 'track'}.wav`;
          const fileName = this.sanitizeForDropbox(rawName, 'track.wav');
          await this.dropbox.uploadFile(audio.buffer, fileName, '', '', name, 'audio');
        }
      } catch (err) {
        this.logger.warn(`Audio sync failed for asset ${asset.id}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Dropbox sync complete for: ${name} (${upc})`);
  }

  /**
   * Save the cover-art shared URL onto the CatalogProduct (always) and the
   * linked Submission (if one exists). The dual write lets the catalog
   * listing show cover art for FUGA-only products that were never submitted
   * through n3rve, while keeping the existing submission-driven behaviour.
   */
  private async persistCoverArtUrl(fugaId: string | number, sharedUrl: string): Promise<void> {
    const fugaBig = BigInt(fugaId);
    const product = await this.prisma.catalogProduct.findUnique({
      where: { fugaId: fugaBig },
      select: { id: true, submissionId: true },
    });
    if (!product) return;
    await this.prisma.catalogProduct.update({
      where: { fugaId: fugaBig },
      data: { coverArtUrl: sharedUrl },
    });
    if (product.submissionId) {
      // Atomic Mongo update with a dotted-path $set. Only writes when the
      // coverImageUrl field is missing/null/empty so concurrent writers cannot
      // overwrite a populated URL, and sibling fields (audioFiles, lyricsFiles,
      // etc.) are never touched — eliminates the read-modify-write race that
      // the previous implementation had.
      try {
        await this.prisma.$runCommandRaw({
          update: 'Submission',
          updates: [
            {
              q: {
                _id: { $oid: product.submissionId },
                $or: [
                  { 'files.coverImageUrl': { $exists: false } },
                  { 'files.coverImageUrl': null },
                  { 'files.coverImageUrl': '' },
                ],
              },
              u: { $set: { 'files.coverImageUrl': sharedUrl } },
              multi: false,
            },
          ],
        });
      } catch (err) {
        this.logger.warn(
          `Submission cover-url backfill failed for ${product.submissionId}: ${(err as Error).message}`,
        );
      }
    }
  }

  private mapReleaseFormatForDb(albumType?: string): string {
    const map: Record<string, string> = {
      SINGLE: 'SINGLE',
      EP: 'EP',
      ALBUM: 'ALBUM',
      COMPILATION: 'COMPILATION',
    };
    return map[(albumType || '').toUpperCase()] || 'SINGLE';
  }

  // ==================== PRIVATE HELPERS ====================

  private mapProductData(product: any) {
    return {
      fugaId: BigInt(product.id),
      name: product.name,
      upc: product.upc,
      catalogNumber: product.catalog_number,
      state: product.state,
      label: typeof product.label === 'object' ? product.label?.name : product.label,
      labelId: (product.label_id || product.label?.id) ? BigInt(product.label_id || product.label?.id) : null,
      displayArtist: product.display_artist,
      genre: this.normalizeGenre(product.genre),
      subgenre: this.normalizeGenre(product.subgenre),
      language: product.language,
      releaseFormatType: product.release_format_type,
      productType: product.product_type,
      cLineText: product.c_line_text,
      cLineYear: this.toIntOrNull(product.c_line_year),
      pLineText: product.p_line_text,
      pLineYear: this.toIntOrNull(product.p_line_year),
      consumerReleaseDate: product.consumer_release_date,
      consumerReleaseTime: product.consumer_release_time || null,
      originalReleaseDate: product.original_release_date,
      addedDate: product.added_date,
      releaseVersion: product.release_version,
      parentalAdvisory: this.toBool(product.parental_advisory),
      parentalAdvisoryNext: product.parental_advisory_next || null,
      // FUGA returns `suborg_owners` (list of {id, name}); the legacy
      // `suborg String[]` field was never populated because FUGA never
      // returned a `suborg` key. Keep the legacy column as [] for back-compat
      // and store the real data in suborgOwners.
      suborg: [],
      suborgOwners: product.suborg_owners || null,
      suborgState: product.suborg_state || null,
      courtesyLine: product.courtesy_line || null,
      labelCopyInfo: product.label_copy_info || null,
      albumNotes: product.album_notes || null,
      metadataLanguage: product.metadata_language || null,
      metadataTranslations: product.metadata_translations || null,
      extraFields: product.extra_fields || null,
      catalogTier: product.catalog_tier || null,
      totalVolumes: product.total_volumes || null,
      totalAssets: this.toIntOrNull(product.total_assets),
      // FUGA returns `compilation` (boolean), not `is_compilation`.
      isCompilation: this.toBool(product.compilation),
      explicitContent: product.explicit_content || null,
      preorderDate: product.preorder_date || null,
      recordingYear: this.toStringOrNull(product.recording_year),
      recordingLocation: product.recording_location || null,
      alternateGenre: this.normalizeGenre(product.alternate_genre),
      alternateSubgenre: this.normalizeGenre(product.alternate_subgenre),
      pricingIntervals: product.pricing_intervals || null,
      customPricing: product.custom_pricing || null,
      usageRights: product.usage_rights || null,
      territoryReleaseDate: product.territory_release_date || null,
      productAttachments: product.attachments || null,
      deliveryInstructions: product.delivery_instructions || null,
      tags: this.toStringArray(product.tags),
      territories: product.territories || null,
      // FUGA-mirrored extended fields
      acquisition: product.acquisition || null,
      artwork: product.artwork || null,
      coverImage: product.cover_image || null,
      customFields: product.custom_fields || null,
      extra1: product.extra_1 ?? null,
      extra2: product.extra_2 ?? null,
      extra3: product.extra_3 ?? null,
      extra4: product.extra_4 ?? null,
      extra5: product.extra_5 ?? null,
      extra6: product.extra_6 ?? null,
      extra7: product.extra_7 ?? null,
      extra8: product.extra_8 ?? null,
      extra9: product.extra_9 ?? null,
      extra10: product.extra_10 ?? null,
      hasBeenDelivered: this.toBool(product.has_been_delivered),
      hashedKey: product.hashed_key || null,
      masteredForItunes: this.toBool(product.mastered_for_itunes),
      lastReviewItem: product.last_review_item || null,
      organization: product.organization || null,
      physicalProduct: product.physical_product || null,
      artists: (product.artists || []).map((a: any) => ({
        fugaId: BigInt(a.id),
        name: a.name,
        primary: a.primary,
        spotifyUrl: a.spotify_url,
        appleMusicUrl: a.apple_music_url,
      })),
      syncedAt: new Date(),
      syncSource: 'nanoclaw',
    };
  }

  private async upsertAsset(asset: any, productFugaId: number) {
    const product = await this.prisma.catalogProduct.findUnique({
      where: { fugaId: BigInt(productFugaId) },
    });
    if (!product) return;

    const data = {
      fugaId: BigInt(asset.id),
      isrc: asset.isrc,
      name: asset.name,
      displayArtist: asset.display_artist,
      version: asset.version,
      duration: asset.duration,
      sequence: asset.sequence,
      genre: this.normalizeGenre(asset.genre),
      subgenre: this.normalizeGenre(asset.subgenre),
      alternateGenre: this.normalizeGenre(asset.alternate_genre),
      alternateSubgenre: this.normalizeGenre(asset.alternate_subgenre),
      language: asset.language,
      audioLocale: asset.audio_locale,
      assetVersion: asset.asset_version,
      versionTypes: (asset.version_types || []).map((v: any) => ({ id: String(v.id), name: String(v.name) })),
      // FUGA does not return a `has_lyrics` flag — derive it from lyrics
      // presence. The schema column was previously always false because
      // every asset has lyrics == undefined for this key.
      hasLyrics: !!(asset.lyrics && String(asset.lyrics).trim()),
      lyrics: asset.lyrics || null,
      pLineYear: this.toStringOrNull(asset.p_line_year),
      pLineText: asset.p_line_text,
      parentalAdvisory: this.toBool(asset.parental_advisory),
      parentalAdvisoryNext: asset.parental_advisory_next || null,
      rightsClaim: asset.rights_claim,
      rightsHolderName: asset.rights_holder_name,
      recordingYear: this.toStringOrNull(asset.recording_year),
      recordingLocation: asset.recording_location,
      countryOfRecording: asset.country_of_recording,
      // FUGA spells this `comissioning` (sic). Preserve their key as-is.
      countryOfComissioning: asset.country_of_comissioning || null,
      assetCatalogTier: asset.asset_catalog_tier,
      audio: asset.audio || null,
      originalEncodings: asset.original_encodings || null,
      artists: (asset.artists || []).map((a: any) => ({
        fugaId: BigInt(a.id),
        name: a.name,
        primary: a.primary,
        spotifyUrl: a.spotify_url,
        appleMusicUrl: a.apple_music_url,
      })),
      // FUGA returns contributors as { id, person: {id, name}, role: {id, name} }
      // — NOT the flat shape `c.person_id` / `c.role_id` the old mapper assumed.
      // Reading `c.person_id` always yielded undefined, and `BigInt(undefined)`
      // threw, which caused every upsertAsset call to silently fail. Result:
      // lyrics, contributors, language and every other rich asset field were
      // never persisted even though FUGA was returning them.
      // Filter out entries where person.id is missing rather than throwing.
      contributors: (asset.contributors || [])
        .filter((c: any) => c?.person?.id != null)
        .map((c: any) => ({
          personId: BigInt(c.person.id),
          name: c.person?.name || '',
          roleId: typeof c.role === 'object' ? (c.role?.id || '') : (c.role_id || ''),
          role: typeof c.role === 'object' ? (c.role?.name || '') : (c.role || ''),
          spotifyUrl: c.spotify_url && c.spotify_url !== '없음' ? c.spotify_url : null,
          appleMusicUrl: c.apple_music_url && c.apple_music_url !== '없음' ? c.apple_music_url : null,
        })),
      publishers: asset.publishers || null,
      audioFileInfo: asset.audio_file_info || asset.audio || null,
      dolbyAtmosFileInfo: asset.dolby_atmos_file || null,
      availableSeparately: asset.available_separately !== false,
      allowPreorder: asset.allow_preorder || false,
      allowPreorderPreview: asset.allow_preorder_preview || false,
      preorderType: asset.preorder_type || null,
      rightsOwnershipName: asset.rights_ownership_name || null,
      rightsContractBeginDate: asset.rights_contract_begin_date || null,
      courtesyLine: asset.courtesy_line || null,
      iswc: asset.iswc || null,
      extraFields: asset.extra_fields || null,
      tags: this.toStringArray(asset.tags),
      assetTerritories: asset.asset_territories || null,
      assetTranslations: asset.translations || null,
      metadataLanguage: asset.metadata_language || null,
      audioLanguage: asset.audio_language || asset.audio_locale || null,
      youtubeShortPreview: asset.youtube_short_preview || false,
      previewLength: asset.preview_length || null,
      // preview_start = 0 is a VALID value (preview begins at start of track)
      // so we cannot use toIntOrNull which collapses 0 to null. Coerce
      // explicitly, preserve 0, only null out genuine null/undefined/empty.
      previewStart:
        asset.preview_start === null ||
        asset.preview_start === undefined ||
        asset.preview_start === ''
          ? null
          : Number(asset.preview_start),
      previewReleaseDateTime: asset.preview_release_date_time || null,
      previewReleaseDateTimeZone: asset.preview_release_date_time_zone || null,
      assetReleaseDate: asset.asset_release_date || null,
      // FUGA-mirrored extended asset fields
      assetState: asset.asset_state || null,
      assetScheduleExcludedTerritories: asset.asset_schedule_excluded_territories || null,
      extra1: asset.extra_1 ?? null,
      extra2: asset.extra_2 ?? null,
      extra3: asset.extra_3 ?? null,
      extra4: asset.extra_4 ?? null,
      extra5: asset.extra_5 ?? null,
      extra6: asset.extra_6 ?? null,
      extra7: asset.extra_7 ?? null,
      extra8: asset.extra_8 ?? null,
      extra9: asset.extra_9 ?? null,
      extra10: asset.extra_10 ?? null,
      mfitEmailAddress: asset.mfit_email_address || null,
      musicalWork: asset.musical_work || null,
      organization: asset.organization || null,
      productsCount: this.toIntOrNull(asset.products_count),
      assetType: asset.type || null,
      videoHd: !!asset.video_hd,
      videoPreviewImage: asset.video_preview_image || null,
      productId: product.id,
    };

    const existing = await this.prisma.catalogAsset.findUnique({
      where: {
        fugaId_productId: {
          fugaId: BigInt(asset.id),
          productId: product.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      // Same Atlas 50-stage pipeline limit as CatalogProduct above — see
      // atomicUpdateCatalogProduct comment. CatalogAsset is even wider after
      // the FUGA-mirror schema expansion, so this MUST be a raw single-$set.
      await this.atomicUpdateCatalogAsset(existing.id, data);
    } else {
      await this.prisma.catalogAsset.create({ data });
    }
  }

  private async upsertArtistsFromProduct(product: any) {
    const allArtists = [...(product.artists || [])];
    for (const asset of product.assets || []) {
      for (const artist of asset.artists || []) {
        if (!allArtists.find((a: any) => a.id === artist.id)) {
          allArtists.push(artist);
        }
      }
      for (const contributor of asset.contributors || []) {
        // FUGA shape: { id, person: {id, name}, role: {id, name} }
        const personId = contributor.person?.id ?? contributor.person_id;
        const personName = contributor.person?.name ?? contributor.name;
        const roleName = typeof contributor.role === 'object'
          ? contributor.role?.name
          : contributor.role;
        if (personId == null) continue; // skip malformed entries instead of throwing
        if (!allArtists.find((a: any) => a.id === personId)) {
          allArtists.push({
            id: personId,
            name: personName,
            spotify_url: contributor.spotify_url,
            apple_music_url: contributor.apple_music_url,
            _isContributor: true,
            _role: roleName,
          });
        }
      }
    }

    for (const artist of allArtists) {
      try {
        const spotifyUrl = artist.spotify_url && artist.spotify_url !== '없음' ? artist.spotify_url : null;
        const appleMusicUrl = artist.apple_music_url && artist.apple_music_url !== '없음' ? artist.apple_music_url : null;

        const data = {
          fugaId: BigInt(artist.id),
          name: artist.name,
          type: (artist._isContributor ? 'CONTRIBUTOR' : 'ARTIST') as any,
          spotifyUrl,
          appleMusicUrl,
          spotifyId: spotifyUrl ? this.extractSpotifyId(spotifyUrl) : null,
          appleMusicId: appleMusicUrl ? this.extractAppleMusicId(appleMusicUrl) : null,
          roles: artist._role ? [artist._role] : [],
          contactDetails: artist.contact_details || null,
          bookingAgent: artist.booking_agent || null,
          countryOfOrigin: artist.country_of_origin || null,
          biography: artist.biography || null,
          labels: artist.labels || [],
          genres: artist.genres || [],
          subgenres: artist.subgenres || [],
          isni: artist.isni || null,
          ipn: artist.ipn || null,
          ipi: artist.ipi || null,
          youtubeOac: artist.youtube_oac || null,
          spotifyDjMixesOptIn: artist.spotify_dj_mixes_opt_in || false,
          translations: artist.translations || null,
          customIdentifiers: artist.custom_identifiers || null,
          syncedAt: new Date(),
        };

        const existing = await this.prisma.catalogArtist.findUnique({
          where: { fugaId: BigInt(artist.id) },
        });

        if (existing) {
          // Merge roles
          const mergedRoles = [...new Set([...existing.roles, ...data.roles])];
          await this.prisma.catalogArtist.update({
            where: { fugaId: BigInt(artist.id) },
            data: { ...data, roles: mergedRoles },
          });
        } else {
          await this.prisma.catalogArtist.create({ data });
        }
      } catch (error) {
        console.warn(`Failed to upsert artist ${artist.id}: ${error.message}`);
      }
    }
  }

  /**
   * Sync artists/contributors from a catalog product to the submitter's SavedArtist/SavedContributor.
   * This bridges the gap between CatalogArtist (global) and SavedArtist (per-user).
   */
  private async syncArtistsToSavedArtists(product: any) {
    try {
      // Find the linked submission to get the submitter (user)
      const catalogProduct = await this.prisma.catalogProduct.findUnique({
        where: { fugaId: BigInt(product.id) },
        select: { submissionId: true },
      });

      if (!catalogProduct?.submissionId) return;

      const submission = await this.prisma.submission.findUnique({
        where: { id: catalogProduct.submissionId },
        select: { submitterId: true, labelAccountId: true },
      });

      if (!submission?.submitterId) return;

      const userId = submission.labelAccountId || submission.submitterId;

      // Collect all artists and contributors from product + assets
      const artists: { name: string; spotifyUrl?: string; appleMusicUrl?: string }[] = [];
      const contributors: { name: string; role?: string }[] = [];

      for (const a of product.artists || []) {
        artists.push({
          name: a.name,
          spotifyUrl: a.spotify_url && a.spotify_url !== '없음' ? a.spotify_url : undefined,
          appleMusicUrl: a.apple_music_url && a.apple_music_url !== '없음' ? a.apple_music_url : undefined,
        });
      }

      for (const asset of product.assets || []) {
        for (const a of asset.artists || []) {
          if (!artists.find((x) => x.name === a.name)) {
            artists.push({
              name: a.name,
              spotifyUrl: a.spotify_url && a.spotify_url !== '없음' ? a.spotify_url : undefined,
              appleMusicUrl: a.apple_music_url && a.apple_music_url !== '없음' ? a.apple_music_url : undefined,
            });
          }
        }
        for (const c of asset.contributors || []) {
          if (!contributors.find((x) => x.name === c.name)) {
            contributors.push({ name: c.name, role: c.role });
          }
        }
      }

      // Upsert SavedArtists
      for (const artist of artists) {
        try {
          const existing = await this.prisma.savedArtist.findFirst({
            where: { userId, name: artist.name },
          });

          if (!existing) {
            const identifiers: any[] = [];
            if (artist.spotifyUrl) {
              identifiers.push({ type: 'SPOTIFY', value: this.extractSpotifyId(artist.spotifyUrl) || '', url: artist.spotifyUrl });
            }
            if (artist.appleMusicUrl) {
              identifiers.push({ type: 'APPLE_MUSIC', value: this.extractAppleMusicId(artist.appleMusicUrl) || '', url: artist.appleMusicUrl });
            }

            await this.prisma.savedArtist.create({
              data: {
                userId,
                name: artist.name,
                identifiers,
                translations: [],
                completionScore: BigInt(0),
                releaseCount: BigInt(1),
                usageCount: BigInt(1),
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
                lastUsed: new Date(),
              },
            });
          } else {
            // Bump release count
            await this.prisma.savedArtist.update({
              where: { id: existing.id },
              data: {
                releaseCount: { increment: 1 },
                lastUsed: new Date(),
                updatedAt: new Date(),
              },
            });
          }
        } catch (err) {
          console.warn(`Failed to sync SavedArtist "${artist.name}": ${err.message}`);
        }
      }

      // Upsert SavedContributors
      for (const contributor of contributors) {
        try {
          const existing = await this.prisma.savedContributor.findFirst({
            where: { userId, name: contributor.name },
          });

          if (!existing) {
            await this.prisma.savedContributor.create({
              data: {
                userId,
                name: contributor.name,
                roles: contributor.role ? [contributor.role] : [],
                instruments: [],
                translations: [],
                identifiers: [],
                createdAt: new Date(),
                lastUsed: new Date(),
                usageCount: BigInt(1),
              },
            });
          } else {
            // Merge roles
            const mergedRoles = contributor.role
              ? [...new Set([...existing.roles, contributor.role])]
              : existing.roles;

            await this.prisma.savedContributor.update({
              where: { id: existing.id },
              data: {
                roles: { set: mergedRoles },
                usageCount: { increment: 1 },
                lastUsed: new Date(),
              },
            });
          }
        } catch (err) {
          console.warn(`Failed to sync SavedContributor "${contributor.name}": ${err.message}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to sync artists to saved artists for product ${product.id}: ${error.message}`);
    }
  }

  private async autoLinkSubmission(upc: string, fugaId: bigint) {
    const product = await this.prisma.catalogProduct.findUnique({ where: { fugaId } });
    if (!product || product.submissionId) return false;

    // Find submission with matching UPC in release data
    const submissions = await this.prisma.submission.findMany({
      where: { release: { is: { upc } } },
    });

    if (submissions.length === 1) {
      await this.prisma.catalogProduct.update({
        where: { fugaId },
        data: { submissionId: submissions[0].id },
      });
      await this.prisma.submission.update({
        where: { id: submissions[0].id },
        data: { catalogProductId: product.id, fugaSyncStatus: 'SYNCED' },
      });
      return true;
    }
    return false;
  }

  private normalizeGenre(genre: any): { id: string; name: string } | undefined {
    if (!genre) return undefined;
    return {
      id: String(genre.id),
      name: String(genre.name),
    };
  }

  /**
   * Coerce FUGA's parental_advisory field into a strict boolean.
   * FUGA returns one of: true | false | "EXPLICIT" | "CLEAN" | "NOT_EXPLICIT" | null.
   * Prisma rejects strings on Boolean fields, so we normalize at the boundary.
   */
  private toBool(value: any): boolean {
    if (value === true) return true;
    if (typeof value === 'string') {
      const v = value.trim().toUpperCase();
      return v === 'EXPLICIT' || v === 'TRUE' || v === 'YES' || v === '1';
    }
    return false;
  }

  /**
   * Coerce FUGA's tags field into a clean String[].
   * FUGA inconsistency observed: most products return [] or ["promo", "new-release"],
   * but some (esp. tagged via the portal UI) return [{ id, name, ... }, ...] objects.
   * Our schema is `tags String[]`, so we extract a name/string from each element.
   */
  private toStringArray(value: any): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((v) => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') return v.name || v.label || v.value || v.id || null;
        return null;
      })
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
  }

  /**
   * FUGA returns several "year" fields as Int (e.g. recording_year=2026,
   * c_line_year=2026), but our schema stores them as String? because some
   * tenants emit "2026-Q1" / "Unknown" / etc. Coerce numbers to their
   * string representation; pass strings through; treat 0 / empty / undefined
   * as null so Prisma doesn't see an Int where it expects String|null.
   */
  private toStringOrNull(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string') return value;
    // Treat 0 / NaN / Infinity as "no value" — recording_year=0 from FUGA
    // is meaningless and shouldn't be persisted as "0".
    if (typeof value === 'number' && Number.isFinite(value) && value !== 0) return String(value);
    return null;
  }

  /**
   * Read a single audio-technical field from FUGA's heterogeneous shapes.
   *
   * FUGA returns audio metadata in two places with different key cases:
   *   - asset.audio       — flat dict, snake_case (bit_depth, sampling_rate, file_size, mime_type)
   *   - asset.originalEncodings[*].vaultItem — camelCase (bitDepth, samplingRate, fileSize, mimeType)
   *
   * UI expects camelCase (asset.audio?.bitDepth etc). This helper looks at
   * both shapes — first preferring originalEncodings (richer + present even
   * when audio dict is missing), falling back to asset.audio. Pass both the
   * camelCase and snake_case key names since FUGA uses both.
   */
  private firstAudioField(asset: any, camelKey: string, snakeKey: string): any {
    const encodings = Array.isArray(asset?.originalEncodings) ? asset.originalEncodings : [];
    for (const enc of encodings) {
      const vault = enc?.vaultItem || enc;
      const v = vault?.[camelKey] ?? vault?.[snakeKey];
      if (v != null && v !== '') return v;
    }
    const audio = asset?.audio;
    if (audio) {
      const v = audio[camelKey] ?? audio[snakeKey];
      if (v != null && v !== '') return v;
    }
    return null;
  }

  /**
   * Coerce FUGA year/count fields into Int or null. Used for c_line_year,
   * p_line_year, total_assets, etc. that the schema models as Int? — empty
   * strings and 0 are treated as "no value" the same as recording_year above
   * (FUGA sometimes emits 0 for unknown years).
   */
  private toIntOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (!Number.isFinite(n) || n === 0) return null;
    return n;
  }

  /**
   * Convert a Prisma-style data object into Mongo extended-JSON suitable for
   * `$runCommandRaw`. BigInt → { $numberLong }, Date → { $date }. Nulls and
   * undefined are passed through. Other values pass through as-is — Mongo
   * accepts JS-native types in extended JSON for Json columns.
   *
   * This is called by atomicUpdateCatalogProduct / atomicUpdateCatalogAsset
   * to avoid the Prisma pipeline-style update that hits the Atlas
   * 50-stage pipeline limit on our wide schema.
   */
  private toMongoExtendedJson(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'bigint') return { $numberLong: value.toString() };
    if (value instanceof Date) return { $date: value.toISOString() };
    if (Array.isArray(value)) return value.map((v) => this.toMongoExtendedJson(v));
    if (typeof value === 'object') {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = this.toMongoExtendedJson(v);
      }
      return out;
    }
    return value;
  }

  /**
   * Single-stage `$set` update of a CatalogProduct, bypassing Prisma's
   * pipeline-style update that explodes into one stage per field. Required
   * because MongoDB Atlas caps update aggregation pipelines at 50 stages,
   * and our CatalogProduct schema mirrors FUGA's full payload (~60 fields).
   *
   * `data` is shaped like a Prisma update payload: plain JS object with
   * BigInt / Date / nested objects. We convert to Mongo extended JSON and
   * issue a raw `update` command with a single `$set` stage.
   */
  private async atomicUpdateCatalogProduct(id: string, data: Record<string, any>): Promise<void> {
    const $set: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      $set[k] = this.toMongoExtendedJson(v);
    }
    if (Object.keys($set).length === 0) return;
    await this.prisma.$runCommandRaw({
      update: 'CatalogProduct',
      updates: [
        {
          q: { _id: { $oid: id } },
          u: { $set },
          multi: false,
        },
      ],
    } as any);
  }

  /**
   * Same as atomicUpdateCatalogProduct, for CatalogAsset.
   */
  private async atomicUpdateCatalogAsset(id: string, data: Record<string, any>): Promise<void> {
    const $set: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      $set[k] = this.toMongoExtendedJson(v);
    }
    if (Object.keys($set).length === 0) return;
    await this.prisma.$runCommandRaw({
      update: 'CatalogAsset',
      updates: [
        {
          q: { _id: { $oid: id } },
          u: { $set },
          multi: false,
        },
      ],
    } as any);
  }

  private toRawDropboxUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.includes('dropbox.com')) {
      if (url.includes('dl=0')) return url.replace('dl=0', 'raw=1');
      if (!url.includes('raw=1') && !url.includes('dl=1')) {
        return url + (url.includes('?') ? '&' : '?') + 'raw=1';
      }
    }
    return url;
  }

  private extractSpotifyId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/artist[:/]([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  private extractAppleMusicId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/artist\/(\d+)/);
    return match ? match[1] : null;
  }

  private serializeProduct(product: any) {
    return {
      ...product,
      fugaId: product.fugaId?.toString(),
      labelId: product.labelId?.toString(),
      artists: product.artists?.map((a: any) => ({
        ...a,
        fugaId: a.fugaId?.toString(),
      })),
      assets: product.assets?.map((a: any) => this.serializeAsset(a)),
    };
  }

  private serializeAsset(asset: any) {
    return {
      ...asset,
      fugaId: asset.fugaId?.toString(),
      artists: asset.artists?.map((a: any) => ({ ...a, fugaId: a.fugaId?.toString() })),
      contributors: asset.contributors?.map((c: any) => ({ ...c, personId: c.personId?.toString() })),
    };
  }

  private serializeArtist(artist: any) {
    return {
      ...artist,
      fugaId: artist.fugaId?.toString(),
    };
  }
}
