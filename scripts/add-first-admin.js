const { MongoClient, ObjectId } = require('mongodb');

// MongoDB Atlas URI - 환경 변수에서 가져오기
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function addFirstAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    const db = client.db('n3rve-platform');
    
    // Check if Chris already exists
    const existingUser = await db.collection('users').findOne({ 
      email: 'ckalargiros@gmail.com' 
    });
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      
      // Update to ADMIN if not already
      if (existingUser.role !== 'ADMIN') {
        await db.collection('users').updateOne(
          { _id: existingUser._id },
          { 
            $set: { 
              role: 'ADMIN',
              updatedAt: new Date()
            } 
          }
        );
        console.log('🔧 Updated role to ADMIN');
      }
    } else {
      // Create new admin user
      const newUser = {
        _id: new ObjectId('687a14892ddd53f59d5c0a89'),
        email: 'ckalargiros@gmail.com',
        googleId: '112922265441684984284',
        provider: 'GOOGLE',
        role: 'ADMIN',
        name: 'Chris Kalargiros',
        profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocIimAUzzpKwqi8g83Im0widVgNNpb',
        isActive: true,
        emailVerified: true,
        isProfileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          company: 'N3RVE TEST',
          phone: '5166505615'
        },
        lastLogin: new Date()
      };
      
      await db.collection('users').insertOne(newUser);
      console.log('✅ Created new ADMIN user:', newUser.email);
    }
    
    // Show all users
    console.log('\n📊 All users in database:');
    const allUsers = await db.collection('users').find({}).toArray();
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔚 Connection closed');
  }
}

addFirstAdmin();