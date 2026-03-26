import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

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

  async findArtists(params: { search?: string; type?: string; page?: number; limit?: number }) {
    const { search, type, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (type) where.type = type;

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
        totalVolumes: submission?.totalVolumes || null,
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

        // Files from submission
        coverImageUrl: (submission?.files as any)?.coverImageUrl || null,
        artistPhotoUrl: (submission?.files as any)?.artistPhotoUrl || null,

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
          audio: asset.audio,
          originalEncodings: asset.originalEncodings,
          artists: asset.artists?.map((a: any) => ({ ...a, fugaId: a.fugaId?.toString() })),
          contributors: asset.contributors?.map((c: any) => ({ ...c, personId: c.personId?.toString() })),
          publishers: asset.publishers,
          // Enriched from submission track
          titleKo: matchedTrack?.titleKo || null,
          titleEn: matchedTrack?.titleEn || asset.name,
          composer: matchedTrack?.composer || null,
          lyricist: matchedTrack?.lyricist || null,
          arranger: matchedTrack?.arranger || null,
          producer: matchedTrack?.producer || null,
          mixer: matchedTrack?.mixer || null,
          masterer: matchedTrack?.masterer || null,
          dolbyAtmos: matchedTrack?.dolbyAtmos || false,
          sampleRate: matchedTrack?.sampleRate || null,
          bitDepth: matchedTrack?.bitDepth || null,
          audioFormat: matchedTrack?.audioFormat || null,
          previewStart: matchedTrack?.previewStart || null,
          previewEnd: matchedTrack?.previewEnd || null,
          explicitContent: asset.parentalAdvisory || matchedTrack?.explicitContent || false,
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

  // ==================== PRIVATE HELPERS ====================

  private mapProductData(product: any) {
    return {
      fugaId: BigInt(product.id),
      name: product.name,
      upc: product.upc,
      catalogNumber: product.catalog_number,
      state: product.state,
      label: product.label,
      labelId: product.label_id ? BigInt(product.label_id) : null,
      displayArtist: product.display_artist,
      genre: this.normalizeGenre(product.genre),
      subgenre: this.normalizeGenre(product.subgenre),
      language: product.language,
      releaseFormatType: product.release_format_type,
      productType: product.product_type,
      cLineText: product.c_line_text,
      pLineText: product.p_line_text,
      consumerReleaseDate: product.consumer_release_date,
      originalReleaseDate: product.original_release_date,
      addedDate: product.added_date,
      releaseVersion: product.release_version,
      parentalAdvisory: product.parental_advisory || false,
      suborg: product.suborg || [],
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
      hasLyrics: asset.has_lyrics || false,
      lyrics: asset.lyrics || null,
      pLineYear: asset.p_line_year,
      pLineText: asset.p_line_text,
      parentalAdvisory: asset.parental_advisory || false,
      rightsClaim: asset.rights_claim,
      rightsHolderName: asset.rights_holder_name,
      recordingYear: asset.recording_year,
      recordingLocation: asset.recording_location,
      countryOfRecording: asset.country_of_recording,
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
      contributors: (asset.contributors || []).map((c: any) => ({
        personId: BigInt(c.person_id),
        name: c.name,
        roleId: c.role_id,
        role: c.role,
        spotifyUrl: c.spotify_url !== '없음' ? c.spotify_url : null,
        appleMusicUrl: c.apple_music_url !== '없음' ? c.apple_music_url : null,
      })),
      publishers: asset.publishers || null,
      productId: product.id,
    };

    const existing = await this.prisma.catalogAsset.findUnique({
      where: { fugaId: BigInt(asset.id) },
    });

    if (existing) {
      await this.prisma.catalogAsset.update({
        where: { fugaId: BigInt(asset.id) },
        data,
      });
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
        if (!allArtists.find((a: any) => a.id === contributor.person_id)) {
          allArtists.push({
            id: contributor.person_id,
            name: contributor.name,
            spotify_url: contributor.spotify_url,
            apple_music_url: contributor.apple_music_url,
            _isContributor: true,
            _role: contributor.role,
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
