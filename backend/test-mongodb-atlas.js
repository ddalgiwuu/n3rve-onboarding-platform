const { MongoClient } = require('mongodb');

// MongoDB Atlas URI 설정 필요
// Format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
// Based on your screenshot, the cluster is: cluster0.hhx0p.mongodb.net
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster0.hhx0p.mongodb.net/n3rve?retryWrites=true&w=majority';

async function testMongoDBAtlas() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Get database
    const db = client.db();
    console.log(`📁 Using database: ${db.databaseName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check users
    const usersCollection = db.collection('User');
    const userCount = await usersCollection.countDocuments();
    console.log(`\n👥 Total users: ${userCount}`);
    
    if (userCount > 0) {
      const sampleUsers = await usersCollection.find({}).limit(3).toArray();
      console.log('Sample users:');
      sampleUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    // Check artists
    const artistsCollection = db.collection('Artist');
    const artistCount = await artistsCollection.countDocuments();
    console.log(`\n🎤 Total artists: ${artistCount}`);
    
    if (artistCount > 0) {
      const sampleArtists = await artistsCollection.find({}).limit(3).toArray();
      console.log('Sample artists:');
      sampleArtists.forEach(artist => {
        console.log(`  - ${artist.artistName} (${artist.artistNameEng || 'No English name'})`);
      });
    }
    
    // Check submissions
    const submissionsCollection = db.collection('Submission');
    const submissionCount = await submissionsCollection.countDocuments();
    console.log(`\n📤 Total submissions: ${submissionCount}`);
    
    if (submissionCount > 0) {
      const recentSubmissions = await submissionsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();
      console.log('Recent submissions:');
      recentSubmissions.forEach(sub => {
        console.log(`  - ${sub.albumTitle} by ${sub.mainArtist?.artistName || 'Unknown'} - Status: ${sub.status}`);
      });
    }
    
    // Check submission stats by status
    const statusCounts = await submissionsCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n📊 Submissions by status:');
    statusCounts.forEach(status => {
      console.log(`  - ${status._id}: ${status.count}`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
  } finally {
    await client.close();
    console.log('\n🔚 Connection closed');
  }
}

// Instructions
console.log('=== MongoDB Atlas Connection Test ===');
console.log('Please set MONGODB_ATLAS_URI environment variable or update the script with your MongoDB Atlas URI');
console.log('Example: MONGODB_ATLAS_URI="mongodb+srv://username:password@cluster.mongodb.net/n3rve?retryWrites=true&w=majority" node test-mongodb-atlas.js\n');

if (MONGODB_URI.includes('USERNAME:PASSWORD')) {
  console.log('⚠️  Please update MONGODB_URI with your actual MongoDB Atlas credentials');
  console.log('   or set MONGODB_ATLAS_URI environment variable');
  console.log('\nExample:');
  console.log('MONGODB_ATLAS_URI="mongodb+srv://your-username:your-password@cluster0.hhx0p.mongodb.net/n3rve?retryWrites=true&w=majority" node test-mongodb-atlas.js');
  process.exit(1);
}

testMongoDBAtlas();