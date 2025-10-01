// Temporary frontend filtering utility
// Add this to components that need hotel-specific filtering

const filterByHotel = (data, hotelId) => {
  if (!hotelId || !Array.isArray(data)) return data;
  
  return data.filter(item => {
    // Check various hotel_id fields
    const itemHotelId = item.hotel_id || item.hotelId || item.hotel?.id;
    return String(itemHotelId) === String(hotelId);
  });
};

// Usage in components:
// const filteredGuests = filterByHotel(guestsData, hotelId);
// const filteredRooms = filterByHotel(roomsData, hotelId);
// const filteredReservations = filterByHotel(reservationsData, hotelId);