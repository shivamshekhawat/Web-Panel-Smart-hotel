// api/adminApi.ts
import config from '../config/environment';
import type { RoomDashboardApiResponse } from '../types/roomDashboard';

const API_BASE_URL = config.apiBaseUrl;

// Validate API URL
if (!API_BASE_URL || API_BASE_URL === 'undefined') {
  console.error('API_BASE_URL is not configured. Please set REACT_APP_API_BASE_URL environment variable.');
}

console.log('🔗 Current API_BASE_URL:', API_BASE_URL);

// Storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const ADMIN_INFO_KEY = 'admin_info';

// -------- Types --------
export interface AdminInfo {
  username: string;
  email: string;
  session_id: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  session_id: string;
}

export interface AdminLoginResponse {
  message: string;
  admin: {
    admin_id: number;
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
  };
  token: string;
  session_id: string;
}

export interface CreateHotelPayload {
  Name: string;
  Logo_url: string;
  Established_year: number | string;
  Address: string;
  Service_care_no: string;
  City: string;
  Country: string;
  Postal_code: string;
  UserName: string;
  Password: string;
}

export interface CreateHotelResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, any>;
  c?: string[]; // Validation errors array
  r?: any[]; // Additional response data
  m?: any[]; // Additional messages
}

export interface HotelData {
  id: string;
  name: string;
  logo_url: string;
  established_year: number;
  address: string;
  service_care_no: string;
  city: string;
  country: string;
  postal_code: string;
  username: string;
  password: string;
}

export interface GetAllHotelsResponse {
  success: boolean;
  message: string;
  data?: HotelData[];
  error?: string;
}

export interface AdminSignUpData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  username: string;
  password: string;
  session_id: string;
}

export interface AdminSignUpResponse {
  success: boolean;
  message: string;
  data?: {
    admin_id: string;
    username: string;
    email: string;
  };
  error?: string;
}

export interface UpdateAdminProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface UpdateAdminProfileResponse {
  message: string;
  admin: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

// Room-related interfaces
export interface CreateRoomPayload {
  hotel_id: string;
  room_number: string;
  room_type: string;
  availability: boolean;
  capacity_adults: number;
  capacity_children: number;
  password: string;
}

export interface RoomData {
  id: string;
  hotel_id: string;
  room_number: string;
  room_type: string;
  availability: boolean;
  capacity_adults: number;
  capacity_children: number;
  password: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRoomResponse {
  success: boolean;
  message: string;
  data?: RoomData;
  error?: string;
}

export interface GetAllRoomsResponse {
  success: boolean;
  message: string;
  data?: RoomData[];
  error?: string;
}

// Guest-related interfaces
export interface CreateGuestPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  language: string;
  hotel_id: string;
}

export interface GuestData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  language: string;
  hotel_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGuestResponse {
  success: boolean;
  message: string;
  data?: GuestData;
  error?: string;
}

export interface GetAllGuestsResponse {
  success: boolean;
  message: string;
  data?: GuestData[];
  error?: string;
}

// Guest by ID (API contract from backend)
export interface GuestByIdResponse {
  guest_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  language: string;
  hotel_id: number;
}

// Notification-related interfaces
export interface NotificationData {
  id?: string;
  room_id: string;
  message: string;
  type: string;
  created_time: string;
  is_read: boolean;
}

export interface SendNotificationPayload {
  room_id: string;
  message: string;
  type: string;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  data?: NotificationData;
  error?: string;
}

export interface GetAllNotificationsResponse {
  success: boolean;
  message: string;
  data?: NotificationData[];
  error?: string;
}

// Language-related interfaces
export interface CreateLanguagePayload {
  language_code: string;
  language_name: string;
}

export interface LanguageData {
  id: string;
  language_code: string;
  language_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLanguageResponse {
  success: boolean;
  message: string;
  data?: LanguageData;
  error?: string;
}

export interface GetAllLanguagesResponse {
  success: boolean;
  message: string;
  data?: LanguageData[];
  error?: string;
}

// Dashboard-related interfaces
export interface DashboardData {
  stats: Array<{ label: string; value: string | number; href?: string }>;
  liveRoomStatus: Array<{
    room: string;
    floor: string;
    guest: string;
    mode: string;
    lastAction: string;
    tabletStatus: string;
  }>;
  notifications: Array<{
    id: string | number;
    type: string;
    message: string;
    time: string;
  }>;
}

export interface GetDashboardResponse {
  success: boolean;
  message: string;
  data?: DashboardData;
  error?: string;
}

export interface FeedbackApiItem {
  feedback_id: number;
  reservation_id: number;
  guest_name: string;
  room_number: string;
  rating: number;
  comments: string;
  submitted_time: string; // ISO string
}

// -------- Helpers --------
const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed && trimmed !== 'undefined' && trimmed !== 'null' ? trimmed : null;
  } catch {
    return null;
  }
};

const setAuth = (token: string, info: AdminInfo): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(info));
};

const clearAuth = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_INFO_KEY);
};

const buildHeaders = (withAuth: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Enable this to skip ngrok browser warning
  };

  if (withAuth) {
    const token = getAuthToken();
    if (!token) throw new Error('Token missing. Please login again.');
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
  if (!response.ok) {
    // Check if response is HTML (common when API is down or misconfigured)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new ApiError(response.status, 'Server returned HTML instead of JSON. Please check if the API server is running and accessible.');
    }

    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || defaultError);
  }

  // Check if response is HTML even when status is OK
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new ApiError(200, 'Server returned HTML instead of JSON. Please check if the API server is running and accessible.');
  }

  // Try to parse JSON, but handle empty responses gracefully
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new ApiError(200, 'Server returned empty response. Please check if the API server is running and accessible.');
    }
    return JSON.parse(text);
  } catch (parseError: any) {
    if (parseError instanceof SyntaxError) {
      throw new ApiError(200, 'Server returned invalid JSON. Please check if the API server is running and accessible.');
    }
    throw new ApiError(200, parseError.message || defaultError);
  }
};

// Extract token safely
const extractToken = (data: any, response: Response): string | null => {
  const authHeader = response.headers.get('Authorization') || response.headers.get('authorization');
  const headerToken = authHeader?.replace(/^Bearer\s+/i, '').trim();

  return (
    data?.data?.token ||   // if token wrapped in data
    data?.token ||         // if token at top level
    data?.admin?.token ||  // your backend sends token here
    data?.access_token ||
    data?.jwt ||
    headerToken ||
    null
  );
};

// -------- API Error --------
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// -------- API Service --------
export const adminApi = {
  getToken: getAuthToken,
  clearToken: clearAuth,

  // Admin Signup
  async signUp(adminData: AdminSignUpData): Promise<AdminSignUpResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admins`, {
      method: 'POST',
      headers: buildHeaders(false),
      body: JSON.stringify(adminData),
    });
    return handleResponse<AdminSignUpResponse>(response, 'Signup failed');
  },

  // Admin Login
  async login(credentials: LoginCredentials): Promise<AdminLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admins/login`, {
      method: 'POST',
      headers: buildHeaders(false),
      body: JSON.stringify(credentials),
    });

    const data: any = await handleResponse<AdminLoginResponse>(response, 'Login failed');
    console.log("Login API Response:", data);

    const token = extractToken(data, response);
    console.log("Extracted token:", token);

    if (!token) {
      throw new ApiError(401, 'Token not found in login response');
    }

    const info: AdminInfo = {
      username: data.admin.username,
      email: data.admin.email,
      session_id: data.session_id,
    };

    setAuth(token, info);
    // Persist admin id for profile updates if backend returns it
    try {
      const adminId =
        data?.data?.admin_id ||
        data?.data?.adminId ||
        data?.admin?.admin_id ||
        data?.admin?.id ||
        data?.admin_id ||
        data?.id;
      if (adminId !== undefined && adminId !== null && String(adminId).trim() !== '') {
        localStorage.setItem('currentUserId', String(adminId).trim());
      }
    } catch {}
    return data as AdminLoginResponse;
  },

  // Update Admin Profile
  async updateAdminProfile(adminId: string, data: UpdateAdminProfilePayload): Promise<UpdateAdminProfileResponse> {
    console.log('Updating admin profile with payload:', data);
    console.log('API URL:', `${API_BASE_URL}/api/admin/${adminId}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/${adminId}`, {
        method: 'PUT',
        headers: buildHeaders(true),
        body: JSON.stringify(data),
      });

      const result = await handleResponse<UpdateAdminProfileResponse>(response, 'Update admin profile failed');
      console.log('Update admin profile response:', result);

      return result;
    } catch (error) {
      console.error('Update admin profile API error:', error);
      throw error;
    }
  },

  // Create Hotel (requires login)
  async createHotel(payload: CreateHotelPayload): Promise<CreateHotelResponse> {
    console.log('Creating hotel with payload:', payload);
    console.log('API URL:', `${API_BASE_URL}/api/hotels/signup`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/signup`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await handleResponse<CreateHotelResponse>(response, 'Create hotel failed');
      console.log('Create hotel response:', result);

      return result;
    } catch (error) {
      console.error('Create hotel API error:', error);
      throw error;
    }
  },

  // Get All Hotels (requires login)
  async getAllHotels(): Promise<GetAllHotelsResponse | HotelData[]> {
    console.log('Fetching hotels from:', `${API_BASE_URL}/api/hotels/`);
    const response = await fetch(`${API_BASE_URL}/api/hotels/`, {
      method: 'GET',
      headers: buildHeaders(true),
    });

    // Handle empty responses gracefully for GET requests
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return [];
    }

    // Handle both response formats: wrapped response or direct array
    const data = await handleResponse<any>(response, 'Failed to fetch hotels');

    // If the response is already an array, return it directly
    if (Array.isArray(data)) {
      return data;
    }

    // Otherwise, return the wrapped response format
    return data as GetAllHotelsResponse;
  },

  // Create Room (requires login)
  async createRoom(payload: CreateRoomPayload): Promise<CreateRoomResponse> {
    console.log('Creating room with payload:', payload);
    console.log('API URL:', `${API_BASE_URL}/api/rooms/`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await handleResponse<CreateRoomResponse>(response, 'Create room failed');
      console.log('Create room response:', result);

      return result;
    } catch (error) {
      console.error('Create room API error:', error);
      throw error;
    }
  },

  // Get All Rooms (requires login)
  async getAllRooms(hotel_id?: string | number): Promise<RoomData[]> {
    // If hotel_id is provided, use path param: /api/rooms/:hotelId, else fetch all rooms
    const raw = hotel_id !== undefined && hotel_id !== null ? String(hotel_id).trim() : '';
    const isNumeric = raw !== '' && /^\d+$/.test(raw);
    const url = isNumeric
      ? `${API_BASE_URL}/api/rooms/${encodeURIComponent(raw)}`
      : `${API_BASE_URL}/api/rooms`;

    console.log('Fetching rooms from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(true),
    });

    // Handle empty responses gracefully for GET requests
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return [];
    }

    // Normalize all possible backend formats to a RoomData[]
    const data = await handleResponse<any>(response, 'Failed to fetch rooms');

    if (Array.isArray(data)) return data as RoomData[];
    if (Array.isArray(data?.response)) return data.response as RoomData[]; // { status, response }
    if (Array.isArray(data?.data)) return data.data as RoomData[];         // { success, data }

    return [] as RoomData[];
  },

  // Create Guest (requires login)
  async createGuest(payload: CreateGuestPayload): Promise<CreateGuestResponse> {
    console.log('Creating guest with payload:', payload);
    console.log('API URL:', `${API_BASE_URL}/api/guests`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/guests`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await handleResponse<CreateGuestResponse>(response, 'Create guest failed');
      console.log('Create guest response:', result);

      return result;
    } catch (error) {
      console.error('Create guest API error:', error);
      throw error;
    }
  },

  // Get All Guests (requires login)
  async getAllGuests(hotel_id?: string): Promise<GetAllGuestsResponse | GuestData[]> {
    const url = hotel_id
      ? `${API_BASE_URL}/api/guests?hotel_id=${encodeURIComponent(hotel_id)}`
      : `${API_BASE_URL}/api/guests`;
    console.log('Fetching guests from:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(true),
    });

    // Handle empty responses gracefully for GET requests
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return [];
    }

    // Handle both response formats: wrapped response or direct array
    const data = await handleResponse<any>(response, 'Failed to fetch guests');
    // If the response is already an array, return it directly
    if (Array.isArray(data)) {
      return data;
    }
    // Otherwise, return the wrapped response format
    return data as GetAllGuestsResponse;
  },

  // Get Guest by ID
  async getGuestById(guestId: string | number): Promise<GuestByIdResponse> {
    const url = `${API_BASE_URL}/api/guests/${encodeURIComponent(String(guestId))}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(true),
    });
    return handleResponse<GuestByIdResponse>(response, 'Failed to fetch guest');
  },

  // Send Notification (requires login)
  async sendNotification(payload: SendNotificationPayload): Promise<SendNotificationResponse> {
    console.log('Sending notification with payload:', payload);
    console.log('API URL:', `${API_BASE_URL}/api/notifications`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await handleResponse<SendNotificationResponse>(response, 'Send notification failed');
      console.log('Send notification response:', result);

      return result;
    } catch (error) {
      console.error('Send notification API error:', error);
      throw error;
    }
  },

  // Get All Notifications (requires login)
  async getAllNotifications(): Promise<GetAllNotificationsResponse | NotificationData[]> {
    console.log('Fetching notifications from:', `${API_BASE_URL}/api/notifications`);
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      method: 'GET',
      headers: buildHeaders(true),
    });

    // Handle empty responses gracefully for GET requests
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return [];
    }

    // Handle both response formats: wrapped response or direct array
    const data = await handleResponse<any>(response, 'Failed to fetch notifications');

    // If the response is already an array, return it directly
    if (Array.isArray(data)) {
      return data;
    }

    // Otherwise, return the wrapped response format
    return data as GetAllNotificationsResponse;
  },

  // Create Language (requires login)
  async createLanguage(payload: CreateLanguagePayload): Promise<CreateLanguageResponse> {
    console.log('Creating language with payload:', payload);
    console.log('API URL:', `${API_BASE_URL}/api/languages/`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/languages/`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await handleResponse<CreateLanguageResponse>(response, 'Create language failed');
      console.log('Create language response:', result);

      return result;
    } catch (error) {
      console.error('Create language API error:', error);
      throw error;
    }
  },

  // Get All Languages (requires login)
  async getAllLanguages(): Promise<GetAllLanguagesResponse | LanguageData[]> {
    console.log('Fetching languages from:', `${API_BASE_URL}/api/languages/`);
    const response = await fetch(`${API_BASE_URL}/api/languages/`, {
      method: 'GET',
      headers: buildHeaders(true),
    });

    // Handle empty responses gracefully for GET requests
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return [];
    }

    // Handle both response formats: wrapped response or direct array
    const data = await handleResponse<any>(response, 'Failed to fetch languages');

    // If the response is already an array, return it directly
    if (Array.isArray(data)) {
      return data;
    }

    // Otherwise, return the wrapped response format
    return data as GetAllLanguagesResponse;
  },

  // Reservations
  async createReservation(payload: {
    guest_id: number;
    room_id: number;
    check_in_time: string; // ISO
    check_out_time: string; // ISO
    is_checked_in?: boolean;
  }): Promise<{
    reservation_id: number;
    guest_id: number;
    room_id: number;
    check_in_time: string;
    check_out_time: string;
    is_checked_in: boolean;
  }> {
    const url = `${API_BASE_URL}/api/reservations`;
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        ...payload,
        is_checked_in: payload.is_checked_in ?? false,
      }),
    });
    return handleResponse(response, 'Failed to create reservation');
  },

  /**
   * Fetch dashboard data for a hotel
   */
  async getDashboard(hotelId: number): Promise<GetDashboardResponse> {
    console.log(hotelId);
    const url = `${API_BASE_URL}/api/hotels/dashboard/${hotelId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(true),
    });

    // Handle empty responses gracefully for GET requests
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, message: 'No dashboard data available', data: undefined };
    }

    return handleResponse<GetDashboardResponse>(response, 'Failed to fetch dashboard data');
  },

  async getAllFeedback(): Promise<FeedbackApiItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'GET',
      headers: buildHeaders(true),
    });

    // Handle empty responses gracefully for GET requests
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return [];
    }

    const data = await handleResponse<any>(response, 'Failed to fetch feedback');

    // Handle all possible formats
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.response)) return data.response; // your backend case

    return [];
  },

  /**
   * Get greeting message for a room
   * GET /api/rooms/:roomId/greeting?language=en
   */
  async getRoomGreeting(
    roomId: string | number,
    language: string = 'en'
  ): Promise<{ status: number; roomNumber: string; message: string }> {
    const url = `${API_BASE_URL}/api/rooms/${encodeURIComponent(String(roomId))}/greeting?language=${encodeURIComponent(language)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(true),
    });
    return handleResponse(response, 'Failed to get room greeting');
  },

  /**
   * Update greeting message for a room
   * POST /api/rooms/:roomId/greeting
   * Body: { language: string, message: string }
   */
  async updateRoomGreeting(
    roomId: string | number,
    payload: { language: string; message: string }
  ): Promise<{ status: number; message: string }> {
    const url = `${API_BASE_URL}/api/rooms/${encodeURIComponent(String(roomId))}/greeting`;
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse(response, 'Failed to update room greeting');
  },

  // Get Admin Hotels (using existing /api/hotels route)
  async getAdminHotels(): Promise<HotelData[]> {
    return this.getAllHotels().then(response => 
      Array.isArray(response) ? response : response.data || []
    );
  },

  // Get Guests with Rooms
  async getGuestsWithRooms(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/guests/with-rooms`, {
      method: 'GET',
      headers: buildHeaders(true),
    });

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return [];
    }

    const data = await handleResponse<any>(response, 'Failed to fetch guests with rooms');
    return Array.isArray(data) ? data : data.response || data.data || [];
  },
};

export default adminApi;

// Standalone Room Dashboard fetcher
export async function getRoomDashboard(roomId: number, token: string): Promise<RoomDashboardApiResponse> {
  const url = `${API_BASE_URL}/api/rooms/dashboard/${encodeURIComponent(String(roomId))}`;

  // Build headers using provided token (explicit as requested)
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Authorization': `Bearer ${token}`,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers,
    });
  } catch (e: any) {
    throw new ApiError(0, e?.message || 'Network error while fetching room dashboard');
  }

  // Handle empty responses gracefully for GET requests
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    throw new ApiError(204, 'No room dashboard data available');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('text/html')) {
      throw new ApiError(response.status, 'Server returned HTML instead of JSON. Please verify the API server.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'Failed to fetch room dashboard');
  }

  if (contentType.includes('text/html')) {
    throw new ApiError(200, 'Server returned HTML instead of JSON. Please verify the API server.');
  }

  return response.json();
}
