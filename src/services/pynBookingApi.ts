import config from '../config/environment';

const API_BASE_URL = config.apiBaseUrl;

// PynBooking API interfaces
export interface PynBookingGuest {
  guestId: string;
  guestName: string;
}

export interface PynBookingReservation {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  roomName: string;
  status: string;
  checkIn: boolean;
  guestId: string;
  guestName: string;
  guests: PynBookingGuest[];
}

export interface PynBookingRoomReservation {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  roomName: string;
  status: string;
  checkIn: boolean;
  guestId: string;
  guestName: string;
  guests: PynBookingGuest[];
}

// Helper to get auth token
const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem('auth_token');
    return token?.trim() || null;
  } catch {
    return null;
  }
};

// Build headers for PynBooking API
const buildPynBookingHeaders = (): HeadersInit => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true',
  };
};

// Handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  return response.json();
};

export const pynBookingApi = {
  // Get all reservations
  async getAllReservations(): Promise<PynBookingReservation[]> {
    const response = await fetch(`${API_BASE_URL}/api/pynbooking/reservations`, {
      method: 'GET',
      headers: buildPynBookingHeaders(),
    });
    return handleResponse<PynBookingReservation[]>(response);
  },

  // Get reservation by room number
  async getReservationByRoom(roomNumber: string): Promise<PynBookingRoomReservation> {
    const response = await fetch(`${API_BASE_URL}/api/pynbooking/room/${encodeURIComponent(roomNumber)}`, {
      method: 'GET',
      headers: buildPynBookingHeaders(),
    });
    return handleResponse<PynBookingRoomReservation>(response);
  },

  // Sync reservations (admin only)
  async syncReservations(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/pynbooking/sync`, {
      method: 'GET',
      headers: buildPynBookingHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },
};

export default pynBookingApi;