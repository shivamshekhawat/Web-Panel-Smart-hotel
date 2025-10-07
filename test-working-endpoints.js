#!/usr/bin/env node

const API_BASE_URL = 'https://557fd583d2a4.ngrok-free.app';

async function testWorkingEndpoints() {
  console.log('🧪 Testing Working Endpoints in Detail\n');

  // Test 1: Get All Rooms
  console.log('1. Testing GET /api/rooms');
  try {
    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Get All Reservations
  console.log('2. Testing GET /api/reservations/');
  try {
    const response = await fetch(`${API_BASE_URL}/api/reservations/`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Get All Notifications
  console.log('3. Testing GET /api/notifications');
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Get All Languages
  console.log('4. Testing GET /api/languages/');
  try {
    const response = await fetch(`${API_BASE_URL}/api/languages/`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Create Language (POST test)
  console.log('5. Testing POST /api/languages/ (Create Language)');
  try {
    const testLanguage = {
      language_code: `test_${Date.now()}`,
      language_name: `Test Language ${Date.now()}`
    };
    
    const response = await fetch(`${API_BASE_URL}/api/languages/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(testLanguage)
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Request: ${JSON.stringify(testLanguage, null, 2)}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testWorkingEndpoints().catch(console.error);