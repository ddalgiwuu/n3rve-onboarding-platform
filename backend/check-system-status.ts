import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkSystemStatus() {
  console.log('=== N3RVE Platform System Status Check ===\n');
  
  // 1. Environment Configuration
  console.log('1️⃣ Environment Configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'not set'}`);
  console.log(`   PORT: ${process.env.PORT || '3001'}`);
  
  // 2. MongoDB Connection
  console.log('\n2️⃣ MongoDB Connection Status:');
  try {
    await prisma.$connect();
    console.log('   ✅ Successfully connected to MongoDB');
    
    // Test query
    const testResult = await prisma.$runCommandRaw({ ping: 1 });
    console.log('   ✅ MongoDB ping successful');
    
  } catch (error) {
    console.error('   ❌ MongoDB connection failed:', error.message);
  }
  
  // 3. Database Statistics
  console.log('\n3️⃣ Database Statistics:');
  try {
    // Users
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    console.log(`   👥 Users: ${userCount} total (${adminCount} admins)`);
    
    // Submissions
    const submissionCount = await prisma.submission.count();
    const pendingCount = await prisma.submission.count({ where: { status: 'PENDING' } });
    const approvedCount = await prisma.submission.count({ where: { status: 'APPROVED' } });
    const rejectedCount = await prisma.submission.count({ where: { status: 'REJECTED' } });
    console.log(`   📤 Submissions: ${submissionCount} total`);
    console.log(`      - Pending: ${pendingCount}`);
    console.log(`      - Approved: ${approvedCount}`);
    console.log(`      - Rejected: ${rejectedCount}`);
    
    // Recent submissions
    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    
    if (recentSubmissions.length > 0) {
      console.log('\n   📋 Recent Submissions:');
      recentSubmissions.forEach((sub, index) => {
        console.log(`      ${index + 1}. ${sub.albumTitle} by ${sub.artistName || 'Unknown'}`);
        console.log(`         - Submitter: ${sub.submitterName} (${sub.submitterEmail})`);
        console.log(`         - Status: ${sub.status}`);
        console.log(`         - Created: ${sub.createdAt.toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('   ❌ Failed to fetch database statistics:', error.message);
  }
  
  // 4. Check EC2 connectivity (if on local machine)
  console.log('\n4️⃣ EC2 Instance Check:');
  const ec2Host = 'ec2-52-79-97-228.ap-northeast-2.compute.amazonaws.com';
  try {
    const { stdout } = await execAsync(`ping -c 1 -W 2 ${ec2Host}`);
    console.log(`   ✅ EC2 instance is reachable`);
  } catch (error) {
    console.log(`   ❌ EC2 instance is not reachable (${ec2Host})`);
  }
  
  // 5. Check production API
  console.log('\n5️⃣ Production API Check:');
  try {
    const response = await fetch('https://n3rve-onboarding.com/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Production API is running');
      console.log(`   Status: ${JSON.stringify(data)}`);
    } else {
      console.log(`   ❌ Production API returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ Failed to reach production API:', error.message);
  }
  
  await prisma.$disconnect();
  console.log('\n✅ System check completed');
}

// Run the check
checkSystemStatus().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});