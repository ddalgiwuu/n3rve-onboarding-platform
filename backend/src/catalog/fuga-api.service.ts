import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { TOTP } from 'totp-generator';
import { PrismaService } from '../prisma/prisma.service';

const FUGA_SESSION_KEY = 'current';

@Injectable()
export class FugaApiService {
  private readonly logger = new Logger(FugaApiService.name);
  private readonly baseUrl = 'https://login.n3rvemusic.com';

  // OAuth state — primary auth path (FUGA migrated away from session-cookie login in 2026-04)
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0; // epoch ms

  // Legacy session-cookie fallback (kept for code paths that still rely on it; new code should use OAuth)
  private sessionCookie: string | null = null;
  private requires2FA = false;

  // Cached DB session cookie (refreshed at most every 30s to avoid hammering DB on every request)
  private cachedDbCookie: string | null = null;
  private cachedDbCookieAt = 0;
  private static readonly DB_COOKIE_CACHE_MS = 30_000;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ==================== OAUTH (primary) ====================

  /**
   * Acquire an OAuth 2.0 access token.
   *
   * Strategy: tries grants in order until one succeeds, then sticks with that grant for
   * future refreshes (cached in `preferredGrant`). This handles FUGA tenants that expose
   * either `client_credentials` (service-account) OR `password` (resource-owner) but not both,
   * without requiring the operator to know which one their org has enabled in advance.
   *
   *   1. client_credentials  — when FUGA_CLIENT_ID + FUGA_CLIENT_SECRET are set
   *   2. password            — when FUGA_USERNAME + FUGA_PASSWORD are set
   *                            (TOTP auto-generated from FUGA_TOTP_SECRET when 2FA required)
   *
   * Reused for ~95% of token lifetime; refreshed automatically on expiry or 401.
   */
  private preferredGrant: 'client_credentials' | 'password' | null = null;

  private async ensureAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt - 30_000) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('FUGA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('FUGA_CLIENT_SECRET');
    const username = this.configService.get<string>('FUGA_USERNAME');
    const password = this.configService.get<string>('FUGA_PASSWORD');
    const scope = this.configService.get<string>('FUGA_OAUTH_SCOPE') || 'read write';

    const grantOrder: Array<'client_credentials' | 'password'> = this.preferredGrant
      ? [this.preferredGrant]
      : (['client_credentials', 'password'] as const).filter((g) =>
          g === 'client_credentials' ? clientId && clientSecret : username && password,
        );

    if (grantOrder.length === 0) {
      throw new Error(
        'FUGA OAuth credentials missing — set either (FUGA_CLIENT_ID + FUGA_CLIENT_SECRET) or (FUGA_USERNAME + FUGA_PASSWORD)',
      );
    }

    const errors: string[] = [];
    for (const grant of grantOrder) {
      try {
        const token = await this.requestOAuthToken(grant, scope);
        this.preferredGrant = grant; // remember the working grant for next time
        return token;
      } catch (err) {
        errors.push(`${grant}: ${err.message}`);
        // If we're locked into a preferredGrant, don't try alternatives — surface the error.
        if (this.preferredGrant) throw err;
      }
    }

    throw new Error(`All FUGA OAuth grants failed — ${errors.join(' | ')}`);
  }

  private async requestOAuthToken(
    grant: 'client_credentials' | 'password',
    scope: string,
  ): Promise<string> {
    const body = new URLSearchParams();
    body.set('grant_type', grant);
    if (scope) body.set('scope', scope);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    };

    if (grant === 'client_credentials') {
      const id = this.configService.get<string>('FUGA_CLIENT_ID')!;
      const secret = this.configService.get<string>('FUGA_CLIENT_SECRET')!;
      headers.Authorization = `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
    } else {
      // password (resource-owner) grant — uses the master FUGA user account.
      const username = this.configService.get<string>('FUGA_USERNAME')!;
      const password = this.configService.get<string>('FUGA_PASSWORD')!;
      const totpSecret = this.configService.get<string>('FUGA_TOTP_SECRET');
      const passwordClientId = this.configService.get<string>('FUGA_CLIENT_ID');
      const passwordClientSecret = this.configService.get<string>('FUGA_CLIENT_SECRET');

      body.set('username', username);
      body.set('password', password);

      // 2FA — auto-generate TOTP if a secret is configured.
      if (totpSecret) {
        const { otp } = await TOTP.generate(totpSecret);
        body.set('totp', otp);
        // Some servers expect the field under different names; provide common aliases.
        body.set('otp', otp);
        body.set('mfa_code', otp);
        this.logger.log('FUGA OAuth password grant: TOTP auto-generated');
      }

      // Optional Basic auth in addition to body params (some FUGA deployments require it
      // even for the password grant — harmless when the server ignores it).
      if (passwordClientId && passwordClientSecret) {
        headers.Authorization = `Basic ${Buffer.from(
          `${passwordClientId}:${passwordClientSecret}`,
        ).toString('base64')}`;
      } else {
        // Public client convention used by SPA frontends — server lets it pass.
        body.set('client_id', 'fuga-portal');
      }
    }

    const res = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `/oauth/token ${grant} grant failed (${res.status}): ${text.slice(0, 500)}`,
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      token_type?: string;
      expires_in?: number;
      scope?: string;
    };

    if (!data.access_token) {
      throw new Error(`${grant} grant returned no access_token: ${JSON.stringify(data)}`);
    }

    this.accessToken = data.access_token;
    const ttlSec =
      typeof data.expires_in === 'number' && data.expires_in > 0 ? data.expires_in : 3600;
    this.accessTokenExpiresAt = Date.now() + ttlSec * 1000;
    this.logger.log(
      `FUGA OAuth token acquired (grant=${grant}, expires_in=${ttlSec}s, scope=${data.scope || scope})`,
    );
    return this.accessToken;
  }

  // ==================== AUTH (legacy session-cookie fallback) ====================
  // Kept for backward compatibility; FUGA's POST /login endpoint returns 404 since 2026-04.
  // Do not call this for new code paths — use ensureAccessToken() instead.

  async login(otpCode?: string): Promise<void> {
    const username = this.configService.get<string>('FUGA_USERNAME');
    const password = this.configService.get<string>('FUGA_PASSWORD');
    const totpSecret = this.configService.get<string>('FUGA_TOTP_SECRET');

    try {
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

      const loginData = (await res.json().catch(() => ({}))) as any;
      if (loginData?.user?.is_two_factor_authentication_enabled) {
        let code = otpCode;
        if (!code && totpSecret) {
          const { otp } = await TOTP.generate(totpSecret);
          code = otp;
          this.logger.log('FUGA 2FA: auto-generated TOTP code');
        }

        if (code) {
          await this.verify2FA(code);
        } else {
          this.requires2FA = true;
          this.logger.warn('FUGA 2FA required but no TOTP secret or OTP code provided');
          return;
        }
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

  // ==================== REQUEST ====================

  /**
   * Build the auth header(s) for an outbound API request.
   *
   * Strategy (first available wins):
   *   1. FugaSession DB row — pushed by NanoClaw after every portal login.
   *      Highest priority because it's always the freshest credential and
   *      doesn't require redeploying secrets when the portal session rotates.
   *      Cached in-memory for 30s to avoid a Mongo read on every API call.
   *   2. FUGA_SESSION_COOKIE env — operator-provided portal session cookie
   *      (manual extraction fallback). Used when DB has nothing.
   *   3. OAuth Bearer token — when client_credentials/password grants are
   *      configured (long-term solution; not currently usable on n3rve's
   *      tenant because OAuth client credentials haven't been provisioned).
   */
  private async buildAuthHeaders(): Promise<Record<string, string>> {
    const { headers } = await this.buildAuthHeadersWithSource();
    return headers;
  }

  /**
   * Variant of buildAuthHeaders that also reports which credential source
   * produced the headers. Used by the 401-retry branch to make accurate
   * decisions about whether a stale DB cookie / stale env cookie / expired
   * OAuth token is to blame.
   */
  private async buildAuthHeadersWithSource(): Promise<{
    headers: Record<string, string>;
    source: 'db-cookie' | 'env-cookie' | 'oauth';
  }> {
    // 1. DB cookie (NanoClaw-managed) — preferred
    const dbCookie = await this.getDbSessionCookie();
    if (dbCookie) {
      const cookieHeader = dbCookie.includes('=')
        ? dbCookie
        : `connect.sid=${dbCookie}`;
      return { headers: { Cookie: cookieHeader }, source: 'db-cookie' };
    }

    // 2. Env var fallback
    const sessionCookie = this.configService.get<string>('FUGA_SESSION_COOKIE');
    if (sessionCookie) {
      const cookieHeader = sessionCookie.includes('=')
        ? sessionCookie
        : `connect.sid=${sessionCookie}`;
      return { headers: { Cookie: cookieHeader }, source: 'env-cookie' };
    }

    // 3. OAuth Bearer
    const token = await this.ensureAccessToken();
    return { headers: { Authorization: `Bearer ${token}` }, source: 'oauth' };
  }

  /**
   * Read the latest cookie from the FugaSession Mongo row, with a 30s in-memory
   * cache so the hot request path doesn't hit the DB on every call.
   * Cache is invalidated immediately when setSessionCookie() writes a new value.
   */
  private async getDbSessionCookie(): Promise<string | null> {
    const now = Date.now();
    if (this.cachedDbCookie !== null && now - this.cachedDbCookieAt < FugaApiService.DB_COOKIE_CACHE_MS) {
      return this.cachedDbCookie || null;
    }
    try {
      const row = await this.prisma.fugaSession.findUnique({
        where: { key: FUGA_SESSION_KEY },
        select: { cookie: true },
      });
      this.cachedDbCookie = row?.cookie ?? '';
      this.cachedDbCookieAt = now;
      return row?.cookie ?? null;
    } catch (err) {
      this.logger.warn(`Failed to read FugaSession from DB: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Persist a new FUGA portal session cookie pushed by NanoClaw (or operator).
   * Returns the saved row metadata so the caller can decide whether to
   * trigger a sync (e.g. via debounce).
   */
  async setSessionCookie(cookie: string, source = 'nanoclaw'): Promise<{ updatedAt: Date; lastSyncAt: Date | null }> {
    const trimmed = cookie.trim();
    if (!trimmed) {
      throw new Error('Empty cookie value');
    }
    const row = await this.prisma.fugaSession.upsert({
      where: { key: FUGA_SESSION_KEY },
      create: { key: FUGA_SESSION_KEY, cookie: trimmed, source },
      update: { cookie: trimmed, source },
    });
    // Invalidate the in-memory cache so the very next request picks up the new value.
    this.cachedDbCookie = trimmed;
    this.cachedDbCookieAt = Date.now();
    this.logger.log(`FugaSession updated by ${source} (length=${trimmed.length})`);
    return { updatedAt: row.updatedAt, lastSyncAt: row.lastSyncAt };
  }

  /**
   * Mark the current FugaSession as having driven a successful sync.
   * Used by the debounce logic in the cookie-ingest controller.
   */
  async recordSessionSyncedAt(when: Date = new Date()): Promise<void> {
    await this.prisma.fugaSession.updateMany({
      where: { key: FUGA_SESSION_KEY },
      data: { lastSyncAt: when },
    });
  }

  /**
   * Read-only accessor for last-sync timestamp (for debounce check).
   */
  async getLastSyncAt(): Promise<Date | null> {
    const row = await this.prisma.fugaSession.findUnique({
      where: { key: FUGA_SESSION_KEY },
      select: { lastSyncAt: true },
    });
    return row?.lastSyncAt ?? null;
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
    retryOnUnauth = true,
  ): Promise<T> {
    const { headers: authHeaders, source: authSource } = await this.buildAuthHeadersWithSource();

    const headers: Record<string, string> = {
      ...authHeaders,
      Accept: 'application/json',
    };

    let fetchBody: any;
    if (body !== undefined && body !== null) {
      // FormData detection: node-fetch stamps it with a getBoundary() method.
      // Avoid `instanceof FormData` because the imported class may be a different
      // instance than the one that constructed the object (e.g. when called from
      // a script that loaded form-data via a different module path).
      const isFormData =
        typeof body === 'object' && typeof (body as any).getBoundary === 'function';
      if (isFormData) {
        fetchBody = body;
      } else {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
      }
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: fetchBody,
    });

    // If session/token rejected, branch on which credential source we used:
    //   - DB cookie  : NanoClaw push is stale. Invalidate the 30s memory cache
    //                  so the next request re-reads the DB row (in case NanoClaw
    //                  pushed a fresh cookie in the last 30s). Do not retry —
    //                  retrying with the same cached value will fail the same way.
    //   - env cookie : operator-provided cookie is stale. Log and surface.
    //   - oauth      : token expired or invalidated. Refresh + retry once.
    if (res.status === 401 && retryOnUnauth) {
      if (authSource === 'db-cookie') {
        this.logger.error(
          `FUGA returned 401 with DB session cookie — NanoClaw-pushed cookie is stale. ` +
            `Invalidating 30s memory cache; next call will re-read the FugaSession row.`,
        );
        this.cachedDbCookie = null;
        this.cachedDbCookieAt = 0;
        // Single retry: if NanoClaw just pushed a fresh cookie, the next read picks it up.
        return this.request<T>(method, path, body, false);
      } else if (authSource === 'env-cookie') {
        this.logger.error(
          'FUGA returned 401 with FUGA_SESSION_COOKIE env — cookie is expired or invalid. ' +
            'Re-extract `connect.sid` from a logged-in browser session and update the secret.',
        );
        // No retry — env cookie can only be refreshed by a redeploy.
      } else {
        this.logger.warn('FUGA returned 401 — refreshing OAuth token and retrying once');
        this.accessToken = null;
        this.accessTokenExpiresAt = 0;
        return this.request<T>(method, path, body, false);
      }
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
      // Without this flag FUGA only returns products owned directly by the
      // primary org. Sub-org products (e.g. TV Asahi under n3rve) are hidden
      // from the default list response, which previously caused albums like
      // Ghost (fugaId 1008916652726) to be silently missing from sync.
      include_suborg: 'true',
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

  /**
   * Artist profile detail. Returns name/photo/labels/genres/subgenres/
   * proprietary_id/organization plus biography/booking_agent/
   * country_of_origin/isni_code/ipn (often null — depends on whether the
   * label filled the FUGA artist profile). Used to enrich CatalogArtist
   * beyond the bare {id,name,primary} the product payload carries.
   */
  async getArtist(artistId: string): Promise<any> {
    return this.request('GET', `/api/v2/artists/${artistId}`);
  }

  /**
   * Contributor "person" detail. NOTE: contributors are a separate FUGA
   * entity from artists — /api/v2/artists/{personId} returns 404 for a
   * contributor person id, /api/v2/people/{personId} is the correct path.
   * Returns id/name/isni_code/ipn/ipi/organization.
   */
  async getPerson(personId: string): Promise<any> {
    return this.request('GET', `/api/v2/people/${personId}`);
  }

  /**
   * Download a product's full-size cover image as a Buffer.
   * Returns null if the product has no uploaded cover or the endpoint returns
   * a non-image response. Uses the same auth source as the JSON API (DB
   * cookie pushed by NanoClaw → env fallback → OAuth bearer).
   */
  async downloadProductCoverArt(fugaProductId: string | number): Promise<{
    buffer: Buffer;
    contentType: string;
  } | null> {
    const authHeaders = await this.buildAuthHeaders();
    const res = await fetch(
      `${this.baseUrl}/ui-only/v2/products/${fugaProductId}/image/full`,
      { headers: { ...authHeaders, Accept: 'image/*' } },
    );
    if (res.status === 401 || res.status === 403) {
      // Auth failure — distinct from "this product has no cover". Surface
      // upward so the caller can decide whether to abort the whole sync
      // instead of silently dropping cover art for every product.
      throw new Error(`FUGA auth rejected for cover-art of ${fugaProductId} (HTTP ${res.status})`);
    }
    if (!res.ok) {
      this.logger.warn(`FUGA cover-art fetch failed for ${fugaProductId}: HTTP ${res.status}`);
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      // Some FUGA tenants return an HTML error page when no image is uploaded.
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 10_000) {
      // Sanity guard — placeholder images are tiny.
      return null;
    }
    return { buffer, contentType };
  }

  /**
   * Download a track's audio file. Same auth path as cover art.
   * Returns null if the asset has no uploaded audio, fetch fails, or the
   * response is not an audio payload (e.g. HTML login redirect, JSON error).
   */
  async downloadAssetAudio(fugaAssetId: string | number): Promise<{
    buffer: Buffer;
    contentType: string;
  } | null> {
    const authHeaders = await this.buildAuthHeaders();
    const res = await fetch(
      `${this.baseUrl}/ui-only/v2/assets/${fugaAssetId}/audio`,
      { headers: { ...authHeaders, Accept: 'audio/*,application/octet-stream' } },
    );
    if (res.status === 401 || res.status === 403) {
      throw new Error(`FUGA auth rejected for audio of asset ${fugaAssetId} (HTTP ${res.status})`);
    }
    if (!res.ok) {
      this.logger.warn(`FUGA audio fetch failed for asset ${fugaAssetId}: HTTP ${res.status}`);
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    // FUGA may return text/html for an unauthenticated redirect or
    // application/json for an error envelope; only accept binary audio.
    const isAudio =
      contentType.startsWith('audio/') ||
      contentType === 'application/octet-stream' ||
      contentType.startsWith('application/x-');
    if (!isAudio) {
      this.logger.warn(
        `FUGA audio fetch for asset ${fugaAssetId} returned non-audio content-type "${contentType}"`,
      );
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType };
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
