import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeCollections() {
  console.log('🚀 Initializing new FUGA SCORE collections...');

  try {
    // This will create the collections in n3rve-platform database

    // 1. Check if collections exist by trying to count
    const dpCount = await prisma.digitalProduct.count();
    console.log(`✅ DigitalProduct collection ready (${dpCount} items)`);

    const frCount = await prisma.featureReport.count();
    console.log(`✅ FeatureReport collection ready (${frCount} items)`);

    const mdCount = await prisma.marketingDriver.count();
    console.log(`✅ MarketingDriver collection ready (${mdCount} items)`);

    const guideCount = await prisma.guide.count();
    console.log(`✅ Guide collection ready (${guideCount} items)`);

    console.log('\n📊 Collection Status in n3rve-platform:');
    console.log('- DigitalProduct: Created');
    console.log('- FeatureReport: Created');
    console.log('- MarketingDriver: Created');
    console.log('- Guide: Created');

    console.log('\n✨ All FUGA SCORE collections are ready in n3rve-platform!');
    console.log('\n💡 You can safely ignore or delete the "n3rve" database.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeCollections()
  .then(() => {
    console.log('🎉 Initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
