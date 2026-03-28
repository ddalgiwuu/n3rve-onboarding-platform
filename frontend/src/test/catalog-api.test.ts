import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// vi.mock is hoisted to the top of the file by Vitest's transform, which means
// the factory function runs BEFORE any variable declarations in this module.
// Therefore, the factory must not reference variables defined in module scope —
// instead we create vi.fn() stubs inline and export them through the mock so
// that tests can assert on them after importing the module under test.
// ---------------------------------------------------------------------------
vi.mock('@/lib/api', () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPatch = vi.fn();
  const mockDelete = vi.fn();

  const mockApiInstance = {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  };

  return {
    default: mockApiInstance,
    api: mockApiInstance,
    __mockGet: mockGet,
    __mockPost: mockPost,
    __mockPatch: mockPatch,
    __mockDelete: mockDelete,
  };
});

// Import the mock module to pull out the spy references, then import the
// module under test. Both run after vi.mock has been registered.
import * as ApiMock from '@/lib/api';
import catalogApi from '@/lib/catalog-api';

// Convenience aliases
const mockGet = (ApiMock as any).__mockGet as ReturnType<typeof vi.fn>;
const mockPost = (ApiMock as any).__mockPost as ReturnType<typeof vi.fn>;
const mockPatch = (ApiMock as any).__mockPatch as ReturnType<typeof vi.fn>;
const mockDelete = (ApiMock as any).__mockDelete as ReturnType<typeof vi.fn>;

describe('catalogApi — function existence', () => {
  it('exports getProducts', () => expect(typeof catalogApi.getProducts).toBe('function'));
  it('exports getUnifiedProducts', () => expect(typeof catalogApi.getUnifiedProducts).toBe('function'));
  it('exports getUnifiedProduct', () => expect(typeof catalogApi.getUnifiedProduct).toBe('function'));
  it('exports getProduct', () => expect(typeof catalogApi.getProduct).toBe('function'));
  it('exports getArtists', () => expect(typeof catalogApi.getArtists).toBe('function'));
  it('exports getArtist', () => expect(typeof catalogApi.getArtist).toBe('function'));
  it('exports updateArtist', () => expect(typeof catalogApi.updateArtist).toBe('function'));
  it('exports deleteArtist', () => expect(typeof catalogApi.deleteArtist).toBe('function'));
  it('exports searchAssets', () => expect(typeof catalogApi.searchAssets).toBe('function'));
  it('exports getStats', () => expect(typeof catalogApi.getStats).toBe('function'));
  it('exports linkToSubmission', () => expect(typeof catalogApi.linkToSubmission).toBe('function'));
  it('exports getUnlinked', () => expect(typeof catalogApi.getUnlinked).toBe('function'));
  it('exports pushToFuga', () => expect(typeof catalogApi.pushToFuga).toBe('function'));
  it('exports pullFromFuga', () => expect(typeof catalogApi.pullFromFuga).toBe('function'));
});

describe('catalogApi — URL construction', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
    mockPatch.mockResolvedValue({ data: {} });
    mockDelete.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- Products ---
  it('getProducts calls GET /catalog/products', () => {
    catalogApi.getProducts();
    expect(mockGet).toHaveBeenCalledWith('/catalog/products', expect.objectContaining({ params: undefined }));
  });

  it('getProducts passes search, page, and limit as params', () => {
    catalogApi.getProducts({ search: 'test', page: 2, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith(
      '/catalog/products',
      { params: { search: 'test', page: 2, limit: 10 } }
    );
  });

  it('getProducts passes state and label params', () => {
    catalogApi.getProducts({ state: 'published', label: 'N3RVE' });
    expect(mockGet).toHaveBeenCalledWith(
      '/catalog/products',
      { params: { state: 'published', label: 'N3RVE' } }
    );
  });

  it('getProduct calls GET /catalog/products/:id', () => {
    catalogApi.getProduct('abc123');
    expect(mockGet).toHaveBeenCalledWith('/catalog/products/abc123');
  });

  // --- Unified ---
  it('getUnifiedProducts calls GET /catalog/unified', () => {
    catalogApi.getUnifiedProducts();
    expect(mockGet).toHaveBeenCalledWith('/catalog/unified', expect.objectContaining({ params: undefined }));
  });

  it('getUnifiedProducts passes source param', () => {
    catalogApi.getUnifiedProducts({ source: 'fuga', page: 1, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith(
      '/catalog/unified',
      { params: { source: 'fuga', page: 1, limit: 20 } }
    );
  });

  it('getUnifiedProduct calls GET /catalog/unified/:id with default type=catalog', () => {
    catalogApi.getUnifiedProduct('id1');
    expect(mockGet).toHaveBeenCalledWith('/catalog/unified/id1', { params: { type: 'catalog' } });
  });

  it('getUnifiedProduct passes type=submission when specified', () => {
    catalogApi.getUnifiedProduct('id1', 'submission');
    expect(mockGet).toHaveBeenCalledWith('/catalog/unified/id1', { params: { type: 'submission' } });
  });

  // --- Artists ---
  it('getArtists calls GET /catalog/artists', () => {
    catalogApi.getArtists();
    expect(mockGet).toHaveBeenCalledWith('/catalog/artists', expect.objectContaining({ params: undefined }));
  });

  it('getArtists passes search, page, limit params', () => {
    catalogApi.getArtists({ search: 'IU', page: 1, limit: 5 });
    expect(mockGet).toHaveBeenCalledWith(
      '/catalog/artists',
      { params: { search: 'IU', page: 1, limit: 5 } }
    );
  });

  it('getArtist calls GET /catalog/artists/:id', () => {
    catalogApi.getArtist('artist1');
    expect(mockGet).toHaveBeenCalledWith('/catalog/artists/artist1');
  });

  it('updateArtist calls PATCH /catalog/artists/:id with data', () => {
    catalogApi.updateArtist('artist1', { name: 'New Name' });
    expect(mockPatch).toHaveBeenCalledWith('/catalog/artists/artist1', { name: 'New Name' });
  });

  it('deleteArtist calls DELETE /catalog/artists/:id', () => {
    catalogApi.deleteArtist('artist1');
    expect(mockDelete).toHaveBeenCalledWith('/catalog/artists/artist1');
  });

  // --- Assets ---
  it('searchAssets calls GET /catalog/assets/search', () => {
    catalogApi.searchAssets();
    expect(mockGet).toHaveBeenCalledWith('/catalog/assets/search', expect.objectContaining({ params: undefined }));
  });

  it('searchAssets passes isrc param', () => {
    catalogApi.searchAssets({ isrc: 'USKRE2400001', page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith(
      '/catalog/assets/search',
      { params: { isrc: 'USKRE2400001', page: 1, limit: 10 } }
    );
  });

  it('searchAssets passes search param', () => {
    catalogApi.searchAssets({ search: 'my track' });
    expect(mockGet).toHaveBeenCalledWith(
      '/catalog/assets/search',
      { params: { search: 'my track' } }
    );
  });

  // --- Stats ---
  it('getStats calls GET /catalog/stats', () => {
    catalogApi.getStats();
    expect(mockGet).toHaveBeenCalledWith('/catalog/stats');
  });

  // --- Linking ---
  it('linkToSubmission calls POST /catalog/link/:productId with submissionId', () => {
    catalogApi.linkToSubmission('prod1', 'sub1');
    expect(mockPost).toHaveBeenCalledWith('/catalog/link/prod1', { submissionId: 'sub1' });
  });

  it('getUnlinked calls GET /catalog/unlinked', () => {
    catalogApi.getUnlinked();
    expect(mockGet).toHaveBeenCalledWith('/catalog/unlinked', expect.objectContaining({ params: undefined }));
  });

  it('getUnlinked passes page and limit params', () => {
    catalogApi.getUnlinked({ page: 2, limit: 25 });
    expect(mockGet).toHaveBeenCalledWith(
      '/catalog/unlinked',
      { params: { page: 2, limit: 25 } }
    );
  });

  // --- FUGA sync ---
  it('pushToFuga calls POST /catalog/submissions/:id/push-to-fuga', () => {
    catalogApi.pushToFuga('sub123');
    expect(mockPost).toHaveBeenCalledWith('/catalog/submissions/sub123/push-to-fuga');
  });

  it('pullFromFuga calls POST /catalog/sync/pull-from-fuga', () => {
    catalogApi.pullFromFuga();
    expect(mockPost).toHaveBeenCalledWith('/catalog/sync/pull-from-fuga');
  });
});
