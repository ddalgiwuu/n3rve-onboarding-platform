const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../backend/.env' });

async function updateUserToAdmin() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://n3rve:n3rve2024!@n3rve-cluster.8jggb.mongodb.net/n3rve-onboarding?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('n3rve-onboarding');
    const users = database.collection('User');

    // Update user role to ADMIN
    const result = await users.updateOne(
      { email: 'ckalargiros@gmail.com' },
      { 
        $set: { 
          role: 'ADMIN',
          isProfileComplete: true,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 1) {
      console.log('✅ User ckalargiros@gmail.com has been granted ADMIN privileges');
    } else {
      console.log('❌ User ckalargiros@gmail.com not found in database');
      console.log('The user will be automatically created with ADMIN role on first login');
    }

    // Check if user exists and show current status
    const user = await users.findOne({ email: 'ckalargiros@gmail.com' });
    if (user) {
      console.log('\nCurrent user status:');
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Profile Complete:', user.isProfileComplete);
      console.log('- Active:', user.isActive);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateUserToAdmin();