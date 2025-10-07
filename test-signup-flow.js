#!/usr/bin/env node

const API_BASE_URL = 'https://557fd583d2a4.ngrok-free.app';

async function testSignupFlow() {
  console.log('🧪 Testing Complete Signup Flow\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  // Step 1: Test Admin Signup
  console.log('Step 1: Testing Admin Signup');
  console.log('=' .repeat(40));

  const signupData = {
    first_name: "Test",
    last_name: "Admin",
    email: `test${Date.now()}@example.com`,
    mobile_number: "9876543210",
    username: `testadmin${Date.now()}`,
    password: "testpass123",
    session_id: "test123"
  };

  console.log('Signup Data:', JSON.stringify(signupData, null, 2));

  const endpoints = ['/api/admin', '/api/admins', '/api/admin/signup', '/api/auth/signup'];
  let signupSuccess = false;
  let authToken = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Trying signup endpoint: ${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(signupData),
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/html')) {
        console.log(`   ❌ HTML Response - endpoint not available`);
        continue;
      }

      const data = await response.json();
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log(`   ✅ Signup successful!`);
        signupSuccess = true;
        break;
      } else {
        console.log(`   ❌ Signup failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  if (!signupSuccess) {
    console.log('\n❌ Admin signup failed on all endpoints');
    return;
  }

  // Step 2: Test Admin Login
  console.log('\n\nStep 2: Testing Admin Login');
  console.log('=' .repeat(40));

  const loginData = {
    username: signupData.username,
    password: signupData.password,
    session_id: signupData.session_id
  };

  const loginEndpoints = ['/api/admin/login', '/api/admins/login', '/api/auth/login'];
  let loginSuccess = false;

  for (const endpoint of loginEndpoints) {
    try {
      console.log(`\n🔍 Trying login endpoint: ${endpoint}`);
      
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
      
      if (contentType.includes('text/html')) {
        console.log(`   ❌ HTML Response - endpoint not available`);
        continue;
      }

      const data = await response.json();
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      
      if (response.ok && data.token) {
        console.log(`   ✅ Login successful! Token received.`);
        authToken = data.token;
        loginSuccess = true;
        break;
      } else {
        console.log(`   ❌ Login failed: ${data.message || 'No token received'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  if (!loginSuccess) {
    console.log('\n❌ Admin login failed on all endpoints');
    return;
  }

  // Step 3: Test Hotel Check
  console.log('\n\nStep 3: Testing Hotel Check');
  console.log('=' .repeat(40));

  try {
    console.log('🔍 Checking admin hotels...');
    
    const response = await fetch(`${API_BASE_URL}/api/hotels/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const hotels = await response.json();
      console.log(`   Hotels found:`, JSON.stringify(hotels, null, 2));
      
      if (Array.isArray(hotels) && hotels.length === 0) {
        console.log(`   ✅ No hotels found - should redirect to create hotel`);
      } else if (Array.isArray(hotels) && hotels.length === 1) {
        console.log(`   ✅ One hotel found - should redirect to dashboard`);
      } else {
        console.log(`   ⚠️  Multiple hotels found - unusual case`);
      }
    } else {
      const errorData = await response.json();
      console.log(`   ❌ Hotel check failed: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking hotels: ${error.message}`);
  }

  // Summary
  console.log('\n\n📋 SIGNUP FLOW SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Admin Signup: ${signupSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Admin Login: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Token Received: ${authToken ? 'YES' : 'NO'}`);
  
  if (signupSuccess && loginSuccess && authToken) {
    console.log('\n🎉 COMPLETE FLOW WORKING!');
    console.log('\nExpected behavior after signup:');
    console.log('1. Admin signs up successfully');
    console.log('2. Auto-login happens');
    console.log('3. System checks for hotels');
    console.log('4. If no hotels: redirect to /create-hotel');
    console.log('5. If 1 hotel: redirect to /hotel/{id}/dashboard');
  } else {
    console.log('\n❌ FLOW INCOMPLETE - Check API endpoints');
  }
}

testSignupFlow().catch(console.error);