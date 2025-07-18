// MongoDB script to make a user admin
// Usage: Run this in MongoDB Shell or as a Node.js script

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-uri-here';
const EMAIL = 'ckalargiros@gmail.com';

async function makeUserAdmin() {
  const { MongoClient } = require('mongodb');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('n3rve-platform');
    const users = db.collection('users');
    
    const result = await users.updateOne(
      { email: EMAIL },
      { 
        $set: { 
          role: 'ADMIN',
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`✅ Successfully updated ${EMAIL} to ADMIN role`);
    } else {
      console.log(`❌ User ${EMAIL} not found or already ADMIN`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

makeUserAdmin();