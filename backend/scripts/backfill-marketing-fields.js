/**
 * Backfill / cleanup for the marketing field on Submission.
 *
 * Two independent passes that both run on every invocation:
 *
 *   Pass A: legacy `marketing.genre` → canonical `marketing.mainGenre`
 *     The old sync-fuga-score.js wrote `marketing.genre` but the UI reads
 *     `marketing.mainGenre`. Copy when canonical is missing; flag conflicts;
 *     keep legacy for one UI release as a fallback.
 *
 *   Pass B: Softr select-field object cleanup (added after first prod sync)
 *     The 27 records the first sync hit were saved with raw Softr objects:
 *       marketing.mainGenre = { id: '...', label: 'Pop' }   → must be 'Pop'
 *       marketing.subgenres = ['[object Object]', ...]      → must be ['Synth-pop', ...]
 *       marketing.moods     = ['[object Object]', ...]      → drop all '[object Object]'
 *     The mapper is fixed forward, but already-written docs need cleanup.
 *     For object-shaped mainGenre we can recover the label in place.
 *     For "[object Object]" strings we can only DROP them — the original
 *     label is not recoverable from the DB; next sync will repopulate.
 *
 * Both passes use atomic `$runCommandRaw` `$set` per doc, matching the
 * established pattern at catalog.service.ts:1511. No full-JSON read-modify-
 * write so sibling marketing fields cannot be clobbered.
 *
 * Usage:
 *   node backend/scripts/backfill-marketing-fields.js --dry-run
 *   node backend/scripts/backfill-marketing-fields.js
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

function extractLabel(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if (typeof value.label === 'string') return value.label.trim();
    if (typeof value.name === 'string') return value.name.trim();
    if (typeof value.value === 'string') return value.value.trim();
  }
  return '';
}

function cleanStringArray(arr) {
  if (!Array.isArray(arr)) return null; // signal: not an array, leave untouched
  return arr
    .map((item) => extractLabel(item))
    .filter((s) => s.length > 0 && !s.includes('[object'));
}

async function passA_genreRename(sub, results) {
  const m = sub.marketing || {};
  const legacy = m.genre;
  // Skip if mainGenre is a populated string OR an object (Pass B handles objects).
  const canonical = typeof m.mainGenre === 'string' ? m.mainGenre : '';

  if (canonical !== '') {
    if (legacy && typeof legacy === 'string' && legacy !== '' && legacy !== canonical) {
      results.conflicts++;
      console.log(`  ⚠️  CONFLICT [${sub.id}] ${sub.albumTitle}: genre="${legacy}" mainGenre="${canonical}"`);
      if (!DRY_RUN) {
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
      }
    } else {
      results.skippedAlreadyMigrated++;
    }
    return;
  }

  if (!legacy || typeof legacy !== 'string' || legacy === '') {
    results.skippedNoGenre++;
    return;
  }

  if (DRY_RUN) {
    results.wouldCopy++;
    console.log(`  ✅ WOULD COPY [${sub.id}] ${sub.albumTitle}: genre="${legacy}" → mainGenre`);
    return;
  }

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
}

async function passB_softrObjectCleanup(sub, results) {
  const m = sub.marketing || {};
  const $set = {};
  const changes = [];

  // mainGenre: object → label (recoverable)
  if (m.mainGenre && typeof m.mainGenre === 'object') {
    const label = extractLabel(m.mainGenre);
    if (label) {
      $set['marketing.mainGenre'] = label;
      changes.push(`mainGenre: object → "${label}"`);
    } else {
      // Object with no label/name — drop to empty string so UI hides it.
      $set['marketing.mainGenre'] = '';
      changes.push('mainGenre: malformed object → ""');
    }
  }

  // subgenres / moods / instruments: clean each
  for (const field of ['subgenres', 'moods', 'instruments']) {
    const cleaned = cleanStringArray(m[field]);
    if (cleaned === null) continue; // not an array, skip
    const before = m[field];
    // Only patch if there's a real change (avoid no-op writes).
    const dirty = before.some(
      (v) => typeof v !== 'string' || v.includes('[object') || v.trim() === '',
    );
    if (!dirty) continue;
    $set[`marketing.${field}`] = cleaned;
    changes.push(`${field}: ${before.length} entries → ${cleaned.length} clean`);
  }

  if (Object.keys($set).length === 0) {
    results.cleanupSkipped++;
    return;
  }

  results.cleanupCandidates++;
  console.log(`  🧹 [${sub.id}] ${sub.albumTitle}: ${changes.join(', ')}`);

  if (DRY_RUN) {
    results.cleanupWouldFix++;
    return;
  }

  await prisma.$runCommandRaw({
    update: 'Submission',
    updates: [{
      q: { _id: { $oid: sub.id } },
      u: { $set },
      multi: false,
    }],
  });
  results.cleanupFixed++;
}

async function main() {
  console.log(`\n📊 Marketing backfill + Softr-object cleanup (dryRun=${DRY_RUN})\n`);

  const subs = await prisma.submission.findMany({
    select: { id: true, albumTitle: true, marketing: true },
  });

  const results = {
    total: subs.length,
    // Pass A
    skippedAlreadyMigrated: 0,
    skippedNoGenre: 0,
    wouldCopy: 0,
    copied: 0,
    conflicts: 0,
    // Pass B
    cleanupSkipped: 0,
    cleanupCandidates: 0,
    cleanupWouldFix: 0,
    cleanupFixed: 0,
    // Shared
    errors: 0,
  };

  for (const sub of subs) {
    try {
      await passA_genreRename(sub, results);
    } catch (err) {
      results.errors++;
      console.log(`     ❌ Pass A failed [${sub.id}]: ${err.message}`);
    }
    try {
      await passB_softrObjectCleanup(sub, results);
    } catch (err) {
      results.errors++;
      console.log(`     ❌ Pass B failed [${sub.id}]: ${err.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total submissions:           ${results.total}`);
  console.log(`\n-- Pass A: genre → mainGenre rename --`);
  console.log(`Skipped (already migrated):  ${results.skippedAlreadyMigrated}`);
  console.log(`Skipped (no legacy genre):   ${results.skippedNoGenre}`);
  if (DRY_RUN) {
    console.log(`Would copy:                  ${results.wouldCopy}`);
  } else {
    console.log(`Copied legacy → canonical:   ${results.copied}`);
  }
  console.log(`Conflicts flagged:           ${results.conflicts}`);
  console.log(`\n-- Pass B: Softr object cleanup --`);
  console.log(`Skipped (already clean):     ${results.cleanupSkipped}`);
  console.log(`Cleanup candidates:          ${results.cleanupCandidates}`);
  if (DRY_RUN) {
    console.log(`Would fix:                   ${results.cleanupWouldFix}`);
  } else {
    console.log(`Fixed:                       ${results.cleanupFixed}`);
  }
  console.log(`\nErrors:                      ${results.errors}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Fatal:', err);
  await prisma.$disconnect();
  process.exit(1);
});
