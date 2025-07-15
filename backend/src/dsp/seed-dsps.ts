import { PrismaClient, ServiceType } from '@prisma/client';
import { DSP_SEED_DATA } from './dsp-seed-data';

const prisma = new PrismaClient();

async function seedDSPs() {
  console.log('🌱 Starting DSP seeding...');
  
  try {
    // Determine service type based on name/description
    const determineServiceType = (name: string, description?: string): ServiceType => {
      const text = `${name} ${description || ''}`.toLowerCase();
      
      if (text.includes('fingerprint')) return ServiceType.FINGERPRINTING;
      if (text.includes('video')) return ServiceType.VIDEO;
      if (text.includes('download')) return ServiceType.DOWNLOAD;
      if (text.includes('radio')) return ServiceType.RADIO;
      if (text.includes('facebook') || text.includes('tiktok')) return ServiceType.SOCIAL;
      if (text.includes('streaming') || text.includes('music')) return ServiceType.STREAMING;
      
      return ServiceType.OTHER;
    };

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const dspData of DSP_SEED_DATA) {
      try {
        const serviceType: ServiceType = (dspData.serviceType as ServiceType) || determineServiceType(dspData.name, dspData.description);
        
        const result = await prisma.dSP.upsert({
          where: { dspId: dspData.dspId },
          update: {
            name: dspData.name,
            code: dspData.code,
            description: dspData.description,
            contactEmail: dspData.contactEmail,
            territories: dspData.territories,
            availability: dspData.availability,
            isHD: dspData.isHD || false,
            serviceType,
            isActive: true,
          },
          create: {
            ...dspData,
            serviceType,
            isHD: dspData.isHD || false,
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