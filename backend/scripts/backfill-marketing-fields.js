/**
 * One-time backfill for marketing field rename: `marketing.genre` → `marketing.mainGenre`.
 *
 * sync-fuga-score.js historically wrote `marketing.genre` but the UI reads
 * `marketing.mainGenre` (CatalogDetail.tsx). This script copies the legacy
 * `genre` value to `mainGenre` on documents that have one but not the other.
 *
 * Rules:
 *   - If `marketing.mainGenre` is set, do nothing for that doc.
 *   - If only `marketing.genre` exists, copy to `marketing.mainGenre`. Keep
 *     `marketing.genre` for one release as a UI fallback.
 *   - If both exist and differ, mark `marketing.fugaScoreFieldConflict` with
 *     the diff and skip — caller resolves manually.
 *
 * Atomic per-doc update via Prisma `$runCommandRaw` `$set` to match the
 * existing pattern in catalog.service.ts:1511 and avoid clobbering siblings.
 *
 * Usage:
 *   node backend/scripts/backfill-marketing-fields.js --dry-run
 *   node backend/scripts/backfill-marketing-fields.js
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n📊 Marketing field backfill: genre → mainGenre (dryRun=${DRY_RUN})\n`);

  const subs = await prisma.submission.findMany({
    select: { id: true, albumTitle: true, marketing: true },
  });

  const results = {
    total: subs.length,
    skippedAlreadyMigrated: 0,
    skippedNoGenre: 0,
    wouldCopy: 0,
    copied: 0,
    conflicts: 0,
    errors: 0,
  };

  for (const sub of subs) {
    const m = (sub.marketing || {});
    const legacy = m.genre;
    const canonical = m.mainGenre;

    if (canonical && canonical !== '') {
      if (legacy && legacy !== '' && legacy !== canonical) {
        // Both exist and differ — flag for manual review
        results.conflicts++;
        console.log(
          `  ⚠️  CONFLICT [${sub.id}] ${sub.albumTitle}: ` +
          `genre="${legacy}" mainGenre="${canonical}"`,
        );
        if (!DRY_RUN) {
          try {
            await prisma.$runCommandRaw({
              update: 'Submission',
              updates: [{
                q: { _id: { $oid: sub.id } },
                u: {
                  $set: {
                    'marketing.fugaScoreFieldConflict': {
                      genre: legacy,
                      mainGenre: canonical,
                      detectedAt: new Date().toISOString(),
                    },
                  },
                },
                multi: false,
              }],
            });
          } catch (err) {
            results.errors++;
            console.log(`     ❌ Failed to mark conflict: ${err.message}`);
          }
        }
      } else {
        results.skippedAlreadyMigrated++;
      }
      continue;
    }

    if (!legacy || legacy === '') {
      results.skippedNoGenre++;
      continue;
    }

    // Copy legacy → canonical
    if (DRY_RUN) {
      results.wouldCopy++;
      console.log(`  ✅ WOULD COPY [${sub.id}] ${sub.albumTitle}: genre="${legacy}" → mainGenre`);
      continue;
    }

    try {
      await prisma.$runCommandRaw({
        update: 'Submission',
        updates: [{
          q: {
            _id: { $oid: sub.id },
            $or: [
              { 'marketing.mainGenre': { $exists: false } },
              { 'marketing.mainGenre': null },
              { 'marketing.mainGenre': '' },
            ],
          },
          u: { $set: { 'marketing.mainGenre': legacy } },
          multi: false,
        }],
      });
      results.copied++;
      console.log(`  ✅ COPIED [${sub.id}] ${sub.albumTitle}: "${legacy}"`);
    } catch (err) {
      results.errors++;
      console.log(`     ❌ Failed: ${err.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total submissions:           ${results.total}`);
  console.log(`Skipped (already migrated):  ${results.skippedAlreadyMigrated}`);
  console.log(`Skipped (no legacy genre):   ${results.skippedNoGenre}`);
  if (DRY_RUN) {
    console.log(`Would copy:                  ${results.wouldCopy}`);
  } else {
    console.log(`Copied legacy → canonical:   ${results.copied}`);
  }
  console.log(`Conflicts flagged:           ${results.conflicts}`);
  console.log(`Errors:                      ${results.errors}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Fatal:', err);
  await prisma.$disconnect();
  process.exit(1);
});
