// Script to make ckalargiros@gmail.com an admin
// Run with: node scripts/set-admin-ckalargiros.js

const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://ryan:***REDACTED***@n3rve-db.ie22loh.mongodb.net/?retryWrites=true&w=majority&appName=N3RVE-DB';
const EMAIL = 'ckalargiros@gmail.com';

async function setAdminRole() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    // Connect to the correct database
    const db = client.db('n3rve-platform');
    const users = db.collection('User'); // Note: collection name is 'User' with capital U
    
    // First, let's check the current user data
    const user = await users.findOne({ email: EMAIL });
    
    if (!user) {
      console.log(`❌ User ${EMAIL} not found in database`);
      
      // List all users to help debug
      const allUsers = await users.find({}).toArray();
      console.log('\n📋 All users in database:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (role: ${u.role})`);
      });
      return;
    }
    
    console.log(`\n👤 Current user data:`, {
      email: user.email,
      name: user.name,
      currentRole: user.role,
      isActive: user.isActive
    });
    
    // Update to ADMIN role (try both uppercase and lowercase to be sure)
    const result = await users.updateOne(
      { email: EMAIL },
      { 
        $set: { 
          role: 'ADMIN',
          updatedAt: new Date(),
          isActive: true // Ensure user is active
        } 
      }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`\n✅ Successfully updated ${EMAIL} to ADMIN role`);
      
      // Verify the update
      const updatedUser = await users.findOne({ email: EMAIL });
      console.log(`\n✅ Verified - New role: ${updatedUser.role}`);
    } else if (result.matchedCount === 1) {
      console.log(`\n⚠️  User ${EMAIL} was already ADMIN`);
    } else {
      console.log(`\n❌ Failed to update user role`);
    }
    
    // Show final state
    const finalUser = await users.findOne({ email: EMAIL });
    console.log('\n📌 Final user state:', {
      email: finalUser.email,
      role: finalUser.role,
      isActive: finalUser.isActive
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

console.log('🚀 Starting admin role update for ckalargiros@gmail.com...\n');
setAdminRole();