# CatalogAsset `fugaRaw` empty — root cause & fix plan

_Authored 2026-05-15. Status: PLAN ONLY — nothing executed. Awaiting approval._

## TL;DR

The track-detail "FUGA Raw Fields" panel is empty for every track for **two
independent reasons**, ranked by impact:

1. **PRIMARY (blocking):** No full `pullFromFuga` has completed since the
   correct asset rows were created on 2026-05-14. Every run aborts early on the
   NanoClaw cookie expiry (`break` at `catalog.service.ts:1514`). So the rows
   the UI reads never get `fugaRaw` written (only 1 of ~1543 has it).
2. **SECONDARY (cleanup / latent risk):** A one-time mass duplication on
   2026-05-14 left ~1544 orphan `CatalogAsset` rows with a `string`-typed
   `productId` that the app's Prisma relation never reads. Plus the
   `@@unique([fugaId, productId])` index declared in schema does not exist in
   Atlas, so a future `product.id` type flip could silently re-duplicate.

The originally-suspected causes (assets endpoint failing, wrapper-shape,
BigInt throw, stale deploy) were all **ruled out** by live in-container probes.

## Evidence (production `n3rve-platform.CatalogAsset`, 2026-05-15)

| createdDay | productId type | count | withFugaRaw |
|---|---|---|---|
| 2026-03-25 | string | 71 | 0 |
| 2026-03-26 | string | 1213 | 0 |
| 2026-03-26 | objectId | 1 | 0 |
| 2026-03-28 | string | 257 | 0 |
| 2026-05-11 | string | 1 | 0 |
| 2026-05-12 | string | 1 | 0 |
| 2026-05-14 | objectId | 1543 | 1 |

- ~1544 `string`-productId rows = the historical originals (Mar–May).
- 1543 `objectId`-productId rows = a single mass run on **2026-05-14** (one per
  real asset).
- The admin read path
  (`findUnifiedProductById` → `prisma.catalogProduct.findUnique({ include: { assets: true } })`)
  returns **only the objectId rows** — verified live: product `this feeling`
  (`6a01e083…21fc`) → relation returns asset `6a058f48…ccd7` (objectId row),
  not the string original `6a01e083…21fd`.
- `fugaRaw` exists on exactly **1** asset row collection-wide.

### Why duplication happened (once)

`upsertAsset` (`catalog.service.ts:1918`):
- line 1919: `product = prisma.catalogProduct.findUnique({ where:{ fugaId } })`
- line 2041: writes `productId: product.id`
- line 2044-2052: `findUnique({ fugaId_productId:{ fugaId, productId: product.id } })`
- line 2058 update existing / line 2060 create new.

`schema.prisma:727` declares `productId String @db.ObjectId`. Before 2026-05-14
the rows were written with `productId` as a plain **string** (legacy import /
earlier code path). On the 2026-05-14 run `product.id` resolved/serialized as
**ObjectId**; `findUnique` (ObjectId-coerced) didn't match the string
originals → `create` ran → 1543 new objectId rows. `@@unique([fugaId,productId])`
(`schema.prisma:782`) is **not enforced** because Prisma+MongoDB never creates
indexes (no `prisma migrate`/`db push` was run for it) → `create` didn't throw.
After 5/14 the objectId rows DO match `findUnique`, so later runs `update`
them — no further duplication. They just never finish (cookie blocker).

## Fix plan

### Part 0 — Unblock the primary cause (operational, no code)

The real reason the UI is empty is **no completed sync**. Independent of any
code change:

1. User refreshes FUGA cookie (`n3rve-portal-login.sh` / NanoClaw) immediately
   before a sync.
2. Trigger `POST /api/catalog/sync/pull-from-fuga` and let it run to
   completion (~28 min for 174 products). Watch for `pullFromFuga complete`.
3. Re-count `CatalogAsset` where `fugaRaw` exists — expect ≈ all objectId rows.

This alone makes the panel populate. It does NOT fix the latent duplication /
missing-index risk — Parts A & B do.

### Part A — Code PR (idempotency + index)

**A1. Create the missing unique index in Atlas.**
`@@unique([fugaId, productId])` must actually exist so duplicates can never
silently recur. Options (decide in review):
- `npx prisma db push` (creates all declared indexes; verify it does not drop
  data — MongoDB `db push` is index/collection-level, low risk, but review the
  planned diff first), OR
- explicit one-off `db.CatalogAsset.createIndex({ fugaId:1, productId:1 }, { unique:true })`
  **after** Part B dedupe (cannot create a unique index while dups exist).
- Order matters: **index creation must come AFTER Part B** or it fails on
  existing duplicates.

**A2. Make `upsertAsset` type-robust.**
Normalize `productId` to a single canonical type before the `findUnique` key
and before write, so the lookup always resolves the real row regardless of how
historical rows were typed. Smallest-scope change: ensure `product.id` is
written/queried consistently (the schema's intended type is ObjectId).
Add a guard: if `findUnique` misses but a row with the same `fugaId` +
same logical product exists, update it instead of blind `create`.

**A3. Verify.** `cd backend && npx jest` (expect 63/63) + `npx tsc --noEmit`
clean. Codex 3-stage cross-validation (Advisory → Eval ≥45/50 → Validate) per
the standing mandate. No prod write from this PR except the index (gated on
Part B completing).

### Part B — Data migration (separate, reviewed, explicit approval to run)

Goal: collapse to one canonical row per real asset, productId = ObjectId,
preserve any `fugaRaw`/relations, then the unique index can be created.

1. **Dry-run script** (read-only): for each `fugaId`, list all rows, their
   `productId` type, `fugaRaw` presence, `createdAt`. Output a migration
   manifest for review. NO writes.
2. **Decision rule** (per `fugaId`): keep the **objectId** row (the one the app
   reads); if it lacks `fugaRaw` but a sibling has it, copy `fugaRaw` over;
   delete the `string`-typed orphans. Edge: assets with only string rows
   (shouldn't exist post-5/14, but handle) → convert productId to ObjectId
   in place rather than delete.
3. **Backup first**: `mongodump` the `CatalogAsset` collection (or Atlas
   snapshot) before any delete.
4. Execute migration with explicit user go-ahead, in a transaction-safe batched
   loop, logging every delete/update.
5. Create the unique index (A1).
6. Re-run `pullFromFuga` (Part 0) on a fresh cookie; verify `fugaRaw` populated
   on the canonical rows and the admin panel renders.

## Risks & rollback

- `prisma db push` could attempt unintended index drops — review the
  `--preview-feature`/dry output before running; prefer explicit `createIndex`.
- Deleting orphan rows is irreversible — `mongodump` backup is mandatory
  pre-step; keep the dump until the next good sync is verified.
- The NanoClaw cookie blocker is orthogonal and will keep biting every long
  sync until separately automated (out of scope here; tracked in
  `project_n3rve_fuga_catalog_sync_2026_05_15.md`).

## Sequencing

Part 0 (verify the symptom is just "no completed sync") →
Part B dry-run + manifest review → backup → Part B execute →
Part A index + code PR → final sync + verify.
