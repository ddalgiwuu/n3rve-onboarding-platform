/**
 * Unit tests for the cover-art / audio sync path of CatalogService.
 *
 * Scope is intentionally narrow:
 *   - syncProductToDropbox: cover and audio are independent (cover already
 *     persisted must NOT skip audio sync — was a real BUG before this fix).
 *   - syncProductToDropbox: uses dropbox.uploadFile()'s returned url, never
 *     constructs a Dropbox path itself (the previous code passed a fake path
 *     to getOrCreateSharedLink and shared-link creation always failed).
 *   - persistCoverArtUrl: always writes to CatalogProduct.coverArtUrl;
 *     writes to submission.files.coverImageUrl only when it is empty.
 */
import { CatalogService } from '../catalog.service';

describe('CatalogService.syncProductToDropbox', () => {
  function makeStubs() {
    const prisma: any = {
      catalogProduct: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      $runCommandRaw: jest.fn().mockResolvedValue({ ok: 1, nModified: 1 }),
    };
    const fugaApi: any = {
      downloadProductCoverArt: jest.fn(),
      downloadAssetAudio: jest.fn(),
    };
    const dropbox: any = {
      uploadFile: jest.fn(),
    };
    const svc = new CatalogService(prisma, fugaApi, dropbox);
    return { svc, prisma, fugaApi, dropbox };
  }

  function callSync(svc: CatalogService, fugaProduct: any, fugaId: string | number) {
    return (svc as any).syncProductToDropbox(fugaProduct, fugaId);
  }

  it('syncs audio even when cover art is already persisted in the DB', async () => {
    const { svc, prisma, fugaApi, dropbox } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({
      coverArtUrl: 'https://www.dropbox.com/existing/cover.jpg',
    });
    fugaApi.downloadAssetAudio.mockResolvedValue({
      buffer: Buffer.alloc(10_000),
      contentType: 'audio/wav',
    });

    await callSync(
      svc,
      {
        name: 'Ghost',
        upc: '4580887633042',
        cover_image: { has_uploaded: true },
        assets: [
          { id: 'a1', name: 't1', audio: { has_uploaded: true, original_filename: 't1.wav' } },
        ],
      },
      '1008916652726',
    );

    // Cover skipped (already persisted)
    expect(fugaApi.downloadProductCoverArt).not.toHaveBeenCalled();
    // Audio still ran
    expect(fugaApi.downloadAssetAudio).toHaveBeenCalledWith('a1');
    expect(dropbox.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      't1.wav',
      '',
      '',
      'Ghost',
      'audio',
    );
  });

  it('uses dropbox.uploadFile returned url to persist coverArtUrl (does not construct Dropbox path itself)', async () => {
    const { svc, prisma, fugaApi, dropbox } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ coverArtUrl: null });
    fugaApi.downloadProductCoverArt.mockResolvedValue({
      buffer: Buffer.alloc(50_000, 0x89), // looks PNG-ish (first byte 0x89)
      contentType: 'image/png',
    });
    dropbox.uploadFile.mockResolvedValue({
      path: '/n3rve-submissions/2026-05/foo_Ghost_4580887633042/cover/cover.png',
      url: 'https://www.dropbox.com/s/realshared/cover.png?dl=0',
    });

    // Second findUnique call inside persistCoverArtUrl
    prisma.catalogProduct.findUnique
      .mockResolvedValueOnce({ coverArtUrl: null })            // pre-flight check
      .mockResolvedValueOnce({ id: 'cp1', submissionId: null }); // persistCoverArtUrl

    await callSync(
      svc,
      { name: 'Ghost', upc: '4580887633042', cover_image: { has_uploaded: true }, assets: [] },
      '1008916652726',
    );

    expect(dropbox.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      'cover.png',
      '',
      '',
      'Ghost',
      'cover',
    );
    expect(prisma.catalogProduct.update).toHaveBeenCalledWith({
      where: { fugaId: BigInt('1008916652726') },
      data: { coverArtUrl: 'https://www.dropbox.com/s/realshared/cover.png?dl=0' },
    });
  });

  it('skips cover download when fugaProduct.cover_image.has_uploaded is false', async () => {
    const { svc, prisma, fugaApi } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ coverArtUrl: null });

    await callSync(
      svc,
      { name: 'NoCover', upc: '0', cover_image: { has_uploaded: false }, assets: [] },
      '999',
    );

    expect(fugaApi.downloadProductCoverArt).not.toHaveBeenCalled();
  });

  it('does not block audio sync when cover download returns null', async () => {
    const { svc, prisma, fugaApi, dropbox } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ coverArtUrl: null });
    fugaApi.downloadProductCoverArt.mockResolvedValue(null); // e.g. HTML login page
    fugaApi.downloadAssetAudio.mockResolvedValue({
      buffer: Buffer.alloc(10_000),
      contentType: 'audio/wav',
    });

    await callSync(
      svc,
      {
        name: 'AudioOnly',
        upc: '1',
        cover_image: { has_uploaded: true },
        assets: [{ id: 'a1', name: 't1', audio: { has_uploaded: true } }],
      },
      '1',
    );

    expect(fugaApi.downloadAssetAudio).toHaveBeenCalled();
    expect(dropbox.uploadFile).toHaveBeenCalledTimes(1);
    expect(dropbox.uploadFile.mock.calls[0][5]).toBe('audio');
  });

  it('rejects audio buffers outside [1KB, 150MB]', async () => {
    const { svc, prisma, fugaApi, dropbox } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ coverArtUrl: 'x' });
    fugaApi.downloadAssetAudio.mockResolvedValue({
      buffer: Buffer.alloc(500), // < 1000 bytes
      contentType: 'audio/wav',
    });

    await callSync(
      svc,
      {
        name: 'TinyAudio',
        upc: '1',
        cover_image: { has_uploaded: false },
        assets: [{ id: 'a1', name: 't1', audio: { has_uploaded: true } }],
      },
      '1',
    );

    expect(dropbox.uploadFile).not.toHaveBeenCalled();
  });

  it('sanitizes product name before passing to Dropbox (no path traversal, no control chars)', async () => {
    const { svc, prisma, fugaApi, dropbox } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ coverArtUrl: null });
    fugaApi.downloadProductCoverArt.mockResolvedValue({
      buffer: Buffer.alloc(50_000, 0x89),
      contentType: 'image/png',
    });
    dropbox.uploadFile.mockResolvedValue({ path: '/x', url: 'https://x' });
    prisma.catalogProduct.findUnique
      .mockResolvedValueOnce({ coverArtUrl: null })
      .mockResolvedValueOnce({ id: 'cp1', submissionId: null });

    await callSync(
      svc,
      {
        // Embed a path separator + control char + leading dot.
        name: '../evil\x00name.\x1F  ',
        upc: '1',
        cover_image: { has_uploaded: true },
        assets: [],
      },
      '1',
    );

    const albumArg = dropbox.uploadFile.mock.calls[0][4]; // 5th positional arg
    expect(albumArg).not.toContain('/');
    expect(albumArg).not.toContain('\\');
    expect(albumArg).not.toMatch(/[\x00-\x1F\x7F]/);
    expect(albumArg.startsWith('.')).toBe(false);
    expect(albumArg.endsWith('.')).toBe(false);
    expect(albumArg.endsWith(' ')).toBe(false);
    expect(albumArg.length).toBeGreaterThan(0);
  });

  it('sanitizes audio filenames before passing to Dropbox', async () => {
    const { svc, prisma, fugaApi, dropbox } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ coverArtUrl: 'x' });
    fugaApi.downloadAssetAudio.mockResolvedValue({
      buffer: Buffer.alloc(2_000),
      contentType: 'audio/wav',
    });
    dropbox.uploadFile.mockResolvedValue({ path: '/x', url: 'https://x' });

    await callSync(
      svc,
      {
        name: 'AlbumA',
        upc: '1',
        cover_image: { has_uploaded: false },
        assets: [
          {
            id: 'a1',
            name: 't1',
            audio: {
              has_uploaded: true,
              original_filename: '/../leaked/secret#1@.wav',
            },
          },
        ],
      },
      '1',
    );

    const fileNameArg = dropbox.uploadFile.mock.calls[0][1]; // 2nd positional arg
    expect(fileNameArg).not.toContain('/');
    expect(fileNameArg).not.toContain('\\');
    expect(fileNameArg).not.toContain('#');
    expect(fileNameArg).not.toContain('@');
    expect(fileNameArg.length).toBeLessThanOrEqual(120);
  });

  it('falls back to a default name when the product name is entirely unsafe', async () => {
    const { svc, prisma, fugaApi, dropbox } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ coverArtUrl: null });
    fugaApi.downloadProductCoverArt.mockResolvedValue({
      buffer: Buffer.alloc(50_000, 0x89),
      contentType: 'image/png',
    });
    dropbox.uploadFile.mockResolvedValue({ path: '/x', url: 'https://x' });
    prisma.catalogProduct.findUnique
      .mockResolvedValueOnce({ coverArtUrl: null })
      .mockResolvedValueOnce({ id: 'cp1', submissionId: null });

    await callSync(
      svc,
      {
        name: '\x00\x01\x02', // all control chars → sanitize to empty → fallback
        upc: '1',
        cover_image: { has_uploaded: true },
        assets: [],
      },
      '1',
    );

    const albumArg = dropbox.uploadFile.mock.calls[0][4];
    expect(albumArg).toBe('untitled-product');
  });
});

describe('CatalogService.persistCoverArtUrl', () => {
  function makeStubs() {
    const prisma: any = {
      catalogProduct: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      $runCommandRaw: jest.fn().mockResolvedValue({ ok: 1, nModified: 1 }),
    };
    const svc = new CatalogService(prisma, {} as any, {} as any);
    return { svc, prisma };
  }

  function callPersist(svc: CatalogService, fugaId: string | number, url: string) {
    return (svc as any).persistCoverArtUrl(fugaId, url);
  }

  it('writes coverArtUrl to CatalogProduct when product exists', async () => {
    const { svc, prisma } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ id: 'cp1', submissionId: null });

    await callPersist(svc, '123', 'https://shared.example/x');

    expect(prisma.catalogProduct.update).toHaveBeenCalledWith({
      where: { fugaId: BigInt('123') },
      data: { coverArtUrl: 'https://shared.example/x' },
    });
    expect(prisma.$runCommandRaw).not.toHaveBeenCalled();
  });

  it('issues an atomic dotted-path $set on Submission when one is linked', async () => {
    const { svc, prisma } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ id: 'cp1', submissionId: 'sub1' });

    await callPersist(svc, '123', 'https://shared.example/x');

    expect(prisma.$runCommandRaw).toHaveBeenCalledTimes(1);
    const cmd = prisma.$runCommandRaw.mock.calls[0][0];
    expect(cmd.update).toBe('Submission');
    const update = cmd.updates[0];
    // Filter must require coverImageUrl to be absent/null/empty so concurrent
    // writers cannot overwrite a populated URL.
    expect(update.q._id).toEqual({ $oid: 'sub1' });
    expect(update.q.$or).toEqual([
      { 'files.coverImageUrl': { $exists: false } },
      { 'files.coverImageUrl': null },
      { 'files.coverImageUrl': '' },
    ]);
    // Update must use a dotted-path $set so sibling files.* fields are
    // never replaced.
    expect(update.u).toEqual({ $set: { 'files.coverImageUrl': 'https://shared.example/x' } });
    expect(update.multi).toBe(false);
  });

  it('logs and continues when the submission update fails', async () => {
    const { svc, prisma } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue({ id: 'cp1', submissionId: 'sub1' });
    prisma.$runCommandRaw.mockRejectedValue(new Error('mongo offline'));

    // Should not throw — the catalog product update is the load-bearing write.
    await expect(callPersist(svc, '123', 'https://shared.example/x')).resolves.toBeUndefined();
    expect(prisma.catalogProduct.update).toHaveBeenCalled();
  });

  it('no-ops when product does not exist', async () => {
    const { svc, prisma } = makeStubs();
    prisma.catalogProduct.findUnique.mockResolvedValue(null);

    await callPersist(svc, '999', 'https://x');

    expect(prisma.catalogProduct.update).not.toHaveBeenCalled();
    expect(prisma.$runCommandRaw).not.toHaveBeenCalled();
  });
});

describe('CatalogService.toStringOrNull', () => {
  const svc = new CatalogService({} as any, {} as any, {} as any);
  const fn = (v: any) => (svc as any).toStringOrNull(v);

  it('coerces numbers to their string representation (FUGA returns recording_year as Int)', () => {
    expect(fn(2026)).toBe('2026');
    expect(fn(0)).toBeNull(); // 0 is falsy → null
    expect(fn(-1)).toBe('-1');
  });

  it('passes strings through', () => {
    expect(fn('2026')).toBe('2026');
    expect(fn('2026-Q1')).toBe('2026-Q1');
  });

  it('returns null for null/undefined/empty/NaN/Infinity', () => {
    expect(fn(null)).toBeNull();
    expect(fn(undefined)).toBeNull();
    expect(fn('')).toBeNull();
    expect(fn(NaN)).toBeNull();
    expect(fn(Infinity)).toBeNull();
  });

  it('returns null for unsupported types (objects, booleans, arrays)', () => {
    expect(fn({})).toBeNull();
    expect(fn(true)).toBeNull();
    expect(fn([2026])).toBeNull();
  });
});
