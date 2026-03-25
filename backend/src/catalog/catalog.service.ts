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
      genre: product.genre || undefined,
      subgenre: product.subgenre || undefined,
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
      genre: asset.genre || undefined,
      subgenre: asset.subgenre || undefined,
      alternateGenre: asset.alternate_genre || undefined,
      alternateSubgenre: asset.alternate_subgenre || undefined,
      language: asset.language,
      audioLocale: asset.audio_locale,
      assetVersion: asset.asset_version,
      versionTypes: (asset.version_types || []).map((v: any) => ({ id: v.id, name: v.name })),
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
