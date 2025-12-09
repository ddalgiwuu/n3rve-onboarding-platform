import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSavedArtists() {
  console.log('🚀 Starting SavedArtist migration...');

  try {
    // Get all saved artists
    const artists = await prisma.savedArtist.findMany();

    console.log(`Found ${artists.length} artists to migrate`);

    let updated = 0;

    for (const artist of artists) {
      // Update each artist with new FUGA fields (if not already set)
      await prisma.savedArtist.update({
        where: { id: artist.id },
        data: {
          // Set defaults for new fields
          status: artist.status || 'DRAFT',
          completionScore: artist.completionScore || 0,
          releaseCount: artist.releaseCount || 0,
          dspProfiles: artist.dspProfiles || [],
          socialProfiles: artist.socialProfiles || [],
          similarArtists: artist.similarArtists || [],
          missingFields: artist.missingFields || [],

          // Ensure updatedAt is set
          updatedAt: artist.updatedAt || new Date(),
          lastUsed: artist.lastUsed || new Date(),
          createdAt: artist.createdAt || new Date()
        }
      });

      updated++;

      if (updated % 10 === 0) {
        console.log(`Migrated ${updated}/${artists.length} artists...`);
      }
    }

    console.log(`✅ Successfully migrated ${updated} artists`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateSavedArtists()
  .then(() => {
    console.log('🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });
