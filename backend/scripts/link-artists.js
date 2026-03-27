/**
 * One-time migration: link existing SavedArtists to CatalogArtists by name (case-insensitive).
 *
 * Idempotent — safe to run multiple times.
 * SavedArtists that already have a catalogArtistId are skipped.
 * CatalogArtists are matched first; if none exists a new one is created.
 *
 * Usage:
 *   node scripts/link-artists.js
 *
 * Requires:
 *   - .env file with DATABASE_URL set to the MongoDB Atlas connection string
 *   - @prisma/client generated (npx prisma generate)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SavedArtist → CatalogArtist link migration...\n');

  // Load all SavedArtists that are not yet linked
  const unlinked = await prisma.savedArtist.findMany({
    where: { catalogArtistId: null },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${unlinked.length} unlinked SavedArtist(s).\n`);

  if (unlinked.length === 0) {
    console.log('Nothing to do. Exiting.');
    return;
  }

  let linked = 0;
  let created = 0;
  let failed = 0;

  for (const saved of unlinked) {
    try {
      // Case-insensitive name match
      let catalog = await prisma.catalogArtist.findFirst({
        where: { name: { equals: saved.name, mode: 'insensitive' } },
        select: { id: true, name: true },
      });

      if (!catalog) {
        // No existing CatalogArtist — create a placeholder
        catalog = await prisma.catalogArtist.create({
          data: {
            fugaId: BigInt(Date.now()),
            name: saved.name,
            type: 'ARTIST',
            labels: [],
            syncedAt: new Date(),
          },
          select: { id: true, name: true },
        });
        created++;
        console.log(`  [CREATE] CatalogArtist "${catalog.name}" (${catalog.id})`);
      } else {
        console.log(`  [MATCH]  CatalogArtist "${catalog.name}" (${catalog.id})`);
      }

      await prisma.savedArtist.update({
        where: { id: saved.id },
        data: { catalogArtistId: catalog.id },
      });

      linked++;
      console.log(`           └─ Linked SavedArtist "${saved.name}" (${saved.id})\n`);
    } catch (err) {
      failed++;
      console.error(`  [ERROR]  Failed to link "${saved.name}" (${saved.id}): ${err.message}\n`);
    }
  }

  console.log('─────────────────────────────────────────');
  console.log(`Done. linked=${linked}  created=${created}  failed=${failed}`);
}

main()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
