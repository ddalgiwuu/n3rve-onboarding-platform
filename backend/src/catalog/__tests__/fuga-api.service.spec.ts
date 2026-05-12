/**
 * Unit tests for FugaApiService. Covers the parts touched by the 2026-05
 * sub-org + cover-art fix:
 *   - getProducts() must send include_suborg=true so TV Asahi / other
 *     sub-org products are not silently dropped by the FUGA list endpoint.
 *   - downloadProductCoverArt() must reject non-image content-types and tiny
 *     payloads (FUGA returns an HTML login page when unauthenticated).
 *   - downloadAssetAudio() must reject non-audio content-types.
 *
 * `node-fetch` is mocked at the module boundary so we can assert URL +
 * headers + return shape without hitting the real FUGA API.
 */
import { ConfigService } from '@nestjs/config';
import { FugaApiService } from '../fuga-api.service';

// Mock node-fetch so the service makes no real HTTP calls. node-fetch v2 is
// CommonJS so the default export must be the mock fn itself, not an object.
// jest.mock factory runs before the file body, so we expose the mock via a
// late-bound require() in the test setup rather than capturing a const here.
jest.mock('node-fetch', () => {
  const fn: any = jest.fn();
  // Mark it as the default export (ts-jest/CommonJS interop).
  fn.default = fn;
  return fn;
});
const mockFetch: jest.Mock = require('node-fetch');

// Minimal Prisma stub — these tests don't exercise DB paths.
const prismaStub: any = {
  fugaSession: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
};

function makeService(envOverrides: Record<string, string> = {}): FugaApiService {
  const env: Record<string, string> = {
    FUGA_SESSION_COOKIE: 'connect.sid=test-cookie',
    ...envOverrides,
  };
  const configStub = {
    get: (key: string) => env[key],
  } as ConfigService;
  return new FugaApiService(configStub, prismaStub);
}

function jsonResponse(body: any, init: { status?: number; headers?: Record<string, string> } = {}) {
  return {
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    headers: {
      get: (k: string) => (init.headers || { 'content-type': 'application/json' })[k.toLowerCase()],
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
    arrayBuffer: async () => Buffer.from(JSON.stringify(body)).buffer,
  };
}

function binaryResponse(buf: Buffer, contentType: string, status = 200) {
  return {
    ok: status < 400,
    status,
    headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? contentType : null) },
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    text: async () => buf.toString('utf8'),
  };
}

describe('FugaApiService.getProducts', () => {
  beforeEach(() => mockFetch.mockReset());

  it('always sends include_suborg=true so sub-org products (TV Asahi etc.) are not dropped', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ product: [] }));
    const svc = makeService();

    await svc.getProducts({ page: 0, limit: 50 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('include_suborg=true');
    expect(url).toContain('page=0');
    expect(url).toContain('page_size=50');
  });

  it('forwards modified_since when supplied', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ product: [] }));
    const svc = makeService();

    await svc.getProducts({ page: 2, limit: 25, modified_since: '2026-05-01' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('include_suborg=true');
    expect(url).toContain('modified_since=2026-05-01');
  });
});

describe('FugaApiService.downloadProductCoverArt', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns null when FUGA returns an HTML login page instead of an image', async () => {
    mockFetch.mockResolvedValueOnce(binaryResponse(Buffer.from('<html>login</html>'), 'text/html'));
    const svc = makeService();

    const result = await svc.downloadProductCoverArt('1008916652726');

    expect(result).toBeNull();
  });

  it('returns null when image payload is smaller than the placeholder guard (10KB)', async () => {
    mockFetch.mockResolvedValueOnce(binaryResponse(Buffer.alloc(5_000, 0xff), 'image/jpeg'));
    const svc = makeService();

    expect(await svc.downloadProductCoverArt('123')).toBeNull();
  });

  it('returns buffer + content-type for a valid image response', async () => {
    const buf = Buffer.alloc(50_000, 0xa0);
    mockFetch.mockResolvedValueOnce(binaryResponse(buf, 'image/png'));
    const svc = makeService();

    const result = await svc.downloadProductCoverArt('123');

    expect(result).not.toBeNull();
    expect(result!.contentType).toBe('image/png');
    expect(result!.buffer.length).toBe(50_000);
  });

  it('returns null on HTTP error (e.g. 404 — product has no cover)', async () => {
    mockFetch.mockResolvedValueOnce(binaryResponse(Buffer.from(''), 'text/plain', 404));
    const svc = makeService();

    expect(await svc.downloadProductCoverArt('123')).toBeNull();
  });

  it('throws (NOT null) on 401/403 so caller can distinguish auth failure from "no cover"', async () => {
    mockFetch.mockResolvedValueOnce(binaryResponse(Buffer.from(''), 'text/html', 401));
    const svc = makeService();

    await expect(svc.downloadProductCoverArt('123')).rejects.toThrow(/auth rejected/);
  });
});

describe('FugaApiService.downloadAssetAudio', () => {
  beforeEach(() => mockFetch.mockReset());

  it('rejects HTML responses (typically an unauthenticated redirect)', async () => {
    mockFetch.mockResolvedValueOnce(binaryResponse(Buffer.from('<html>login</html>'), 'text/html'));
    const svc = makeService();

    expect(await svc.downloadAssetAudio('456')).toBeNull();
  });

  it('rejects JSON error envelopes', async () => {
    mockFetch.mockResolvedValueOnce(binaryResponse(Buffer.from('{"error":"x"}'), 'application/json'));
    const svc = makeService();

    expect(await svc.downloadAssetAudio('456')).toBeNull();
  });

  it('accepts audio/* content-types', async () => {
    const buf = Buffer.alloc(2_000_000, 0x55);
    mockFetch.mockResolvedValueOnce(binaryResponse(buf, 'audio/wav'));
    const svc = makeService();

    const result = await svc.downloadAssetAudio('456');

    expect(result).not.toBeNull();
    expect(result!.buffer.length).toBe(2_000_000);
    expect(result!.contentType).toBe('audio/wav');
  });

  it('accepts application/octet-stream (FUGA sometimes uses this for raw audio)', async () => {
    const buf = Buffer.alloc(1_000, 0x10);
    mockFetch.mockResolvedValueOnce(binaryResponse(buf, 'application/octet-stream'));
    const svc = makeService();

    const result = await svc.downloadAssetAudio('456');

    expect(result).not.toBeNull();
    expect(result!.contentType).toBe('application/octet-stream');
  });

  it('returns null on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce(binaryResponse(Buffer.from(''), 'text/plain', 500));
    const svc = makeService();

    expect(await svc.downloadAssetAudio('456')).toBeNull();
  });

  it('throws on 401/403 so caller can distinguish auth failure from "no audio"', async () => {
    mockFetch.mockResolvedValueOnce(binaryResponse(Buffer.from(''), 'text/html', 401));
    const svc = makeService();

    await expect(svc.downloadAssetAudio('456')).rejects.toThrow(/auth rejected/);
  });
});

/**
 * 401-retry branching is the core of #11 (DB cookie stale vs env cookie stale
 * vs OAuth token expired). We exercise it via the public `getProducts()` path
 * so the private request<T>() retry logic runs end-to-end.
 */
describe('FugaApiService request 401 retry branching', () => {
  beforeEach(() => mockFetch.mockReset());

  it('DB-cookie 401 invalidates the cache AND retries once', async () => {
    prismaStub.fugaSession.findUnique
      .mockResolvedValueOnce({ cookie: 'connect.sid=db-cookie-stale' })  // first read for buildAuthHeaders
      .mockResolvedValueOnce({ cookie: 'connect.sid=db-cookie-fresh' }); // second read after cache invalidation

    // First fetch returns 401, second succeeds.
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ product: [{ id: 1 }] }));

    const svc = makeService();
    const result = await svc.getProducts({ page: 0, limit: 10 });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Second call used the fresh DB cookie, not the stale env cookie.
    const secondHeaders = (mockFetch.mock.calls[1][1] as any).headers as Record<string, string>;
    expect(secondHeaders.Cookie).toBe('connect.sid=db-cookie-fresh');
    expect(result).toEqual({ product: [{ id: 1 }] });
  });

  it('env-cookie 401 does NOT retry (env cookie only refreshes on redeploy)', async () => {
    prismaStub.fugaSession.findUnique.mockResolvedValue(null); // no DB cookie → falls back to env
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, { status: 401 }));

    const svc = makeService({ FUGA_SESSION_COOKIE: 'connect.sid=env-stale' });

    await expect(svc.getProducts({ page: 0, limit: 10 })).rejects.toThrow(/FUGA API error 401/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT recurse infinitely on repeated 401s (retryOnUnauth gate)', async () => {
    prismaStub.fugaSession.findUnique
      .mockResolvedValueOnce({ cookie: 'connect.sid=db-cookie-stale' })
      .mockResolvedValueOnce({ cookie: 'connect.sid=still-stale' });

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, { status: 401 })); // second 401 must NOT trigger a third call

    const svc = makeService();

    await expect(svc.getProducts({ page: 0, limit: 10 })).rejects.toThrow(/FUGA API error 401/);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
