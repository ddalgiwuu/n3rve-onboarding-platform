# Catalog Metadata Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** NanoClaw이 FUGA에서 추출한 카탈로그 메타데이터를 n3rve-onboarding-platform에 통합하여 동기화 API + 카탈로그 조회 UI를 제공한다.

**Architecture:** 3개의 새 Prisma 모델(CatalogProduct, CatalogAsset, CatalogArtist)을 추가하고, NestJS catalog 모듈을 생성한다. API Key 기반 동기화 엔드포인트와 JWT 인증 조회 엔드포인트를 분리하며, React 프론트엔드에 /catalog 라우트를 추가한다.

**Tech Stack:** NestJS, Prisma (MongoDB), React 19, Vite, Tailwind CSS, Radix UI, TanStack Query

---

## Task 1: Prisma 스키마에 새 모델 추가

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Step 1: CatalogProduct, CatalogAsset, CatalogArtist 모델 추가**

`schema.prisma` 파일 끝에 추가:

```prisma
// ==================== CATALOG (FUGA SYNC) ====================

enum FugaSyncStatus {
  NOT_SYNCED
  SYNCED
  MISMATCH
}

enum CatalogArtistType {
  ARTIST
  CONTRIBUTOR
}

type CatalogArtistRef {
  fugaId      BigInt
  name        String
  primary     Boolean?
  spotifyUrl  String?
  appleMusicUrl String?
}

type CatalogContributor {
  personId      BigInt
  name          String
  roleId        String
  role          String
  spotifyUrl    String?
  appleMusicUrl String?
}

type CatalogVersionType {
  id   String
  name String
}

type CatalogGenre {
  id   String
  name String
}

model CatalogProduct {
  id                   String   @id @default(auto()) @map("_id") @db.ObjectId
  fugaId               BigInt   @unique
  name                 String
  upc                  String
  catalogNumber        String?
  state                String   // DELIVERED, PENDING, etc.
  label                String?
  labelId              BigInt?
  displayArtist        String?
  genre                CatalogGenre?
  subgenre             CatalogGenre?
  language             String?
  releaseFormatType    String?  // EP, ALBUM, SINGLE
  productType          String?  // AUDIO_PRODUCT
  cLineText            String?
  pLineText            String?
  consumerReleaseDate  String?
  originalReleaseDate  String?
  addedDate            String?
  releaseVersion       String?
  parentalAdvisory     Boolean  @default(false)
  suborg               String[]
  artists              CatalogArtistRef[]
  syncedAt             DateTime @default(now()) @db.Date
  syncSource           String   @default("nanoclaw")

  // Link to Submission
  submissionId         String?  @db.ObjectId
  submission           Submission? @relation(fields: [submissionId], references: [id])

  // Assets
  assets               CatalogAsset[]

  createdAt            DateTime @default(now()) @db.Date
  updatedAt            DateTime @updatedAt @db.Date
}

model CatalogAsset {
  id                   String   @id @default(auto()) @map("_id") @db.ObjectId
  fugaId               BigInt   @unique
  isrc                 String?
  name                 String
  displayArtist        String?
  version              String?
  duration             Int?     // seconds
  sequence             Int?
  genre                CatalogGenre?
  subgenre             CatalogGenre?
  alternateGenre       CatalogGenre?
  alternateSubgenre    CatalogGenre?
  language             String?
  audioLocale          String?
  assetVersion         String?
  versionTypes         CatalogVersionType[]
  hasLyrics            Boolean  @default(false)
  lyrics               String?
  pLineYear            String?
  pLineText            String?
  parentalAdvisory     Boolean  @default(false)
  rightsClaim          String?  // MONETIZE, BLOCK, TRACK
  rightsHolderName     String?
  recordingYear        String?
  recordingLocation    String?
  countryOfRecording   String?
  assetCatalogTier     String?  // MID, FRONT, BACK
  audio                Json?    // audio encoding details
  originalEncodings    Json?    // original encoding info
  artists              CatalogArtistRef[]
  contributors         CatalogContributor[]
  publishers           Json?

  // Parent product
  productId            String   @db.ObjectId
  product              CatalogProduct @relation(fields: [productId], references: [id])

  createdAt            DateTime @default(now()) @db.Date
  updatedAt            DateTime @updatedAt @db.Date
}

model CatalogArtist {
  id                   String   @id @default(auto()) @map("_id") @db.ObjectId
  fugaId               BigInt   @unique
  name                 String
  type                 CatalogArtistType @default(ARTIST)
  spotifyId            String?
  spotifyUrl           String?
  appleMusicId         String?
  appleMusicUrl        String?
  roles                String[] // for CONTRIBUTORs
  syncedAt             DateTime @default(now()) @db.Date

  createdAt            DateTime @default(now()) @db.Date
  updatedAt            DateTime @updatedAt @db.Date
}
```

**Step 2: Submission 모델에 카탈로그 연결 필드 추가**

`Submission` 모델 안에 추가:

```prisma
  // Catalog sync
  catalogProductId     String?            @db.ObjectId
  fugaSyncStatus       String?            @default("NOT_SYNCED") // NOT_SYNCED | SYNCED | MISMATCH
```

그리고 `Submission` 모델의 relations 부분에 역방향 관계 추가:

```prisma
  catalogProducts      CatalogProduct[]
```

**Step 3: Prisma generate 실행**

Run: `cd backend && npx prisma generate`
Expected: "Generated Prisma Client"

**Step 4: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add CatalogProduct, CatalogAsset, CatalogArtist models for FUGA sync"
```

---

## Task 2: API Key 인증 가드 생성

**Files:**
- Create: `backend/src/auth/guards/api-key.guard.ts`
- Create: `backend/src/auth/decorators/api-key.decorator.ts`

**Step 1: API Key 데코레이터 생성**

`backend/src/auth/decorators/api-key.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_API_KEY = 'isApiKey';
export const ApiKeyAuth = () => SetMetadata(IS_API_KEY, true);
```

**Step 2: API Key 가드 생성**

`backend/src/auth/guards/api-key.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_API_KEY } from '../decorators/api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isApiKey = this.reflector.getAllAndOverride<boolean>(IS_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isApiKey) return true;

    const request = context.switchToHttp().getRequest();

    // Allow internal network (localhost)
    const ip = request.ip || request.connection?.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return true;
    }

    // Check x-api-key header
    const apiKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('CATALOG_API_KEY');

    if (!validKey) {
      console.warn('⚠️ CATALOG_API_KEY not configured');
      throw new UnauthorizedException('API key not configured');
    }

    if (apiKey !== validKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
```

**Step 3: Commit**

```bash
git add backend/src/auth/guards/api-key.guard.ts backend/src/auth/decorators/api-key.decorator.ts
git commit -m "feat: add API key guard for catalog sync endpoints"
```

---

## Task 3: Catalog NestJS 모듈 — 서비스

**Files:**
- Create: `backend/src/catalog/catalog.service.ts`

**Step 1: 서비스 생성**

`backend/src/catalog/catalog.service.ts`:

```typescript
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
        // skip duplicates silently
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
        // skip
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
```

**Step 2: Commit**

```bash
git add backend/src/catalog/catalog.service.ts
git commit -m "feat: add catalog service with sync, query, and linking logic"
```

---

## Task 4: Catalog NestJS 모듈 — 컨트롤러 + 모듈

**Files:**
- Create: `backend/src/catalog/catalog.controller.ts`
- Create: `backend/src/catalog/catalog.module.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: 컨트롤러 생성**

`backend/src/catalog/catalog.controller.ts`:

```typescript
import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiKeyAuth } from '../auth/decorators/api-key.decorator';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ==================== SYNC (API Key auth) ====================

  @Post('sync/products')
  @Public()
  @ApiKeyAuth()
  @UseGuards(ApiKeyGuard)
  async syncProducts(@Body() body: { products: any[] }) {
    return this.catalogService.syncProducts(body.products);
  }

  @Post('sync/artists')
  @Public()
  @ApiKeyAuth()
  @UseGuards(ApiKeyGuard)
  async syncArtists(@Body() body: { artists?: any[]; people?: any[] }) {
    return this.catalogService.syncArtists(body);
  }

  @Get('sync/status')
  @Public()
  @ApiKeyAuth()
  @UseGuards(ApiKeyGuard)
  async getSyncStatus() {
    return this.catalogService.getSyncStatus();
  }

  // ==================== QUERY (JWT auth) ====================

  @Get('products')
  @UseGuards(JwtAuthGuard)
  async findProducts(
    @Query('search') search?: string,
    @Query('state') state?: string,
    @Query('label') label?: string,
    @Query('format') format?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.findProducts({
      search, state, label, format,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard)
  async findProduct(@Param('id') id: string) {
    return this.catalogService.findProductById(id);
  }

  @Get('artists')
  @UseGuards(JwtAuthGuard)
  async findArtists(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.findArtists({
      search, type,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('artists/:id')
  @UseGuards(JwtAuthGuard)
  async findArtist(@Param('id') id: string) {
    return this.catalogService.findArtistById(id);
  }

  @Get('assets/search')
  @UseGuards(JwtAuthGuard)
  async searchAssets(
    @Query('search') search?: string,
    @Query('isrc') isrc?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.searchAssets({
      search, isrc,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.catalogService.getStats();
  }

  // ==================== LINKING ====================

  @Post('link/:productId')
  @UseGuards(JwtAuthGuard)
  async linkToSubmission(
    @Param('productId') productId: string,
    @Body() body: { submissionId: string },
  ) {
    return this.catalogService.linkToSubmission(productId, body.submissionId);
  }

  @Get('unlinked')
  @UseGuards(JwtAuthGuard)
  async findUnlinked(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.findUnlinked({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }
}
```

**Step 2: 모듈 생성**

`backend/src/catalog/catalog.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
```

**Step 3: AppModule에 등록**

`backend/src/app.module.ts`의 imports 배열에 추가:

```typescript
import { CatalogModule } from './catalog/catalog.module';
// ...
imports: [
  // ... existing modules
  CatalogModule,
],
```

**Step 4: Commit**

```bash
git add backend/src/catalog/ backend/src/app.module.ts
git commit -m "feat: add catalog controller and module with sync + query endpoints"
```

---

## Task 5: 프론트엔드 — API 클라이언트 + 타입

**Files:**
- Create: `frontend/src/lib/catalog-api.ts`
- Create: `frontend/src/types/catalog.ts`

**Step 1: 타입 정의**

`frontend/src/types/catalog.ts`:

```typescript
export interface CatalogGenre {
  id: string;
  name: string;
}

export interface CatalogArtistRef {
  fugaId: string;
  name: string;
  primary?: boolean;
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

export interface CatalogContributor {
  personId: string;
  name: string;
  roleId: string;
  role: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

export interface CatalogVersionType {
  id: string;
  name: string;
}

export interface CatalogAsset {
  id: string;
  fugaId: string;
  isrc?: string;
  name: string;
  displayArtist?: string;
  version?: string;
  duration?: number;
  sequence?: number;
  genre?: CatalogGenre;
  subgenre?: CatalogGenre;
  alternateGenre?: CatalogGenre;
  alternateSubgenre?: CatalogGenre;
  language?: string;
  audioLocale?: string;
  assetVersion?: string;
  versionTypes: CatalogVersionType[];
  hasLyrics: boolean;
  lyrics?: string;
  pLineYear?: string;
  pLineText?: string;
  parentalAdvisory: boolean;
  rightsClaim?: string;
  rightsHolderName?: string;
  recordingYear?: string;
  recordingLocation?: string;
  countryOfRecording?: string;
  assetCatalogTier?: string;
  audio?: any;
  originalEncodings?: any;
  artists: CatalogArtistRef[];
  contributors: CatalogContributor[];
  publishers?: any;
  productId: string;
}

export interface CatalogProduct {
  id: string;
  fugaId: string;
  name: string;
  upc: string;
  catalogNumber?: string;
  state: string;
  label?: string;
  labelId?: string;
  displayArtist?: string;
  genre?: CatalogGenre;
  subgenre?: CatalogGenre;
  language?: string;
  releaseFormatType?: string;
  productType?: string;
  cLineText?: string;
  pLineText?: string;
  consumerReleaseDate?: string;
  originalReleaseDate?: string;
  addedDate?: string;
  releaseVersion?: string;
  parentalAdvisory: boolean;
  suborg: string[];
  artists: CatalogArtistRef[];
  syncedAt: string;
  submissionId?: string;
  submission?: { id: string; status: string; albumTitle?: string };
  assets?: CatalogAsset[];
  _count?: { assets: number };
}

export interface CatalogArtist {
  id: string;
  fugaId: string;
  name: string;
  type: 'ARTIST' | 'CONTRIBUTOR';
  spotifyId?: string;
  spotifyUrl?: string;
  appleMusicId?: string;
  appleMusicUrl?: string;
  roles: string[];
  products?: CatalogProduct[];
}

export interface CatalogStats {
  products: number;
  assets: number;
  artists: number;
  labels: number;
  linked: number;
  unlinked: number;
  lastSyncedAt: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
```

**Step 2: API 클라이언트**

`frontend/src/lib/catalog-api.ts`:

```typescript
import api from './api';
import type {
  CatalogProduct, CatalogArtist, CatalogAsset,
  CatalogStats, PaginatedResponse,
} from '../types/catalog';

// Re-export api default for direct use
const catalogApi = {
  // Products
  getProducts: (params?: {
    search?: string; state?: string; label?: string;
    format?: string; page?: number; limit?: number;
  }) => api.get<PaginatedResponse<CatalogProduct>>('/catalog/products', { params }),

  getProduct: (id: string) =>
    api.get<CatalogProduct>(`/catalog/products/${id}`),

  // Artists
  getArtists: (params?: {
    search?: string; type?: string; page?: number; limit?: number;
  }) => api.get<PaginatedResponse<CatalogArtist>>('/catalog/artists', { params }),

  getArtist: (id: string) =>
    api.get<CatalogArtist>(`/catalog/artists/${id}`),

  // Assets
  searchAssets: (params?: {
    search?: string; isrc?: string; page?: number; limit?: number;
  }) => api.get<PaginatedResponse<CatalogAsset>>('/catalog/assets/search', { params }),

  // Stats
  getStats: () => api.get<CatalogStats>('/catalog/stats'),

  // Linking
  linkToSubmission: (productId: string, submissionId: string) =>
    api.post(`/catalog/link/${productId}`, { submissionId }),

  getUnlinked: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<CatalogProduct>>('/catalog/unlinked', { params }),
};

export default catalogApi;
```

Note: `api`는 `frontend/src/lib/api.ts`에서 이미 export default하는 axios 인스턴스를 import.

**Step 3: Commit**

```bash
git add frontend/src/types/catalog.ts frontend/src/lib/catalog-api.ts
git commit -m "feat: add catalog TypeScript types and API client"
```

---

## Task 6: 프론트엔드 — Catalog 페이지 (메인 목록)

**Files:**
- Create: `frontend/src/pages/Catalog.tsx`
- Modify: `frontend/src/App.tsx` (라우트 추가)

**Step 1: Catalog 페이지 생성**

`frontend/src/pages/Catalog.tsx`:

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Music, Users, Disc3, Building2, Link2, Unlink } from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import type { CatalogProduct } from '../types/catalog';

function formatDuration(seconds?: number) {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
      <Icon className="h-5 w-5 text-zinc-400" />
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function StateTag({ state }: { state: string }) {
  const colors: Record<string, string> = {
    DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[state] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
      {state}
    </span>
  );
}

function FormatTag({ format }: { format?: string }) {
  if (!format) return null;
  return (
    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      {format}
    </span>
  );
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ['catalog-stats'],
    queryFn: () => catalogApi.getStats().then(r => r.data),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['catalog-products', search, stateFilter, labelFilter, formatFilter, page],
    queryFn: () => catalogApi.getProducts({
      search: search || undefined,
      state: stateFilter || undefined,
      label: labelFilter || undefined,
      format: formatFilter || undefined,
      page,
      limit: 20,
    }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Catalog</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          FUGA 카탈로그 메타데이터 — 마지막 동기화: {stats?.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString('ko-KR') : '-'}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Disc3} label="프로덕트" value={stats.products} />
          <StatCard icon={Music} label="트랙" value={stats.assets} />
          <StatCard icon={Users} label="아티스트" value={stats.artists} />
          <StatCard icon={Building2} label="레이블" value={stats.labels} />
          <StatCard icon={Link2} label="연결됨" value={stats.linked} />
          <StatCard icon={Unlink} label="미연결" value={stats.unlinked} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="검색 (앨범명, UPC, 아티스트)..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={stateFilter}
          onChange={e => { setStateFilter(e.target.value); setPage(1); }}
        >
          <option value="">모든 상태</option>
          <option value="DELIVERED">Delivered</option>
          <option value="PENDING">Pending</option>
          <option value="TAKEDOWN">Takedown</option>
        </select>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={formatFilter}
          onChange={e => { setFormatFilter(e.target.value); setPage(1); }}
        >
          <option value="">모든 포맷</option>
          <option value="SINGLE">Single</option>
          <option value="EP">EP</option>
          <option value="ALBUM">Album</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">앨범</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">아티스트</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">UPC</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">포맷</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">상태</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-300">트랙</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-300">연결</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400">불러오는 중...</td></tr>
            ) : productsData?.data?.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400">결과 없음</td></tr>
            ) : (
              productsData?.data?.map((product: CatalogProduct) => (
                <tr
                  key={product.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() => navigate(`/catalog/${product.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-white">{product.name}</div>
                    {product.releaseVersion && (
                      <div className="text-xs text-zinc-400">{product.releaseVersion}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{product.displayArtist}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{product.upc}</td>
                  <td className="px-4 py-3"><FormatTag format={product.releaseFormatType} /></td>
                  <td className="px-4 py-3"><StateTag state={product.state} /></td>
                  <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300">{product._count?.assets || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {product.submissionId ? (
                      <span className="text-green-500" title="Submission 연결됨">&#x2713;</span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600" title="미연결">&#x2717;</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {productsData && productsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            총 {productsData.total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, productsData.total)}
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:text-white"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              이전
            </button>
            <button
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:text-white"
              disabled={page >= productsData.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: App.tsx에 라우트 추가**

`frontend/src/App.tsx` 상단에 lazy import 추가:

```typescript
const CatalogPage = lazy(() => import('./pages/Catalog'));
const CatalogDetailPage = lazy(() => import('./pages/CatalogDetail'));
const CatalogArtistsPage = lazy(() => import('./pages/CatalogArtists'));
```

`<Route element={<Layout />}>` 안에 라우트 추가 (기존 라우트들 근처에):

```tsx
<Route path="/catalog" element={<Suspense fallback={<LoadingSpinner />}><CatalogPage /></Suspense>} />
<Route path="/catalog/:id" element={<Suspense fallback={<LoadingSpinner />}><CatalogDetailPage /></Suspense>} />
<Route path="/catalog/artists" element={<Suspense fallback={<LoadingSpinner />}><CatalogArtistsPage /></Suspense>} />
```

**Step 3: Commit**

```bash
git add frontend/src/pages/Catalog.tsx frontend/src/App.tsx
git commit -m "feat: add catalog list page with stats, filters, and product table"
```

---

## Task 7: 프론트엔드 — CatalogDetail 페이지 (프로덕트 상세 + 트랙)

**Files:**
- Create: `frontend/src/pages/CatalogDetail.tsx`

**Step 1: 상세 페이지 생성**

`frontend/src/pages/CatalogDetail.tsx`:

```tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Music, Clock, ChevronDown, ChevronRight,
  ExternalLink, Disc3, Users, FileText,
} from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import type { CatalogAsset, CatalogContributor } from '../types/catalog';

function formatDuration(seconds?: number) {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function DspLink({ url, type }: { url?: string | null; type: 'spotify' | 'apple' }) {
  if (!url) return null;
  const label = type === 'spotify' ? 'Spotify' : 'Apple Music';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
    >
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function ContributorsByRole({ contributors }: { contributors: CatalogContributor[] }) {
  const grouped: Record<string, CatalogContributor[]> = {};
  for (const c of contributors) {
    if (!grouped[c.role]) grouped[c.role] = [];
    // Deduplicate by personId within same role
    if (!grouped[c.role].find(x => x.personId === c.personId)) {
      grouped[c.role].push(c);
    }
  }

  return (
    <div className="space-y-2 pl-4">
      {Object.entries(grouped).map(([role, people]) => (
        <div key={role}>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{role}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {people.map(c => (
              <span key={c.personId} className="inline-flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                {c.name}
                <DspLink url={c.spotifyUrl} type="spotify" />
                <DspLink url={c.appleMusicUrl} type="apple" />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackRow({ asset, index }: { asset: CatalogAsset; index: number }) {
  const [showContributors, setShowContributors] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const title = asset.version ? `${asset.name} (${asset.version})` : asset.name;

  return (
    <div className="border-b border-zinc-100 last:border-0 dark:border-zinc-700">
      {/* Track main row */}
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-6 text-center text-sm text-zinc-400">{asset.sequence || index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-zinc-900 dark:text-white truncate">{title}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {asset.isrc && <span className="font-mono">ISRC: {asset.isrc}</span>}
            {asset.assetCatalogTier && <span>Tier: {asset.assetCatalogTier}</span>}
            {asset.versionTypes?.length > 0 && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-700">
                {asset.versionTypes.map(v => v.name).join(', ')}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(asset.duration)}
        </span>
      </div>

      {/* Expandable sections */}
      <div className="flex gap-2 px-4 pb-2">
        {asset.contributors?.length > 0 && (
          <button
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            onClick={() => setShowContributors(!showContributors)}
          >
            {showContributors ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <Users className="h-3 w-3" />
            기여자 ({asset.contributors.length})
          </button>
        )}
        {asset.hasLyrics && asset.lyrics && (
          <button
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            onClick={() => setShowLyrics(!showLyrics)}
          >
            {showLyrics ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <FileText className="h-3 w-3" />
            가사
          </button>
        )}
      </div>

      {/* Contributors accordion */}
      {showContributors && asset.contributors && (
        <div className="px-4 pb-3">
          <ContributorsByRole contributors={asset.contributors} />
        </div>
      )}

      {/* Lyrics accordion */}
      {showLyrics && asset.lyrics && (
        <div className="px-4 pb-3">
          <pre className="max-h-60 overflow-auto rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 whitespace-pre-wrap dark:bg-zinc-800 dark:text-zinc-300">
            {asset.lyrics}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function CatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ['catalog-product', id],
    queryFn: () => catalogApi.getProduct(id!).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-zinc-400">불러오는 중...</div>;
  }

  if (!product) {
    return <div className="flex h-64 items-center justify-center text-zinc-400">프로덕트를 찾을 수 없습니다</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        onClick={() => navigate('/catalog')}
      >
        <ArrowLeft className="h-4 w-4" /> 카탈로그로 돌아가기
      </button>

      {/* Product header */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{product.name}</h1>
              {product.releaseVersion && (
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-sm text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {product.releaseVersion}
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                product.state === 'DELIVERED'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {product.state}
              </span>
            </div>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">{product.displayArtist}</p>
          </div>
          <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
            {product.releaseFormatType && <p>{product.releaseFormatType}</p>}
            {product.label && <p>{product.label}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-zinc-400">UPC</p>
            <p className="font-mono text-zinc-700 dark:text-zinc-300">{product.upc}</p>
          </div>
          <div>
            <p className="text-zinc-400">발매일</p>
            <p className="text-zinc-700 dark:text-zinc-300">{product.consumerReleaseDate?.split('T')[0] || '-'}</p>
          </div>
          <div>
            <p className="text-zinc-400">장르</p>
            <p className="text-zinc-700 dark:text-zinc-300">{product.genre?.name || '-'}</p>
          </div>
          <div>
            <p className="text-zinc-400">언어</p>
            <p className="text-zinc-700 dark:text-zinc-300">{product.language || '-'}</p>
          </div>
          <div>
            <p className="text-zinc-400">&copy; Line</p>
            <p className="text-zinc-700 dark:text-zinc-300">{product.cLineText || '-'}</p>
          </div>
          <div>
            <p className="text-zinc-400">&#x2117; Line</p>
            <p className="text-zinc-700 dark:text-zinc-300">{product.pLineText || '-'}</p>
          </div>
          <div>
            <p className="text-zinc-400">Submission</p>
            {product.submission ? (
              <button
                className="text-blue-500 hover:underline"
                onClick={() => navigate(`/admin/submissions/${product.submission!.id}`)}
              >
                {product.submission.albumTitle || product.submission.id} ({product.submission.status})
              </button>
            ) : (
              <span className="text-zinc-400">미연결</span>
            )}
          </div>
          <div>
            <p className="text-zinc-400">동기화</p>
            <p className="text-zinc-700 dark:text-zinc-300">{new Date(product.syncedAt).toLocaleString('ko-KR')}</p>
          </div>
        </div>

        {/* Artists with DSP links */}
        {product.artists?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">아티스트</p>
            <div className="flex flex-wrap gap-3">
              {product.artists.map((artist, i) => (
                <div key={i} className="inline-flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{artist.name}</span>
                  {artist.primary && <span className="text-xs text-zinc-400">(Primary)</span>}
                  <DspLink url={artist.spotifyUrl} type="spotify" />
                  <DspLink url={artist.appleMusicUrl} type="apple" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tracks */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <Music className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            트랙 ({product.assets?.length || 0})
          </h2>
        </div>
        {product.assets?.map((asset, i) => (
          <TrackRow key={asset.id} asset={asset} index={i} />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/CatalogDetail.tsx
git commit -m "feat: add catalog detail page with track list, contributors, and lyrics"
```

---

## Task 8: 프론트엔드 — CatalogArtists 페이지

**Files:**
- Create: `frontend/src/pages/CatalogArtists.tsx`

**Step 1: 아티스트 페이지 생성**

`frontend/src/pages/CatalogArtists.tsx`:

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ExternalLink } from 'lucide-react';
import catalogApi from '../lib/catalog-api';
import type { CatalogArtist } from '../types/catalog';

export default function CatalogArtistsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['catalog-artists', search, typeFilter, page],
    queryFn: () => catalogApi.getArtists({
      search: search || undefined,
      type: typeFilter || undefined,
      page,
      limit: 30,
    }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">아티스트 & 기여자</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">FUGA 카탈로그 아티스트 / 기여자 목록</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="이름 검색..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">전체</option>
          <option value="ARTIST">아티스트</option>
          <option value="CONTRIBUTOR">기여자</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="col-span-full text-center text-zinc-400 py-8">불러오는 중...</p>
        ) : data?.data?.length === 0 ? (
          <p className="col-span-full text-center text-zinc-400 py-8">결과 없음</p>
        ) : (
          data?.data?.map((artist: CatalogArtist) => (
            <div
              key={artist.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{artist.name}</p>
                  <span className={`text-xs ${artist.type === 'ARTIST' ? 'text-blue-500' : 'text-zinc-400'}`}>
                    {artist.type === 'ARTIST' ? 'Artist' : 'Contributor'}
                  </span>
                </div>
              </div>
              {artist.roles?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {artist.roles.map(role => (
                    <span key={role} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {role}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                {artist.spotifyUrl && (
                  <a
                    href={artist.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                  >
                    Spotify <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {artist.appleMusicUrl && (
                  <a
                    href={artist.appleMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs text-pink-700 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400"
                  >
                    Apple Music <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">총 {data.total}명</p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:text-white"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              이전
            </button>
            <button
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:text-white"
              disabled={page >= data.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/CatalogArtists.tsx
git commit -m "feat: add catalog artists page with search and DSP links"
```

---

## Task 9: Submission 목록에 FUGA 동기화 뱃지 추가

**Files:**
- Modify: `frontend/src/pages/Submissions.tsx` (또는 관련 Submission 카드 컴포넌트)

**Step 1: Submission 카드에 뱃지 추가**

기존 Submission 카드 렌더링 부분에서 `fugaSyncStatus` 필드를 확인하여 뱃지 표시.
상태 매핑을 보여주는 인라인 컴포넌트:

```tsx
function FugaSyncBadge({ status, catalogProductId }: { status?: string; catalogProductId?: string }) {
  const navigate = useNavigate();
  if (!status || status === 'NOT_SYNCED') {
    return <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400 dark:bg-zinc-700">미연결</span>;
  }
  const isSynced = status === 'SYNCED';
  return (
    <button
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isSynced
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (catalogProductId) navigate(`/catalog/${catalogProductId}`);
      }}
    >
      {isSynced ? 'FUGA 동기화됨' : 'FUGA 불일치'}
    </button>
  );
}
```

이 컴포넌트를 Submission 카드/행의 status 옆에 배치.

**Step 2: Commit**

```bash
git add frontend/src/pages/Submissions.tsx
git commit -m "feat: add FUGA sync status badge to submission cards"
```

---

## Task 10: 사이드바 네비게이션에 Catalog 메뉴 추가

**Files:**
- Modify: `frontend/src/components/layout/Layout.tsx` (또는 Sidebar 컴포넌트)

**Step 1: Catalog 링크 추가**

사이드바 네비게이션 항목에 추가:

```tsx
{ name: 'Catalog', path: '/catalog', icon: Disc3 },
{ name: 'Artists', path: '/catalog/artists', icon: Users },
```

기존 네비게이션 패턴을 따라 추가. `lucide-react`에서 `Disc3`, `Users` 아이콘 import.

**Step 2: Commit**

```bash
git add frontend/src/components/layout/
git commit -m "feat: add catalog and artists links to sidebar navigation"
```

---

## Task 11: 환경 변수 설정 + 배포 준비

**Files:**
- Modify: `backend/.env.example` (또는 `env.example`)
- Modify: `docker-compose.prod.yml`

**Step 1: 환경 변수 추가**

`.env.example`에 추가:

```
CATALOG_API_KEY=your-secure-api-key-here
```

`docker-compose.prod.yml`에 해당 환경 변수 전달 설정.

**Step 2: Commit**

```bash
git add env.example docker-compose.prod.yml
git commit -m "feat: add CATALOG_API_KEY env var for sync authentication"
```

---

## Execution Order Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Prisma schema models | - |
| 2 | API Key guard | - |
| 3 | Catalog service | 1 |
| 4 | Catalog controller + module | 2, 3 |
| 5 | Frontend types + API client | - |
| 6 | Catalog list page | 5 |
| 7 | Catalog detail page | 5 |
| 8 | Catalog artists page | 5 |
| 9 | Submission sync badge | 5 |
| 10 | Sidebar navigation | 6, 7, 8 |
| 11 | Env vars + deploy | 4 |

Tasks 1-2 can run in parallel. Tasks 5-9 can run in parallel. Tasks 3-4 are sequential.
