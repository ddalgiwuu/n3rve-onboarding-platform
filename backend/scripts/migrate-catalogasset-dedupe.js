#!/usr/bin/env node
/**
 * CatalogAsset dedupe migration — removes the legacy string-productId duplicate
 * rows, keeping the ObjectId-productId rows the app relation actually reads.
 *
 * Root cause context: catalog.service.ts upsertAsset previously raw-$set
 * productId as an uncoerced string, colliding with these legacy string rows
 * under CatalogAsset_fugaId_productId_key (E11000, silently swallowed). The
 * code fix (commit f4d9671) stops new poisoning; this script repairs existing
 * data so re-sync can populate fugaRaw on the canonical rows.
 *
 * Design validated by Codex 3-stage cross-val (thread 1ef8e11c). Native Mongo
 * driver (NOT Prisma — Prisma hides the BSON type boundary this repairs).
 *
 * Phases:
 *   1. PREFLIGHT  — unique index present, count + type snapshot, no-sync gate
 *   2. BACKUP     — canonical EJSON NDJSON export of the whole collection
 *   3. MANIFEST   — group by (String(fugaId), String(productId)); classify
 *   4. WRITE      — per-group txn: archive losers -> merge missing fields into
 *                   ObjectId keeper (identity excluded) -> delete string losers
 *   5. VERIFY     — counts, zero processed string rows, no dup normalized keys
 *
 * Default = DRY RUN (phases 1-3 + frozen manifest with planned patch +
 * conflicts, no writes). --execute MUST consume that reviewed manifest.
 *
 * Usage (inside the project, env DATABASE_URL set):
 *   node scripts/migrate-catalogasset-dedupe.js
 *     -> writes catalogasset-manifest-<ts>.json (review it: process/review/conflicts)
 *   node scripts/migrate-catalogasset-dedupe.js --execute --manifest <that-file>
 *     -> backup + per-group txn (archive -> merge -> delete) against the
 *        reviewed manifest, with stale-manifest + idle re-checks.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
// mongodb 6.x does NOT re-export EJSON at the top level — it lives in `bson`
// (a mongodb dependency). Required for canonical ObjectId/Long/Date round-trip.
const { EJSON } = require('bson');

const EXECUTE = process.argv.includes('--execute');
const MANIFEST_ARG_IDX = process.argv.indexOf('--manifest');
const MANIFEST_IN = MANIFEST_ARG_IDX >= 0 ? process.argv[MANIFEST_ARG_IDX + 1] : null;
const TS = new Date().toISOString().replace(/[:.]/g, '-');
const ARCHIVE_COLL = `CatalogAssetDuplicateArchive_${TS}`;
const COLL = 'CatalogAsset';

// Fields that are immutable identity / Prisma-managed — never copied in a merge.
const IDENTITY_FIELDS = new Set(['_id', 'fugaId', 'productId']);

function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }

// Always close the Mongo client before exiting on an abort path.
async function fatal(client, code, msg) {
  console.error(`ABORT: ${msg}`);
  try { if (client) await client.close(); } catch (_) { /* ignore */ }
  process.exit(code);
}

function isEmpty(v) {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && !Array.isArray(v) && v.constructor === Object && Object.keys(v).length === 0) return true;
  return false;
}

function dbNameFromUri(uri) {
  // mongodb+srv://.../<db>?... — Prisma DATABASE_URL includes the db path.
  const m = uri.match(/\/([^/?]+)\?/);
  return m ? m[1] : 'n3rve-platform';
}

/**
 * SINGLE source of truth for the merge decision (Codex Round 2 #1/#2/#3).
 * Used IDENTICALLY by dry-run (to freeze the plan into the manifest) and by
 * execute (to recompute + assert it matches the frozen plan). Returns a
 * deterministic plan: which fields fill keeper empties, and which fields are
 * conflicted (never patched — keeper stays as-is, loser values archived).
 *
 * Conflict rule: once a field is conflicted (keeper-vs-loser OR loser-vs-loser)
 * it is permanently excluded — a later loser can NEVER re-add it.
 */
function computeMergePlan(keeper, losers) {
  const patch = {};            // field -> chosen value (only for keeper-empty fields)
  const patchSource = {};      // field -> loser _id that supplied it
  const conflictFields = new Set();
  const conflicts = [];        // [{field, kind, ...}]
  for (const loser of losers) {
    for (const [k, v] of Object.entries(loser)) {
      if (IDENTITY_FIELDS.has(k) || k === 'createdAt' || k === 'updatedAt') continue;
      if (isEmpty(v)) continue;
      if (conflictFields.has(k)) continue; // permanently excluded
      if (!isEmpty(keeper[k])) {
        if (EJSON.stringify(keeper[k]) !== EJSON.stringify(v)) {
          conflictFields.add(k);
          delete patch[k]; delete patchSource[k];
          conflicts.push({ field: k, kind: 'keeper-vs-loser', loser: loser._id });
        }
        continue;
      }
      if (!(k in patch)) { patch[k] = v; patchSource[k] = loser._id; }
      else if (EJSON.stringify(patch[k]) !== EJSON.stringify(v)) {
        conflictFields.add(k);
        const a = patchSource[k];
        delete patch[k]; delete patchSource[k];
        conflicts.push({ field: k, kind: 'loser-vs-loser', a, b: loser._id });
      }
    }
  }
  const patchKeys = Object.keys(patch).sort();
  // Deterministic hash of the plan so execute can assert the reviewed plan
  // still holds against live data.
  const planHash = EJSON.stringify({
    patch: patchKeys.reduce((o, k) => { o[k] = patch[k]; return o; }, {}),
    conflictFields: [...conflictFields].sort(),
  });
  return { patch, patchKeys, conflictFields: [...conflictFields].sort(), conflicts, planHash };
}

let client; // module-scoped so the top-level catch can close it on any failure

(async () => {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) { console.error('DATABASE_URL / MONGODB_URI not set'); process.exit(1); }
  const dbName = dbNameFromUri(uri);
  client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const coll = db.collection(COLL);
  log(`Connected to ${dbName}. Mode = ${EXECUTE ? 'EXECUTE (writes)' : 'DRY RUN (read-only)'}`);

  // ---------- Phase 1: PREFLIGHT ----------
  const indexes = await coll.listIndexes().toArray();
  const hasUnique = indexes.some(
    (i) => i.unique && i.key && i.key.fugaId === 1 && i.key.productId === 1,
  );
  if (!hasUnique) {
    await fatal(client, 2, 'unique index on {fugaId,productId} NOT found. This migration assumes it exists.');
  }
  const total = await coll.countDocuments();
  const byType = await coll.aggregate([
    { $group: { _id: { $type: '$productId' }, n: { $sum: 1 } } },
  ]).toArray();
  log(`PREFLIGHT: total=${total}`, 'productId types:', JSON.stringify(byType));

  // No-concurrent-sync gate: latest CatalogProduct.syncedAt must be > 2 min old.
  const recent = await db.collection('CatalogProduct')
    .find({ syncedAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) } })
    .limit(1).toArray();
  if (recent.length > 0) {
    await fatal(client, 3, 'a CatalogProduct was synced in the last 2 min — a pullFromFuga may be running. Re-run when idle.');
  }

  // ---------- Phase 2: BACKUP (canonical EJSON NDJSON) ----------
  const backupPath = path.join(process.cwd(), `catalogasset-backup-${TS}.ndjson`);
  if (EXECUTE) {
    const ws = fs.createWriteStream(backupPath);
    let dumped = 0;
    const cur = coll.find({});
    for await (const doc of cur) { ws.write(EJSON.stringify(doc) + '\n'); dumped++; }
    await new Promise((res) => ws.end(res));
    if (dumped !== total) {
      await fatal(client, 4, `backup dumped ${dumped} != live ${total}`);
    }
    log(`BACKUP: ${dumped} docs -> ${backupPath}`);
  } else {
    log('BACKUP: skipped in dry run');
  }

  const pidNorm = (pid) => pid == null ? 'null'
    : (pid instanceof ObjectId ? pid.toHexString() : String(pid));
  const pidType = (pid) => pid instanceof ObjectId ? 'objectId'
    : (typeof pid === 'string' ? 'string' : (pid == null ? 'null' : typeof pid));

  if (!EXECUTE) {
    // ---------- Phase 3: MANIFEST (dry-run only) ----------
    // Logical key = (String(fugaId), String(productId)). Fetch FULL docs so the
    // reviewed manifest contains the exact planned patch + conflicts, and the
    // execute phase can re-check preconditions without recomputing intent.
    const all = await coll.find({}).toArray();
    const groups = new Map();
    for (const d of all) {
      const key = `${String(d.fugaId)}::${pidNorm(d.productId)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(d);
    }

    const manifest = { ts: TS, coll: COLL, process: [], review: [], noop: 0 };
    for (const [key, docs] of groups) {
      const objectIds = docs.filter((d) => d.productId instanceof ObjectId);
      const strings = docs.filter((d) => typeof d.productId === 'string');
      const others = docs.filter((d) => !(d.productId instanceof ObjectId) && typeof d.productId !== 'string');
      if (others.length > 0) { manifest.review.push({ key, reason: 'productId not string|objectId', ids: docs.map((d) => d._id) }); continue; }
      if (objectIds.length === 1 && strings.length >= 1) {
        const keeper = objectIds[0];
        // SINGLE source of truth — identical helper used by execute. The plan
        // (patch + conflictFields + planHash) is frozen into the manifest so a
        // human reviews exactly what execute will apply, and execute aborts if
        // the live recompute no longer matches this hash.
        const plan = computeMergePlan(keeper, strings);
        manifest.process.push({
          key,
          keeper: keeper._id,
          keeperType: pidType(keeper.productId),
          keeperHasFugaRaw: !isEmpty(keeper.fugaRaw),
          losers: strings.map((s) => ({ _id: s._id, type: pidType(s.productId), hasFugaRaw: !isEmpty(s.fugaRaw), createdAt: s.createdAt })),
          patchKeys: plan.patchKeys,
          conflictFields: plan.conflictFields,
          conflicts: plan.conflicts,
          planHash: plan.planHash,
        });
      } else if (objectIds.length >= 1 && strings.length === 0) {
        manifest.noop++;
      } else if (objectIds.length === 0 && strings.length >= 1) {
        manifest.review.push({ key, reason: 'string-only, no ObjectId keeper', ids: docs.map((d) => d._id) });
      } else if (objectIds.length > 1) {
        manifest.review.push({ key, reason: 'multiple ObjectId rows (unique index should forbid)', ids: objectIds.map((d) => d._id) });
      } else {
        manifest.review.push({ key, reason: 'unexpected shape', ids: docs.map((d) => d._id) });
      }
    }
    const groupsWithConflicts = manifest.process.filter((p) => p.conflicts.length > 0);
    const manifestPath = path.join(process.cwd(), `catalogasset-manifest-${TS}.json`);
    fs.writeFileSync(manifestPath, EJSON.stringify(manifest, null, 2));
    log(`MANIFEST: process=${manifest.process.length} groups, losers=${manifest.process.reduce((s, p) => s + p.losers.length, 0)}, conflictGroups=${groupsWithConflicts.length}, review=${manifest.review.length}, alreadyCanonical=${manifest.noop}`);
    log(`-> ${manifestPath}`);
    if (manifest.review.length > 0) log('REVIEW groups (blocks execute until resolved):', EJSON.stringify(manifest.review.slice(0, 10)));
    if (groupsWithConflicts.length > 0) log('CONFLICT groups (keeper value kept; loser archived):', EJSON.stringify(groupsWithConflicts.slice(0, 10).map((p) => ({ key: p.key, conflicts: p.conflicts }))));
    log('DRY RUN complete. Review the manifest, then: node scripts/migrate-catalogasset-dedupe.js --execute --manifest ' + manifestPath);
    await client.close();
    return;
  }

  // ---------- Phase 4: WRITE (consumes the reviewed manifest) ----------
  if (!MANIFEST_IN) {
    await fatal(client, 5, '--execute requires --manifest <path-to-reviewed-dry-run-manifest>. Run the dry run first, review it, then pass it back.');
  }
  const manifest = EJSON.parse(fs.readFileSync(MANIFEST_IN, 'utf8'));
  if (manifest.coll !== COLL) await fatal(client, 5, `manifest coll ${manifest.coll} != ${COLL}`);
  if (manifest.review.length > 0) {
    await fatal(client, 5, `manifest has ${manifest.review.length} review groups. Resolve + regenerate before execute.`);
  }
  log(`Loaded reviewed manifest ${MANIFEST_IN}: ${manifest.process.length} groups to process.`);

  // Second pre-write idle gate (Codex #3): re-check no sync started since
  // preflight, immediately before any write.
  const recent2 = await db.collection('CatalogProduct')
    .find({ syncedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } }).limit(1).toArray();
  if (recent2.length > 0) {
    await fatal(client, 3, 'a CatalogProduct synced within 5 min at pre-write gate — a pullFromFuga is active. Run inside an enforced maintenance window.');
  }

  const archive = db.collection(ARCHIVE_COLL);
  let mergedGroups = 0, deleted = 0, mergedFields = 0;

  for (const item of manifest.process) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const keeper = await coll.findOne({ _id: item.keeper }, { session });
        if (!keeper) throw new Error(`keeper ${item.keeper} vanished since manifest`);
        if (!(keeper.productId instanceof ObjectId)) throw new Error(`keeper ${item.keeper} productId no longer ObjectId — manifest stale`);
        const loserIds = item.losers.map((l) => l._id);
        const losers = await coll.find({ _id: { $in: loserIds }, productId: { $type: 'string' } }, { session }).toArray();
        if (losers.length !== loserIds.length) {
          throw new Error(`loser drift for ${item.key}: manifest ${loserIds.length} vs live string-typed ${losers.length} — re-run dry run`);
        }

        await archive.insertMany(
          losers.map((l) => ({ ...l, _archivedFrom: COLL, _migrationTs: TS, _keeperId: item.keeper, _manifestKey: item.key })),
          { session },
        );

        // Recompute the plan with the SAME helper the reviewed manifest used,
        // then assert it still matches the frozen planHash. If live data
        // diverged from what the human reviewed, abort this group (txn rolls
        // back the archive insert) rather than apply an unreviewed merge.
        if (typeof item.planHash !== 'string') {
          throw new Error(`manifest item ${item.key} missing planHash — regenerate the manifest with the current script`);
        }
        const livePlan = computeMergePlan(keeper, losers);
        if (livePlan.planHash !== item.planHash) {
          throw new Error(`merge-plan drift for ${item.key}: live plan != reviewed manifest planHash — re-run dry run and re-review`);
        }
        if (livePlan.patchKeys.length > 0) {
          const patch = { ...livePlan.patch, updatedAt: new Date() };
          await coll.updateOne({ _id: item.keeper }, { $set: patch }, { session });
          mergedFields += livePlan.patchKeys.length;
        }

        const delRes = await coll.deleteMany(
          { _id: { $in: loserIds }, productId: { $type: 'string' } },
          { session },
        );
        if (delRes.deletedCount !== loserIds.length) {
          throw new Error(`delete count ${delRes.deletedCount} != ${loserIds.length} for ${item.key}`);
        }
        deleted += delRes.deletedCount;
        mergedGroups++;
      });
    } finally {
      await session.endSession();
    }
  }
  log(`WRITE: groups=${mergedGroups}, fieldsMerged=${mergedFields}, deleted=${deleted}`);

  // ---------- Phase 5: VERIFY (normalized) ----------
  const afterTotal = await coll.countDocuments();
  const afterString = await coll.countDocuments({ productId: { $type: 'string' } });
  const afterByType = await coll.aggregate([
    { $group: { _id: { $type: '$productId' }, n: { $sum: 1 } } },
  ]).toArray();
  // Normalized duplicate check: group by (fugaId, $toString productId).
  const dupCheck = await coll.aggregate([
    { $group: { _id: { f: '$fugaId', p: { $toString: '$productId' } }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } }, { $count: 'dups' },
  ]).toArray();
  log(`VERIFY: total ${total} -> ${afterTotal} (deleted ${deleted}); string rows now ${afterString}; types ${JSON.stringify(afterByType)}; normalized duplicate-key groups ${dupCheck[0]?.dups || 0}`);
  log(`Archive collection: ${ARCHIVE_COLL} (${deleted} loser docs). Rollback = restore from there or ${backupPath}.`);
  log('DONE. Next: trigger pullFromFuga (fresh cookie) to populate fugaRaw on canonical rows.');

  await client.close();
})().catch(async (e) => {
  console.error('FATAL', e && e.stack || e);
  try { if (client) await client.close(); } catch (_) { /* ignore */ }
  process.exit(1);
});
