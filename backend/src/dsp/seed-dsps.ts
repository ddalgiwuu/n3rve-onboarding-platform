import { PrismaClient, ServiceType } from '@prisma/client';
import { DSP_SEED_DATA } from './dsp-seed-data';

const prisma = new PrismaClient();

async function seedDSPs() {
  console.log('🌱 Starting DSP seeding...');
  
  try {
    // Determine service type based on name/description
    const determineServiceType = (name: string, description?: string): ServiceType => {
      const text = `${name} ${description || ''}`.toLowerCase();
      
      // All non-standard types use OTHER as per Prisma schema
      if (text.includes('spotify')) return ServiceType.SPOTIFY;
      if (text.includes('apple')) return ServiceType.APPLE_MUSIC;
      if (text.includes('youtube')) return ServiceType.YOUTUBE_MUSIC;
      if (text.includes('amazon')) return ServiceType.AMAZON_MUSIC;
      if (text.includes('tidal')) return ServiceType.TIDAL;
      if (text.includes('deezer')) return ServiceType.DEEZER;
      
      return ServiceType.OTHER;
    };

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const dspData of DSP_SEED_DATA) {
      try {
        const serviceType: ServiceType = (dspData.serviceType as ServiceType) || determineServiceType(dspData.name, dspData.description);
        
        const result = await prisma.dSP.upsert({
          where: { name: dspData.name },
          update: {
            serviceType,
            logoUrl: (dspData as any).logoUrl,
            websiteUrl: (dspData as any).websiteUrl,
            apiEndpoint: (dspData as any).apiEndpoint,
            territories: dspData.territories || [],
            marketShare: (dspData as any).marketShare,
            features: (dspData as any).features,
            isActive: true,
          },
          create: {
            name: dspData.name,
            serviceType,
            logoUrl: (dspData as any).logoUrl,
            websiteUrl: (dspData as any).websiteUrl,
            apiEndpoint: (dspData as any).apiEndpoint,
            territories: dspData.territories || [],
            marketShare: (dspData as any).marketShare,
            features: (dspData as any).features,
            isActive: true,
          }
        });

        if (result.createdAt === result.updatedAt) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        console.error(`❌ Error seeding DSP ${dspData.name}:`, error);
        errors++;
      }
    }

    console.log('✅ DSP seeding completed!');
    console.log(`📊 Results: ${created} created, ${updated} updated, ${errors} errors`);
    
    // Get statistics
    const stats = await prisma.dSP.groupBy({
      by: ['serviceType'],
      _count: true,
    });
    
    console.log('\n📈 DSPs by Service Type:');
    stats.forEach(stat => {
      console.log(`   ${stat.serviceType}: ${stat._count}`);
    });
    
    const total = await prisma.dSP.count();
    console.log(`\n📌 Total DSPs in database: ${total}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedDSPs().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});