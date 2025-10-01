// Debug script to check if hotel filtering is working
// Open browser console and run this to see what hotel_id is being used

console.log('=== HOTEL FILTER DEBUG ===');

// Check selected hotel
const selectedHotel = localStorage.getItem('selected_hotel');
if (selectedHotel) {
  const hotel = JSON.parse(selectedHotel);
  console.log('Selected Hotel:', hotel);
  console.log('Hotel ID:', hotel.hotel_id || hotel.id);
} else {
  console.log('❌ No hotel selected in localStorage');
}

// Check API calls in Network tab
console.log('Check Network tab for these API calls:');
console.log('- /api/guests?hotel_id=XX');
console.log('- /api/rooms/XX');
console.log('- /api/reservations?hotel_id=XX');
console.log('- /api/feedback?hotel_id=XX');

// Monitor API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && (url.includes('/api/guests') || url.includes('/api/rooms') || url.includes('/api/reservations') || url.includes('/api/feedback'))) {
    console.log('🔍 API Call:', url);
  }
  return originalFetch.apply(this, args);
};

console.log('✅ Fetch monitoring enabled. Check console for API calls.');