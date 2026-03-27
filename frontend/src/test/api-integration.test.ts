import { describe, it, expect } from 'vitest';

const API_BASE = process.env.VITE_API_URL || 'https://n3rve-backend.fly.dev';

// ─── E2E: API Health Check ──────────────────────────────

describe('API Health', () => {
  it('backend is reachable', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    expect(res.status).toBe(200);
  });
});

// ─── E2E: Catalog API ───────────────────────────────────

describe('Catalog API (requires auth - skip in CI)', () => {
  it.skip('returns unified products list', async () => {
    const res = await fetch(`${API_BASE}/api/catalog/unified?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${process.env.TEST_JWT}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it.skip('returns artists list', async () => {
    const res = await fetch(`${API_BASE}/api/catalog/artists?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${process.env.TEST_JWT}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('data');
  });
});

// ─── E2E: Dropbox URL Pattern Validation ────────────────

describe('Dropbox URL patterns', () => {
  const sampleUrls = [
    'https://www.dropbox.com/scl/fi/abc123/cover.png?rlkey=xyz&dl=0',
    'https://www.dropbox.com/scl/fi/abc123/cover.png?rlkey=xyz&raw=1',
    'https://dl.dropboxusercontent.com/abc/file',
  ];

  it('all URLs are valid HTTPS', () => {
    sampleUrls.forEach(url => {
      expect(url).toMatch(/^https:\/\//);
    });
  });

  it('shared links contain rlkey parameter', () => {
    const sharedLinks = sampleUrls.filter(u => u.includes('dropbox.com/scl'));
    sharedLinks.forEach(url => {
      expect(url).toContain('rlkey=');
    });
  });
});
