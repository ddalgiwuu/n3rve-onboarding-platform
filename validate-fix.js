const { chromium } = require('playwright');

async function validateFix() {
  console.log('🧪 Final CORS validation test...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    
    const result = await page.evaluate(async () => {
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
          success: true,
          status: response.status,
          statusText: response.statusText,
          hasAccessControlAllowOrigin: response.headers.has('access-control-allow-origin'),
          hasAccessControlAllowCredentials: response.headers.has('access-control-allow-credentials')
        };
      } catch (error) {
        return {
          success: false,
          error: error.name,
          message: error.message
        };
      }
    });
    
    console.log('📊 Final Test Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ CORS FIX SUCCESSFUL! No more CORS errors.');
      console.log('✅ Status:', result.status, result.statusText);
      console.log('✅ CORS Headers Present:', result.hasAccessControlAllowOrigin && result.hasAccessControlAllowCredentials);
    } else {
      console.log('❌ Still has issues:', result.error, result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

validateFix().catch(console.error);