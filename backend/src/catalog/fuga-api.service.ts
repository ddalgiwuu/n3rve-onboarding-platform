import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import FormData from 'form-data';

@Injectable()
export class FugaApiService {
  private readonly logger = new Logger(FugaApiService.name);
  private readonly baseUrl = 'https://login.n3rvemusic.com';
  private sessionCookie: string | null = null;

  constructor(private configService: ConfigService) {}

  // ==================== AUTH ====================

  private requires2FA = false;

  async login(otpCode?: string): Promise<void> {
    const username = this.configService.get<string>('FUGA_USERNAME');
    const password = this.configService.get<string>('FUGA_PASSWORD');

    try {
      // Step 1: Username/password login
      const res = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, password }),
        redirect: 'manual',
      });

      if (res.status !== 200 && res.status !== 302) {
        const body = await res.text();
        throw new Error(`FUGA login failed with status ${res.status}: ${body}`);
      }

      const setCookie = res.headers.raw()['set-cookie'];
      if (!setCookie || setCookie.length === 0) {
        throw new Error('FUGA login succeeded but no session cookie returned');
      }

      this.sessionCookie = setCookie
        .map((c: string) => c.split(';')[0])
        .join('; ');

      // Step 2: Check if 2FA is required
      const loginData = await res.json().catch(() => ({})) as any;
      if (loginData?.user?.is_two_factor_authentication_enabled) {
        this.requires2FA = true;

        if (!otpCode) {
          this.logger.warn('FUGA 2FA required — call loginWith2FA(otpCode) or provide OTP via API');
          return;
        }

        await this.verify2FA(otpCode);
      }

      this.logger.log('FUGA login successful');
    } catch (error) {
      this.sessionCookie = null;
      throw new Error(`FUGA login error: ${error.message}`);
    }
  }

  async verify2FA(otpCode: string): Promise<void> {
    if (!this.sessionCookie) {
      throw new Error('Must call login() first before verify2FA()');
    }

    const tfaRes = await fetch(`${this.baseUrl}/login/2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: this.sessionCookie,
      },
      body: JSON.stringify({ totp: otpCode }),
    });

    if (tfaRes.status !== 200) {
      const body = await tfaRes.text();
      throw new Error(`FUGA 2FA verification failed (${tfaRes.status}): ${body}`);
    }

    // Update session cookie if new ones returned
    const tfaCookies = tfaRes.headers.raw()['set-cookie'];
    if (tfaCookies?.length) {
      this.sessionCookie = tfaCookies
        .map((c: string) => c.split(';')[0])
        .join('; ');
    }

    this.requires2FA = false;
    this.logger.log('FUGA 2FA verification successful');
  }

  is2FARequired(): boolean {
    return this.requires2FA;
  }

  private async ensureAuth(): Promise<string> {
    if (!this.sessionCookie) {
      await this.login();
    }
    return this.sessionCookie!;
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
    retryOnUnauth = true,
  ): Promise<T> {
    const cookie = await this.ensureAuth();

    const headers: Record<string, string> = {
      Cookie: cookie,
      Accept: 'application/json',
    };

    let fetchBody: any;
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      fetchBody = JSON.stringify(body);
    } else if (body instanceof FormData) {
      // Let node-fetch set the multipart boundary automatically
      fetchBody = body;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: fetchBody,
    });

    // If session expired, re-login once and retry
    if (res.status === 401 && retryOnUnauth) {
      this.logger.warn('FUGA session expired, re-authenticating...');
      this.sessionCookie = null;
      return this.request<T>(method, path, body, false);
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`FUGA API error ${res.status} on ${method} ${path}: ${text}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json() as Promise<T>;
    }

    return res.text() as unknown as T;
  }

  // ==================== PRODUCTS ====================

  async createProduct(data: any): Promise<any> {
    this.logger.log(`Creating FUGA product: ${data.name}`);
    return this.request('POST', '/api/v2/products', data);
  }

  async getProducts(params: {
    page?: number;
    limit?: number;
    modified_since?: string;
  } = {}): Promise<any> {
    const { page = 0, limit = 50, modified_since } = params;
    const query = new URLSearchParams({
      page: String(page),
      page_size: String(limit),
    });
    if (modified_since) {
      query.set('modified_since', modified_since);
    }
    return this.request('GET', `/api/v2/products?${query.toString()}`);
  }

  async getProduct(productId: string): Promise<any> {
    return this.request('GET', `/api/v2/products/${productId}`);
  }

  async getProductAssets(productId: string): Promise<any> {
    return this.request('GET', `/api/v2/products/${productId}/assets`);
  }

  // ==================== ASSETS ====================

  async addAsset(productId: string, data: any): Promise<any> {
    this.logger.log(`Adding asset to FUGA product ${productId}: ${data.name}`);
    return this.request('POST', `/api/v2/products/${productId}/assets`, data);
  }

  // ==================== FILE UPLOAD ====================

  async uploadCoverArt(
    productId: string,
    imageBuffer: Buffer,
    filename: string,
  ): Promise<any> {
    this.logger.log(`Uploading cover art for FUGA product ${productId}`);

    const form = new FormData();
    form.append('file', imageBuffer, {
      filename,
      contentType: this.mimeFromFilename(filename),
    });

    return this.request('POST', `/api/v2/products/${productId}/image`, form);
  }

  async uploadAudio(
    assetId: string,
    audioBuffer: Buffer,
    filename: string,
  ): Promise<any> {
    this.logger.log(`Uploading audio for FUGA asset ${assetId}`);

    const form = new FormData();
    form.append('file', audioBuffer, {
      filename,
      contentType: 'audio/wav',
    });

    return this.request('POST', `/api/v2/assets/${assetId}/audio`, form);
  }

  // ==================== ARTISTS ====================

  async findOrCreateArtist(name: string, primary: boolean): Promise<any> {
    try {
      // Search for existing artist by name
      const searchResult = await this.request(
        'GET',
        `/api/v2/artists?page=0&page_size=10&search=${encodeURIComponent(name)}`,
      );

      const artists: any[] = searchResult?.artist || searchResult?.data || [];
      const match = artists.find(
        (a: any) => a.name?.toLowerCase() === name.toLowerCase(),
      );

      if (match) {
        this.logger.log(`Found existing FUGA artist: ${name} (id: ${match.id})`);
        return match;
      }
    } catch (err) {
      this.logger.warn(`Artist search failed for "${name}", will create new: ${err.message}`);
    }

    // Create new artist
    this.logger.log(`Creating new FUGA artist: ${name}`);
    return this.request('POST', '/api/v2/artists', { name, primary });
  }

  async addArtistToProduct(
    productId: string,
    artistId: string,
    primary: boolean,
  ): Promise<any> {
    return this.request(
      'POST',
      `/api/v2/products/${productId}/artists`,
      { id: artistId, primary },
    );
  }

  async addArtistToAsset(
    assetId: string,
    artistId: string,
    primary: boolean,
  ): Promise<any> {
    return this.request(
      'POST',
      `/api/v2/assets/${assetId}/artists`,
      { id: artistId, primary },
    );
  }

  // ==================== DATA MAPPING ====================

  mapSubmissionToFugaProduct(submission: any): any {
    const release = submission.release || {};

    const product: any = {
      name: submission.albumTitle || submission.albumTitleEn,
      upc: release.upc,
      label: submission.labelName,
      consumer_release_date: release.consumerReleaseDate || null,
      original_release_date: release.originalReleaseDate || null,
      release_format_type: this.mapReleaseFormat(submission.albumType),
      parental_advisory: release.parentalAdvisory === 'EXPLICIT' || submission.explicitContent || false,
      language: release.recordingLanguage || null,
      catalog_number: release.catalogNumber || null,
      c_line_text: release.cRights || null,
      p_line_text: release.pRights || null,
      total_volumes: submission.totalVolumes || 1,
    };

    if (release.releaseTime) {
      product.consumer_release_time = release.releaseTime;
    }

    return product;
  }

  mapSubmissionTrackToFugaAsset(track: any, sequence: number): any {
    const asset: any = {
      name: track.titleEn || track.titleKo,
      sequence,
      isrc: track.isrc || null,
      language: track.language || null,
      parental_advisory: track.explicitContent || false,
      display_artist: track.displayArtist || null,
    };

    if (track.duration) {
      const seconds = this.parseDurationToSeconds(track.duration);
      if (seconds) asset.duration = seconds;
    }

    if (track.genre) asset.genre = { name: track.genre };
    if (track.subgenre) asset.subgenre = { name: track.subgenre };

    if (track.trackVersion) asset.version = track.trackVersion;
    if (track.iswc) asset.iswc = track.iswc;

    return asset;
  }

  // ==================== HELPERS ====================

  private mapReleaseFormat(albumType?: string): string {
    const map: Record<string, string> = {
      SINGLE: 'SINGLE',
      EP: 'EP',
      ALBUM: 'ALBUM',
      COMPILATION: 'COMPILATION',
    };
    return map[(albumType || '').toUpperCase()] || 'SINGLE';
  }

  private parseDurationToSeconds(duration: string): number | null {
    if (!duration) return null;
    // Handle "mm:ss" or "h:mm:ss"
    const parts = duration.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }

  private mimeFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return map[ext || ''] || 'image/jpeg';
  }
}
