const { chromium } = require('playwright');

async function testCORS() {
  console.log('🚀 Starting browser test for CORS issues...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show the browser for debugging
    slowMo: 1000     // Slow down for visibility
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log('🔍 Console:', msg.type(), '-', msg.text());
  });
  
  // Capture network failures
  page.on('requestfailed', request => {
    console.log('❌ Request Failed:', request.url(), request.failure().errorText);
  });
  
  // Capture responses
  page.on('response', response => {
    if (response.url().includes('saved-artists')) {
      console.log('📡 API Response:', response.url(), 'Status:', response.status());
      response.headers().then ? response.headers().then(headers => {
        console.log('📋 Headers:', headers);
      }) : console.log('📋 Headers:', response.headers());
    }
  });
  
  try {
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('🔍 Looking for saved artists functionality...');
    
    // Try to find and click elements that might trigger saved artists calls
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on page`);
    
    // Try to execute a fetch call directly in the browser context
    console.log('🧪 Testing direct fetch call...');
    const fetchResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/saved-artists/artists', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: await response.text()
        };
      } catch (error) {
        return {
          error: error.name,
          message: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('📊 Fetch Result:', JSON.stringify(fetchResult, null, 2));
    
    // Also test the direct API call
    console.log('🧪 Testing direct API call...');
    const directResult = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/saved-artists/artists', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: await response.text()
        };
      } catch (error) {
        return {
          error: error.name,
          message: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('📊 Direct API Result:', JSON.stringify(directResult, null, 2));
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser is open for manual inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(30000); // Wait 30 seconds
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await browser.close();
  }
}

testCORS().catch(console.error);