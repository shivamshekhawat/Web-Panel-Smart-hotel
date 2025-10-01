#!/usr/bin/env node

const API_BASE_URL = 'https://cbe3f8b8708a.ngrok-free.app';

// Test results storage
const results = {
  passed: [],
  failed: [],
  total: 0
};

// Helper function to make API calls
async function testEndpoint(name, method, endpoint, body = null, headers = {}) {
  results.total++;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...headers
  };

  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${API_BASE_URL}${endpoint}`);
    
    const options = {
      method,
      headers: defaultHeaders,
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Server returned HTML instead of JSON');
    }

    let responseData;
    try {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }

    if (response.ok) {
      console.log(`   ✅ SUCCESS`);
      results.passed.push({ name, status: response.status, endpoint });
      return { success: true, data: responseData, status: response.status };
    } else {
      console.log(`   ❌ FAILED: ${responseData.message || 'Unknown error'}`);
      results.failed.push({ 
        name, 
        status: response.status, 
        endpoint, 
        error: responseData.message || 'Unknown error' 
      });
      return { success: false, error: responseData.message || 'Unknown error', status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.failed.push({ 
      name, 
      status: 'Network Error', 
      endpoint, 
      error: error.message 
    });
    return { success: false, error: error.message };
  }
}

// Test authentication endpoints
async function testAuthEndpoints() {
  console.log('\n🔐 TESTING AUTHENTICATION ENDPOINTS');
  console.log('=====================================');

  // Test admin signup
  const signupData = {
    first_name: "Test",
    last_name: "Admin",
    email: `test${Date.now()}@example.com`,
    mobile_number: "9876543210",
    username: `testadmin${Date.now()}`,
    password: "testpass123",
    session_id: "test123"
  };

  const signupResult = await testEndpoint(
    'Admin Signup',
    'POST',
    '/api/admins',
    signupData
  );

  // Test admin login
  const loginData = {
    username: signupData.username,
    password: signupData.password,
    session_id: signupData.session_id
  };

  const loginResult = await testEndpoint(
    'Admin Login',
    'POST',
    '/api/admins/login',
    loginData
  );

  // Test password reset flow
  await testEndpoint(
    'Send OTP for Password Reset',
    'POST',
    '/api/auth/forgot-password',
    { email: signupData.email }
  );

  // Test 2FA endpoints
  await testEndpoint(
    '2FA Send OTP',
    'POST',
    '/api/v1/admin/auth/send-otp',
    { username: signupData.username, password: signupData.password }
  );

  return loginResult.success ? loginResult.data.token : null;
}

// Test hotel management endpoints
async function testHotelEndpoints(token) {
  console.log('\n🏨 TESTING HOTEL MANAGEMENT ENDPOINTS');
  console.log('=====================================');

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Test create hotel
  const hotelData = {
    Name: "Test Hotel",
    Logo_url: "https://example.com/logo.png",
    Established_year: 2020,
    Address: "123 Test Street",
    Service_care_no: "1234567890",
    City: "Test City",
    Country: "Test Country",
    Postal_code: "12345",
    UserName: `hotel${Date.now()}`,
    Password: "hotelpass123"
  };

  const createHotelResult = await testEndpoint(
    'Create Hotel',
    'POST',
    '/api/hotels/signup',
    hotelData,
    authHeaders
  );

  // Test get all hotels
  const hotelsResult = await testEndpoint(
    'Get All Hotels',
    'GET',
    '/api/hotels/',
    null,
    authHeaders
  );

  let hotelId = null;
  if (hotelsResult.success && hotelsResult.data && Array.isArray(hotelsResult.data) && hotelsResult.data.length > 0) {
    hotelId = hotelsResult.data[0].id;
  }

  // Test dashboard endpoint if we have a hotel ID
  if (hotelId) {
    await testEndpoint(
      'Get Hotel Dashboard',
      'GET',
      `/api/hotels/dashboard/${hotelId}`,
      null,
      authHeaders
    );
  }

  return hotelId;
}

// Test room management endpoints
async function testRoomEndpoints(token, hotelId) {
  console.log('\n🏠 TESTING ROOM MANAGEMENT ENDPOINTS');
  console.log('====================================');

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Test create room
  const roomData = {
    hotel_id: hotelId || "1",
    room_number: `${Date.now()}`,
    room_type: "Standard",
    availability: true,
    capacity_adults: 2,
    capacity_children: 1,
    password: "room123"
  };

  const createRoomResult = await testEndpoint(
    'Create Room',
    'POST',
    '/api/rooms/',
    roomData,
    authHeaders
  );

  // Test get all rooms
  await testEndpoint(
    'Get All Rooms',
    'GET',
    '/api/rooms',
    null,
    authHeaders
  );

  // Test get rooms by hotel ID
  if (hotelId) {
    await testEndpoint(
      'Get Rooms by Hotel ID',
      'GET',
      `/api/rooms/${hotelId}`,
      null,
      authHeaders
    );
  }

  let roomId = null;
  if (createRoomResult.success && createRoomResult.data) {
    roomId = createRoomResult.data.id;
  }

  // Test room greeting endpoints
  if (roomId) {
    await testEndpoint(
      'Get Room Greeting',
      'GET',
      `/api/rooms/${roomId}/greeting?language=en`,
      null,
      authHeaders
    );

    await testEndpoint(
      'Update Room Greeting',
      'POST',
      `/api/rooms/${roomId}/greeting`,
      { language: 'en', message: 'Welcome to our hotel!' },
      authHeaders
    );

    await testEndpoint(
      'Get Room Dashboard',
      'GET',
      `/api/rooms/dashboard/${roomId}`,
      null,
      authHeaders
    );
  }

  return roomId;
}

// Test guest management endpoints
async function testGuestEndpoints(token, hotelId) {
  console.log('\n👥 TESTING GUEST MANAGEMENT ENDPOINTS');
  console.log('=====================================');

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Test create guest
  const guestData = {
    first_name: "Test",
    last_name: "Guest",
    email: `guest${Date.now()}@example.com`,
    phone: "9876543210",
    language: "en",
    hotel_id: hotelId || "1"
  };

  const createGuestResult = await testEndpoint(
    'Create Guest',
    'POST',
    '/api/guests',
    guestData,
    authHeaders
  );

  // Test get all guests
  await testEndpoint(
    'Get All Guests',
    'GET',
    '/api/guests',
    null,
    authHeaders
  );

  // Test get guests by hotel ID
  if (hotelId) {
    await testEndpoint(
      'Get Guests by Hotel ID',
      'GET',
      `/api/guests?hotel_id=${hotelId}`,
      null,
      authHeaders
    );
  }

  // Test get guests with rooms
  await testEndpoint(
    'Get Guests with Rooms',
    'GET',
    '/api/guests/with-rooms',
    null,
    authHeaders
  );

  let guestId = null;
  if (createGuestResult.success && createGuestResult.data) {
    guestId = createGuestResult.data.id;
  }

  // Test get guest by ID
  if (guestId) {
    await testEndpoint(
      'Get Guest by ID',
      'GET',
      `/api/guests/${guestId}`,
      null,
      authHeaders
    );
  }

  return guestId;
}

// Test reservation endpoints
async function testReservationEndpoints(token, guestId, roomId) {
  console.log('\n📅 TESTING RESERVATION ENDPOINTS');
  console.log('=================================');

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Test create reservation
  if (guestId && roomId) {
    const reservationData = {
      guest_id: parseInt(guestId),
      room_id: parseInt(roomId),
      check_in_time: new Date().toISOString(),
      check_out_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_checked_in: false
    };

    await testEndpoint(
      'Create Reservation',
      'POST',
      '/api/reservations',
      reservationData,
      authHeaders
    );
  }

  // Test get all reservations
  await testEndpoint(
    'Get All Reservations',
    'GET',
    '/api/reservations/',
    null,
    authHeaders
  );
}

// Test notification endpoints
async function testNotificationEndpoints(token, roomId) {
  console.log('\n🔔 TESTING NOTIFICATION ENDPOINTS');
  console.log('==================================');

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Test send notification
  const notificationData = {
    room_id: roomId || "1",
    message: "Test notification message",
    type: "info"
  };

  await testEndpoint(
    'Send Notification',
    'POST',
    '/api/notifications',
    notificationData,
    authHeaders
  );

  // Test get all notifications
  await testEndpoint(
    'Get All Notifications',
    'GET',
    '/api/notifications',
    null,
    authHeaders
  );
}

// Test language endpoints
async function testLanguageEndpoints(token) {
  console.log('\n🌐 TESTING LANGUAGE ENDPOINTS');
  console.log('==============================');

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Test create language
  const languageData = {
    language_code: "test",
    language_name: "Test Language"
  };

  await testEndpoint(
    'Create Language',
    'POST',
    '/api/languages/',
    languageData,
    authHeaders
  );

  // Test get all languages
  await testEndpoint(
    'Get All Languages',
    'GET',
    '/api/languages/',
    null,
    authHeaders
  );
}

// Test feedback endpoints
async function testFeedbackEndpoints(token) {
  console.log('\n💬 TESTING FEEDBACK ENDPOINTS');
  console.log('==============================');

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Test get all feedback
  await testEndpoint(
    'Get All Feedback',
    'GET',
    '/api/feedback',
    null,
    authHeaders
  );
}

// Test PynBooking endpoints
async function testPynBookingEndpoints(token) {
  console.log('\n📋 TESTING PYNBOOKING ENDPOINTS');
  console.log('===============================');

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Test get all reservations
  await testEndpoint(
    'PynBooking - Get All Reservations',
    'GET',
    '/api/pynbooking/reservations',
    null,
    authHeaders
  );

  // Test sync reservations
  await testEndpoint(
    'PynBooking - Sync Reservations',
    'GET',
    '/api/pynbooking/sync',
    null,
    authHeaders
  );

  // Test get reservation by room (using a test room number)
  await testEndpoint(
    'PynBooking - Get Reservation by Room',
    'GET',
    '/api/pynbooking/room/101',
    null,
    authHeaders
  );
}

// Main test function
async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE API TESTING');
  console.log('======================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test started at: ${new Date().toISOString()}`);

  try {
    // Test authentication endpoints
    const token = await testAuthEndpoints();

    // Test hotel endpoints
    const hotelId = await testHotelEndpoints(token);

    // Test room endpoints
    const roomId = await testRoomEndpoints(token, hotelId);

    // Test guest endpoints
    const guestId = await testGuestEndpoints(token, hotelId);

    // Test reservation endpoints
    await testReservationEndpoints(token, guestId, roomId);

    // Test notification endpoints
    await testNotificationEndpoints(token, roomId);

    // Test language endpoints
    await testLanguageEndpoints(token);

    // Test feedback endpoints
    await testFeedbackEndpoints(token);

    // Test PynBooking endpoints
    await testPynBookingEndpoints(token);

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }

  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  console.log(`Success Rate: ${((results.passed.length / results.total) * 100).toFixed(1)}%`);

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(test => {
      console.log(`   • ${test.name} (${test.status}): ${test.error}`);
    });
  }

  if (results.passed.length > 0) {
    console.log('\n✅ PASSED TESTS:');
    results.passed.forEach(test => {
      console.log(`   • ${test.name} (${test.status})`);
    });
  }

  console.log(`\nTest completed at: ${new Date().toISOString()}`);
}

// Run the tests
runAllTests().catch(console.error);