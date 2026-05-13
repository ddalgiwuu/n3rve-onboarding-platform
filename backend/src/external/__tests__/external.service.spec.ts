/**
 * Unit tests for ExternalService.upsertSubmission marketing-preservation
 * semantics. Regression coverage for the bug where update-path was sending
 * `marketing: dto.marketing || {}` and silently clearing existing marketing
 * data (including FUGA Score sync state) when callers upserted without
 * including marketing in the DTO.
 *
 * Expected semantics after the fix:
 *   - update + dto.marketing === undefined → marketing untouched
 *   - update + dto.marketing provided      → shallow merge with existing
 *   - update + dto.marketing === {}        → existing keys preserved (top-level
 *                                            merge with no overrides)
 *   - create + no marketing                → marketing = {} (unchanged)
 *   - create + marketing provided          → marketing = dto.marketing
 */
import { ExternalService } from '../external.service';

describe('ExternalService.upsertSubmission marketing preservation', () => {
  function makeService(opts: {
    existing?: any;
    labelAccount?: any;
    submitter?: any;
  } = {}) {
    const prisma: any = {
      submission: {
        findMany: jest.fn().mockResolvedValue(
          opts.existing ? [opts.existing] : [],
        ),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: opts.existing?.id, ...data }),
        ),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'new-id', ...data }),
        ),
      },
      user: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where.email === 'openclaw@n3rve.com' || where.email === 'ai-agent@n3rve.com') {
            return Promise.resolve(opts.submitter || { id: 'system-user' });
          }
          if (where.company) {
            return Promise.resolve(opts.labelAccount || null);
          }
          return Promise.resolve(null);
        }),
      },
    };
    const qcGateway: any = { /* not used in upsertSubmission */ };
    return { svc: new ExternalService(prisma, qcGateway), prisma };
  }

  function makeDto(overrides: any = {}) {
    return {
      upc: '1234567890123',
      albumTitle: 'Test Album',
      artistName: 'Test Artist',
      albumType: 'SINGLE',
      labelName: 'Test Label',
      releaseDate: '2026-05-13',
      tracks: [],
      ...overrides,
    } as any;
  }

  it('update with marketing omitted: preserves existing marketing', async () => {
    const existing = {
      id: 'existing-1',
      release: { upc: '1234567890123' },
      marketing: {
        mainPitch: 'Pre-existing pitch',
        fugaScoreRecordId: 'rec123',
        fugaScoreSyncedAt: '2026-03-28T00:00:00Z',
      },
    };
    const { svc, prisma } = makeService({ existing });

    const dto = makeDto({ /* no marketing */ });
    const result = await svc.upsertSubmission(dto);

    expect(result.action).toBe('updated');
    const updateCall = prisma.submission.update.mock.calls[0][0];
    // marketing must NOT appear in the update payload
    expect(updateCall.data).not.toHaveProperty('marketing');
  });

  it('update with marketing provided: shallow-merges with existing', async () => {
    const existing = {
      id: 'existing-2',
      release: { upc: '1234567890123' },
      marketing: {
        mainPitch: 'Pre-existing pitch',
        fugaScoreRecordId: 'rec123',
        fugaScoreSyncedAt: '2026-03-28T00:00:00Z',
      },
    };
    const { svc, prisma } = makeService({ existing });

    const dto = makeDto({
      marketing: {
        mainPitch: 'New pitch from OpenClaw',
        // Note: fugaScoreRecordId / fugaScoreSyncedAt not provided — must survive
      },
    });
    await svc.upsertSubmission(dto);

    const updateCall = prisma.submission.update.mock.calls[0][0];
    expect(updateCall.data.marketing).toEqual({
      mainPitch: 'New pitch from OpenClaw', // overridden
      fugaScoreRecordId: 'rec123',           // preserved
      fugaScoreSyncedAt: '2026-03-28T00:00:00Z', // preserved
    });
  });

  it('update with marketing: {}: preserves all existing keys (no-op merge)', async () => {
    const existing = {
      id: 'existing-3',
      release: { upc: '1234567890123' },
      marketing: {
        mainPitch: 'Should survive',
        socialMediaPlan: 'IG + TikTok',
      },
    };
    const { svc, prisma } = makeService({ existing });

    const dto = makeDto({ marketing: {} });
    await svc.upsertSubmission(dto);

    const updateCall = prisma.submission.update.mock.calls[0][0];
    expect(updateCall.data.marketing).toEqual({
      mainPitch: 'Should survive',
      socialMediaPlan: 'IG + TikTok',
    });
  });

  it('create with no marketing: sets marketing = {} (unchanged baseline)', async () => {
    const { svc, prisma } = makeService({ /* no existing → triggers create */ });

    const dto = makeDto({ /* no marketing */ });
    const result = await svc.upsertSubmission(dto);

    expect(result.action).toBe('created');
    const createCall = prisma.submission.create.mock.calls[0][0];
    expect(createCall.data.marketing).toEqual({});
  });

  it('create with marketing provided: writes dto.marketing as-is', async () => {
    const { svc, prisma } = makeService({});

    const dto = makeDto({
      marketing: { mainPitch: 'Brand new', genre: 'Pop' },
    });
    await svc.upsertSubmission(dto);

    const createCall = prisma.submission.create.mock.calls[0][0];
    expect(createCall.data.marketing).toEqual({
      mainPitch: 'Brand new',
      genre: 'Pop',
    });
  });
});
