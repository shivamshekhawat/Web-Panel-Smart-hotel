#!/usr/bin/env node

const API_BASE_URL = 'https://cbe3f8b8708a.ngrok-free.app';

async function testAdminSignupEndpoints() {
  console.log('🧪 Testing Admin Signup Endpoints\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const testData = {
    first_name: "Test",
    last_name: "Admin",
    email: `test${Date.now()}@example.com`,
    mobile_number: "9876543210",
    username: `testadmin${Date.now()}`,
    password: "testpass123",
    session_id: "test123"
  };

  console.log('Test Data:', JSON.stringify(testData, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');

  const endpoints = [
    '/api/admin',        // Try singular form first
    '/api/admins',       // Original plural form
    '/api/admin/signup', // Alternative signup endpoint
    '/api/auth/signup'   // Auth-based signup
  ];

  for (const endpoint of endpoints) {
    console.log(`🔍 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(testData),
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get('content-type') || '';
      console.log(`   Content-Type: ${contentType}`);

      if (contentType.includes('text/html')) {
        const htmlText = await response.text();
        console.log(`   ❌ HTML Response (first 100 chars): ${htmlText.substring(0, 100)}...`);
      } else {
        try {
          const data = await response.json();
          console.log(`   Response:`, JSON.stringify(data, null, 2));
          
          if (response.ok) {
            console.log(`   ✅ SUCCESS - Working endpoint found!`);
            return { endpoint, data };
          } else {
            console.log(`   ❌ FAILED - ${data.message || 'Unknown error'}`);
          }
        } catch (parseError) {
          console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('❌ No working admin signup endpoint found');
  return null;
}

// Test login endpoints too
async function testAdminLoginEndpoints() {
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🧪 Testing Admin Login Endpoints\n');

  const loginData = {
    username: "testuser",
    password: "testpass",
    session_id: "test123"
  };

  console.log('Login Test Data:', JSON.stringify(loginData, null, 2));
  console.log('');

  const endpoints = [
    '/api/admin/login',    // Try singular form first
    '/api/admins/login',   // Original plural form
    '/api/auth/login'      // Auth-based login
  ];

  for (const endpoint of endpoints) {
    console.log(`🔍 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(loginData),
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get('content-type') || '';
      console.log(`   Content-Type: ${contentType}`);

      if (contentType.includes('text/html')) {
        const htmlText = await response.text();
        console.log(`   ❌ HTML Response (first 100 chars): ${htmlText.substring(0, 100)}...`);
      } else {
        try {
          const data = await response.json();
          console.log(`   Response:`, JSON.stringify(data, null, 2));
          
          if (response.status === 401) {
            console.log(`   ⚠️  ENDPOINT EXISTS - Got 401 (expected for invalid credentials)`);
          } else if (response.ok) {
            console.log(`   ✅ SUCCESS - Working endpoint found!`);
          } else {
            console.log(`   ❌ FAILED - ${data.message || 'Unknown error'}`);
          }
        } catch (parseError) {
          console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Check server health
async function checkServerHealth() {
  console.log('🏥 Checking Server Health\n');
  
  const healthEndpoints = [
    '/health',
    '/api/health',
    '/status',
    '/api/status',
    '/'
  ];

  for (const endpoint of healthEndpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`   ✅ JSON Response:`, JSON.stringify(data, null, 2));
        } else {
          const text = await response.text();
          console.log(`   ✅ Text Response (first 100 chars): ${text.substring(0, 100)}`);
        }
        break;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

async function runTests() {
  console.log('🚀 ADMIN SIGNUP API DIAGNOSTIC TEST');
  console.log('===================================');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  await checkServerHealth();
  await testAdminSignupEndpoints();
  await testAdminLoginEndpoints();
  
  console.log('\n📋 RECOMMENDATIONS:');
  console.log('1. Check if the backend server is running');
  console.log('2. Verify the correct API endpoint paths');
  console.log('3. Ensure the server returns JSON responses');
  console.log('4. Check server logs for detailed error information');
  console.log('5. Verify CORS configuration if needed');
}

runTests().catch(console.error);