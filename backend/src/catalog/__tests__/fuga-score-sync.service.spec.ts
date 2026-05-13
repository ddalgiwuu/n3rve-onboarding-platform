/**
 * Unit tests for FugaScoreSyncService — the Softr→Submission.marketing sync.
 *
 * Covers the five categories specified in the PR-2 plan (cross-validation
 * thread 5a7f3576):
 *   1. Mapper: mainGenre (NOT legacy `genre`), subgenres array vs string, moods/instruments
 *   2. Atomic $set shape via $runCommandRaw — no full-JSON overwrite
 *   3. Matching: UPC primary, name+label single hit, ambiguous → no update, empty label → no match
 *   4. Auth: DB cookie path, env fallback, 401 → cache invalidate → single retry → AUTH_ERROR
 *   5. Single-flight lock: two concurrent calls collapse to one runSync invocation
 */
import { FugaScoreSyncService } from '../fuga-score-sync.service';

const fetchMock = jest.fn();
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: (...args: any[]) => fetchMock(...args),
}));

describe('FugaScoreSyncService', () => {
  function makeService(opts: {
    dbCookie?: string | null;
    envCookie?: string | null;
    submissions?: any[];
    slackWebhook?: string;
  } = {}) {
    const prisma: any = {
      softrSession: {
        findUnique: jest.fn().mockResolvedValue(
          opts.dbCookie ? { cookie: opts.dbCookie, lastSyncAt: null } : null,
        ),
        upsert: jest.fn().mockImplementation(({ create, update, where }: any) =>
          Promise.resolve({ ...create, ...update, key: where.key, updatedAt: new Date(), lastSyncAt: null }),
        ),
        update: jest.fn().mockResolvedValue({}),
      },
      submission: {
        findMany: jest.fn().mockResolvedValue(opts.submissions || []),
      },
      catalogProduct: {
        findMany: jest.fn().mockResolvedValue((opts as any).catalogOnlyProducts || []),
      },
      syncRun: {
        create: jest.fn().mockResolvedValue({ id: 'run1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $runCommandRaw: jest.fn().mockResolvedValue({ ok: 1, nModified: 1 }),
    };
    const envMap: Record<string, any> = {
      SOFTR_SESSION_COOKIE: opts.envCookie,
      SLACK_WEBHOOK_URL_OPS: opts.slackWebhook,
    };
    const configService: any = {
      get: jest.fn((key: string) => envMap[key]),
    };
    return { svc: new FugaScoreSyncService(prisma, configService), prisma };
  }

  function softrProject(fields: Record<string, any>, id = 'rec_test'): any {
    return { id, fields };
  }

  function okResponse(items: any[]) {
    return {
      status: 200,
      json: jest.fn().mockResolvedValue({ items }),
      text: jest.fn().mockResolvedValue(''),
    };
  }

  function status401Response() {
    return {
      status: 401,
      json: jest.fn().mockResolvedValue({ error: 'unauthorized' }),
      text: jest.fn().mockResolvedValue('unauthorized'),
    };
  }

  beforeEach(() => {
    fetchMock.mockReset();
  });

  // ==================== MAPPER ====================

  describe('mapper', () => {
    it('writes canonical mainGenre (NOT legacy genre)', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'connect.sid=valid',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '111', 'Main Genre': 'Pop' }),
      ]));

      await svc.runSync({ source: 'cli' });

      const call = prisma.$runCommandRaw.mock.calls[0][0];
      const $set = call.updates[0].u.$set;
      expect($set['marketing.mainGenre']).toBe('Pop');
      expect($set['marketing.genre']).toBeUndefined();
    });

    it('normalizes subgenres string → array (regression: old script crashed UI)', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'connect.sid=valid',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '111', 'Subgenre(s)': 'Synth-pop, Dream-pop' }),
      ]));

      await svc.runSync({ source: 'cli' });

      const $set = prisma.$runCommandRaw.mock.calls[0][0].updates[0].u.$set;
      expect($set['marketing.subgenres']).toEqual(['Synth-pop', 'Dream-pop']);
    });

    it('extracts label from Softr {id, label} object for mainGenre (regression: was saving raw object)', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'connect.sid=valid',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({
          'Product UPCs - Unique': '111',
          'Main Genre': { id: 'selTWSt5mlX1JFlvl', label: 'Electronic' },
        }),
      ]));

      await svc.runSync({ source: 'cli' });
      const $set = prisma.$runCommandRaw.mock.calls[0][0].updates[0].u.$set;
      expect($set['marketing.mainGenre']).toBe('Electronic'); // string, not object
    });

    it('extracts labels from array of {id, label} objects for subgenres (regression: was producing "[object Object]")', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'connect.sid=valid',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({
          'Product UPCs - Unique': '111',
          'Subgenre(s)': [
            { id: 's1', label: 'Synth-pop' },
            { id: 's2', label: 'Dream-pop' },
          ],
          'Mood(s)': [
            { id: 'm1', label: 'Happy' },
            { id: 'm2', label: 'Energetic' },
          ],
        }),
      ]));

      await svc.runSync({ source: 'cli' });
      const $set = prisma.$runCommandRaw.mock.calls[0][0].updates[0].u.$set;
      expect($set['marketing.subgenres']).toEqual(['Synth-pop', 'Dream-pop']);
      expect($set['marketing.moods']).toEqual(['Happy', 'Energetic']);
      // No "[object Object]" entries anywhere
      const allStrings = [
        ...($set['marketing.subgenres'] as string[]),
        ...($set['marketing.moods'] as string[]),
      ];
      expect(allStrings.every((s) => !s.includes('[object'))).toBe(true);
    });

    it('handles mixed shapes gracefully (object + string in same array)', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'connect.sid=valid',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({
          'Product UPCs - Unique': '111',
          'Subgenre(s)': [{ id: 's1', label: 'A' }, 'B', { name: 'C' }, null, ''],
        }),
      ]));

      await svc.runSync({ source: 'cli' });
      const $set = prisma.$runCommandRaw.mock.calls[0][0].updates[0].u.$set;
      // 'A' (label), 'B' (plain string), 'C' (name fallback). null and '' filtered out.
      expect($set['marketing.subgenres']).toEqual(['A', 'B', 'C']);
    });

    it('normalizes moods/instruments arrays', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'connect.sid=valid',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({
          'Product UPCs - Unique': '111',
          'Mood(s)': ['Happy', 'Energetic'],
          'Instruments': 'Guitar, Drums',
        }),
      ]));

      await svc.runSync({ source: 'cli' });

      const $set = prisma.$runCommandRaw.mock.calls[0][0].updates[0].u.$set;
      expect($set['marketing.moods']).toEqual(['Happy', 'Energetic']);
      expect($set['marketing.instruments']).toEqual(['Guitar', 'Drums']);
    });
  });

  // ==================== ATOMIC $SET ====================

  describe('atomic $set', () => {
    it('uses $runCommandRaw with dotted $set paths — no full marketing overwrite', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'connect.sid=valid',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '111', 'Elevator Pitch': 'pitch' }),
      ]));

      await svc.runSync({ source: 'cli' });

      const call = prisma.$runCommandRaw.mock.calls[0][0];
      expect(call.update).toBe('Submission');
      expect(call.updates[0].q._id.$oid).toBe('sub1');
      expect(call.updates[0].multi).toBe(false);
      // dotted paths, never a whole `marketing: {...}` $set
      const $set = call.updates[0].u.$set;
      expect(Object.keys($set).every((k) => k.startsWith('marketing.'))).toBe(true);
      expect($set['marketing.mainPitch']).toBe('pitch');
      expect($set['marketing.fugaScoreSyncedAt']).toBeDefined();
      expect($set['marketing.fugaScoreRecordId']).toBe('rec_test');
    });

    it('dryRun: does not call $runCommandRaw', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'connect.sid=valid',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '111', 'Elevator Pitch': 'pitch' }),
      ]));

      const result = await svc.runSync({ source: 'admin', dryRun: true });

      expect(prisma.$runCommandRaw).not.toHaveBeenCalled();
      expect(result.dryRun).toBe(true);
      expect(result.counters.updated).toBe(1); // would-update count still incremented
    });
  });

  // ==================== MATCHING ====================

  describe('matching', () => {
    it('UPC hit matches and updates', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'c',
        submissions: [{ id: 'sub-upc', albumTitle: 'X', labelName: 'L', release: { upc: '999' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '999', 'Elevator Pitch': 'p' }),
      ]));

      const result = await svc.runSync({ source: 'cli' });
      expect(result.counters.matched).toBe(1);
      expect(result.counters.updated).toBe(1);
    });

    it('name+label single hit matches when UPC absent', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'c',
        submissions: [{ id: 'sub-name', albumTitle: 'My Album', labelName: 'My Label', release: {} }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Project Name': 'My Album', Label: 'My Label', 'Elevator Pitch': 'p' }),
      ]));

      const result = await svc.runSync({ source: 'cli' });
      expect(result.counters.matched).toBe(1);
    });

    it('ambiguous name+label: increments ambiguous, does NOT update', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'c',
        submissions: [
          { id: 'a', albumTitle: 'Same', labelName: 'L', release: {} },
          { id: 'b', albumTitle: 'Same', labelName: 'L', release: {} },
        ],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Project Name': 'Same', Label: 'L', 'Elevator Pitch': 'p' }),
      ]));

      const result = await svc.runSync({ source: 'cli' });
      expect(result.counters.ambiguous).toBe(1);
      expect(result.counters.updated).toBe(0);
      expect(prisma.$runCommandRaw).not.toHaveBeenCalled();
    });

    it('UPC matches catalog-only product → writes to CatalogProduct.marketing (new path)', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'c',
        submissions: [], // no submission for this UPC
        catalogOnlyProducts: [
          { id: 'cat-prod-1', name: 'this feeling', label: 'ZEST', upc: '8721466979786' },
        ],
      } as any);
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({
          'Product UPCs - Unique': '8721466979786',
          'Elevator Pitch': 'A catalog-only release',
          'Main Genre': { id: 's1', label: 'Pop' },
        }),
      ]));

      const result = await svc.runSync({ source: 'cli' });
      expect(result.counters.matched).toBe(1);
      expect(result.counters.updated).toBe(1);
      // Atomic update should target CatalogProduct (not Submission), and
      // include the marketingSyncedAt sentinel that the unified API reads.
      const call = prisma.$runCommandRaw.mock.calls[0][0];
      expect(call.update).toBe('CatalogProduct');
      expect(call.updates[0].q._id.$oid).toBe('cat-prod-1');
      expect(call.updates[0].u.$set['marketing.mainPitch']).toBe('A catalog-only release');
      expect(call.updates[0].u.$set['marketingSyncedAt']).toBeDefined();
    });

    it('submission match takes precedence over catalog-only when UPC exists in both', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'c',
        submissions: [
          { id: 'sub-1', albumTitle: 'X', labelName: 'L', release: { upc: '777' } },
        ],
        catalogOnlyProducts: [
          { id: 'cat-prod-1', name: 'X', label: 'L', upc: '777' },
        ],
      } as any);
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '777', 'Elevator Pitch': 'pitch' }),
      ]));

      await svc.runSync({ source: 'cli' });
      const call = prisma.$runCommandRaw.mock.calls[0][0];
      expect(call.update).toBe('Submission');
      expect(call.updates[0].q._id.$oid).toBe('sub-1');
    });

    it('empty label: no fallback match, no update', async () => {
      const { svc } = makeService({
        dbCookie: 'c',
        submissions: [{ id: 'a', albumTitle: 'X', labelName: '', release: {} }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Project Name': 'X', Label: '', 'Elevator Pitch': 'p' }),
      ]));

      const result = await svc.runSync({ source: 'cli' });
      expect(result.counters.noMatch).toBe(1);
      expect(result.counters.updated).toBe(0);
    });
  });

  // ==================== AUTH ====================

  describe('auth', () => {
    it('uses DB cookie when present', async () => {
      const { svc } = makeService({ dbCookie: 'db_cookie', submissions: [] });
      fetchMock.mockResolvedValueOnce(okResponse([]));

      await svc.runSync({ source: 'cli' });

      const callOpts = fetchMock.mock.calls[0][1];
      expect(callOpts.headers.Cookie).toBe('db_cookie');
    });

    it('falls back to env cookie when DB row absent', async () => {
      const { svc } = makeService({ dbCookie: null, envCookie: 'env_cookie', submissions: [] });
      fetchMock.mockResolvedValueOnce(okResponse([]));

      await svc.runSync({ source: 'cli' });

      const callOpts = fetchMock.mock.calls[0][1];
      expect(callOpts.headers.Cookie).toBe('env_cookie');
    });

    it('no cookie configured: AUTH_ERROR', async () => {
      const { svc } = makeService({ dbCookie: null, envCookie: null });
      const result = await svc.runSync({ source: 'cli' });
      expect(result.status).toBe('AUTH_ERROR');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('401 → invalidate cache → single retry → AUTH_ERROR if still 401', async () => {
      const { svc, prisma } = makeService({ dbCookie: 'stale' });
      fetchMock.mockResolvedValueOnce(status401Response());
      // findUnique gets called again after cache invalidation; returns the same stale cookie
      // (no fresh push happened) → single retry skipped because cookie didn't change
      const result = await svc.runSync({ source: 'cli' });
      expect(result.status).toBe('AUTH_ERROR');
      // Only one fetch — retry logic skips when cookie hasn't changed
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('401 → fresh cookie pushed between attempts → retry succeeds', async () => {
      const { svc, prisma } = makeService({ dbCookie: 'stale' });
      // First fetch: 401 with stale cookie
      fetchMock.mockResolvedValueOnce(status401Response());
      // Simulate fresh cookie arriving via the next findUnique call
      prisma.softrSession.findUnique
        .mockResolvedValueOnce({ cookie: 'stale', lastSyncAt: null }) // initial
        .mockResolvedValueOnce({ cookie: 'fresh', lastSyncAt: null }); // after invalidate
      // Second fetch: 200 with fresh cookie
      fetchMock.mockResolvedValueOnce(okResponse([]));

      const result = await svc.runSync({ source: 'cli' });
      expect(result.status).toBe('PARTIAL'); // zero items returned
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][1].headers.Cookie).toBe('fresh');
    });
  });

  // ==================== SYNC RUN PERSISTENCE ====================

  describe('SyncRun persistence', () => {
    it('persists SyncRun row with counters on non-dry runs', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'c',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '111', 'Elevator Pitch': 'p' }),
      ]));

      await svc.runSync({ source: 'cron' });
      // persistSyncRun is fire-and-forget — wait a tick.
      await new Promise((r) => setImmediate(r));

      expect(prisma.syncRun.create).toHaveBeenCalledTimes(1);
      const row = prisma.syncRun.create.mock.calls[0][0].data;
      expect(row.type).toBe('FUGA_SCORE');
      expect(row.source).toBe('cron');
      expect(row.status).toBe('SUCCESS');
      expect(row.updated).toBe(1);
      expect(row.errorCount).toBe(0);
    });

    it('does NOT persist SyncRun for dry runs', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'c',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '111', 'Elevator Pitch': 'p' }),
      ]));

      await svc.runSync({ source: 'admin', dryRun: true });
      await new Promise((r) => setImmediate(r));

      expect(prisma.syncRun.create).not.toHaveBeenCalled();
    });

    it('getLatestSyncRun returns most recent row', async () => {
      const { svc, prisma } = makeService({});
      prisma.syncRun.findMany.mockResolvedValueOnce([
        { id: 'recent', startedAt: new Date(), status: 'SUCCESS' },
      ]);
      const result = await svc.getLatestSyncRun();
      expect(result?.id).toBe('recent');
      expect(prisma.syncRun.findMany.mock.calls[0][0]).toMatchObject({
        where: { type: 'FUGA_SCORE' },
        orderBy: { startedAt: 'desc' },
        take: 1,
      });
    });
  });

  // ==================== ALERTS ====================

  describe('alerts', () => {
    it('AUTH_ERROR with webhook configured: posts to Slack', async () => {
      const { svc } = makeService({
        dbCookie: 'stale',
        slackWebhook: 'https://hooks.slack.example/x',
      });
      // first fetch: 401 (sync auth fails)
      fetchMock.mockResolvedValueOnce(status401Response());
      // alert fetch: also intercepted by the same mock
      fetchMock.mockResolvedValueOnce({ status: 200, json: jest.fn().mockResolvedValue({}) });

      await svc.runSync({ source: 'cron' });
      await new Promise((r) => setImmediate(r));

      // 2 fetches: one for Softr (401), one for Slack
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const slackCall = fetchMock.mock.calls[1];
      expect(slackCall[0]).toBe('https://hooks.slack.example/x');
      expect(slackCall[1].method).toBe('POST');
    });

    it('AUTH_ERROR without webhook: no Slack call, sync result still AUTH_ERROR', async () => {
      const { svc } = makeService({ dbCookie: 'stale' /* no slackWebhook */ });
      fetchMock.mockResolvedValueOnce(status401Response());

      const result = await svc.runSync({ source: 'cron' });
      await new Promise((r) => setImmediate(r));

      expect(result.status).toBe('AUTH_ERROR');
      // Only the Softr fetch happened — no Slack call.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('SUCCESS status: does NOT alert', async () => {
      const { svc } = makeService({
        dbCookie: 'c',
        slackWebhook: 'https://hooks.slack.example/x',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });
      fetchMock.mockResolvedValueOnce(okResponse([
        softrProject({ 'Product UPCs - Unique': '111', 'Elevator Pitch': 'p' }),
      ]));

      await svc.runSync({ source: 'cron' });
      await new Promise((r) => setImmediate(r));

      // Only the Softr fetch, no Slack on success.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== SINGLE-FLIGHT LOCK ====================

  describe('single-flight lock', () => {
    it('two concurrent runSync calls share one execution', async () => {
      const { svc, prisma } = makeService({
        dbCookie: 'c',
        submissions: [{ id: 'sub1', albumTitle: 'X', labelName: 'L', release: { upc: '111' } }],
      });

      // Slow fetch — both callers will arrive before it resolves.
      let resolveFetch: (v: any) => void;
      fetchMock.mockReturnValueOnce(new Promise((r) => { resolveFetch = r; }));

      const p1 = svc.runSync({ source: 'cron' });
      const p2 = svc.runSync({ source: 'admin' });

      resolveFetch!(okResponse([softrProject({ 'Product UPCs - Unique': '111', 'Elevator Pitch': 'p' })]));

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      // Second caller gets SKIPPED_LOCKED but inherits the first run's counters.
      expect([r1.status, r2.status]).toEqual(expect.arrayContaining(['SUCCESS', 'SKIPPED_LOCKED']));
    });
  });
});
