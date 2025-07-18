const { MongoClient } = require('mongodb');

// MongoDB Atlas URI - 환경 변수에서 가져오기
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://USERNAME:PASSWORD@n3rve-db.ie22loh.mongodb.net/?retryWrites=true&w=majority&appName=N3RVE-DB';

async function checkMongoDBData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    // 데이터베이스 목록 확인
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    console.log('📂 Available databases:');
    dbList.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // n3rve-platform 데이터베이스 사용
    const db = client.db('n3rve-platform');
    
    // Check users collection
    console.log('📊 Users Collection:');
    const usersCount = await db.collection('users').countDocuments();
    console.log(`   Total users: ${usersCount}`);
    
    const sampleUsers = await db.collection('users').find({}).limit(3).toArray();
    if (sampleUsers.length > 0) {
      console.log('   Sample users:');
      sampleUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name || 'No name'}) - Role: ${user.role}`);
      });
    }
    
    // Check submissions collection
    console.log('\n📊 Submissions Collection:');
    const submissionsCount = await db.collection('submissions').countDocuments();
    console.log(`   Total submissions: ${submissionsCount}`);
    
    const sampleSubmissions = await db.collection('submissions').find({}).limit(3).toArray();
    if (sampleSubmissions.length > 0) {
      console.log('   Sample submissions:');
      sampleSubmissions.forEach(sub => {
        console.log(`   - ${sub.albumTitle || sub.album?.title || 'No title'} - Status: ${sub.status}`);
      });
    }
    
    // Check artists collection (if exists)
    console.log('\n📊 Artists Collection:');
    const artistsCount = await db.collection('artists').countDocuments();
    console.log(`   Total artists: ${artistsCount}`);
    
    // Check saved artists collections
    console.log('\n📊 Saved Artists Collections:');
    const savedArtistsCount = await db.collection('savedartists').countDocuments();
    console.log(`   Total saved artists: ${savedArtistsCount}`);
    
    const savedContributorsCount = await db.collection('savedcontributors').countDocuments();
    console.log(`   Total saved contributors: ${savedContributorsCount}`);
    
    // List all collections
    console.log('\n📂 All Collections in Database:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please update the MONGODB_URI with your actual credentials');
  } finally {
    await client.close();
    console.log('\n🔚 Connection closed');
  }
}

checkMongoDBData();