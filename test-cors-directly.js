#!/usr/bin/env node
// Direct CORS test using Node.js fetch

const testCorsDirectly = async () => {
  console.log('🧪 Testing CORS Configuration for N3RVE Platform');
  console.log('📍 Testing from origin: localhost (simulating browser request)');
  console.log('🎯 Target: http://localhost:3001/api');
  console.log('');

  const tests = [
    {
      name: 'Saved Artists API',
      url: 'http://localhost:3001/api/saved-artists/artists',
      expectedStatus: 401,
      description: 'Should return 401 with proper CORS headers'
    },
    {
      name: 'Health Check API', 
      url: 'http://localhost:3001/api/health',
      expectedStatus: 200,
      description: 'Should return 200 with health status'
    },
    {
      name: 'Auth Profile API',
      url: 'http://localhost:3001/api/auth/me',
      expectedStatus: 401,
      description: 'Should return 401 without authentication'
    }
  ];

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`📝 Description: ${test.description}`);
    console.log(`🌐 URL: ${test.url}`);
    
    try {
      // Simulate a browser request with Origin header
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000',
          'Content-Type': 'application/json'
        }
      });

      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-expose-headers': response.headers.get('access-control-expose-headers'),
        'vary': response.headers.get('vary')
      };

      const data = await response.json().catch(() => ({}));

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      // Check CORS headers
      const corsWorking = corsHeaders['access-control-allow-origin'] === 'http://localhost:3000';
      const statusExpected = response.status === test.expectedStatus;
      
      if (corsWorking && statusExpected) {
        console.log('✅ RESULT: SUCCESS - CORS working properly!');
      } else if (corsWorking && !statusExpected) {
        console.log('⚠️  RESULT: CORS OK, Unexpected status (not necessarily bad)');
      } else {
        console.log('❌ RESULT: CORS issue detected!');
      }

      console.log('🔧 CORS Headers:');
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) {
          console.log(`   ${key}: ${value}`);
        }
      });

      if (Object.keys(data).length > 0) {
        console.log('📄 Response Data:');
        console.log(`   ${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      if (error.message.includes('fetch is not defined')) {
        console.log('❌ RESULT: Node.js version does not support fetch API');
        console.log('💡 Solution: Use browser test instead, or upgrade to Node 18+');
      } else {
        console.log(`❌ RESULT: Network error - ${error.message}`);
      }
    }
  }

  console.log('\n🎯 SUMMARY:');
  console.log('If you see "access-control-allow-origin: http://localhost:3000" in the headers above,');
  console.log('then CORS is configured correctly and working properly!');
  console.log('');
  console.log('Any 401 Unauthorized responses are EXPECTED and indicate that:');
  console.log('1. ✅ The API endpoints exist and are reachable');
  console.log('2. ✅ CORS is allowing the requests through');
  console.log('3. ✅ Authentication is required (as designed)');
  console.log('');
  console.log('The next step is to implement proper authentication in the frontend.');
};

testCorsDirectly().catch(console.error);