// Types for Room Dashboard API
export interface Address {
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface Hotel {
  hotelId: number;
  name: string;
  logoUrl?: string;
  establishedYear?: number;
  address?: Address;
}

export interface Guest {
  guestId: number;
  name: string;
  adults: number;
  children: number;
  language?: string;
}

export interface Reservation {
  reservationId?: number;
  checkIn?: string; // ISO datetime
  checkOut?: string; // ISO datetime
  status?: string;
  [key: string]: any;
}

export interface CleanRoom {
  requested?: boolean;
  lastCleanedAt?: string; // ISO datetime
  status?: string;
  [key: string]: any;
}

export interface Weather {
  temperature?: number; // in Celsius
  summary?: string;
  humidity?: number;
  icon?: string;
  [key: string]: any;
}

export interface Controls {
  lights?: {
    master?: boolean;
    reading?: boolean;
  };
  curtains?: {
    master?: boolean; // true => open, false => close
    window?: boolean;
  };
  temperature?: number; // thermostat temperature in Celsius
  [key: string]: any;
}

export interface DND {
  status?: boolean; // true => Do Not Disturb ON
  [key: string]: any;
}

export interface Contact {
  phoneNumber?: string;
  email?: string;
}

export interface NotificationItem {
  id?: string | number;
  type?: string;
  message: string;
  time?: string;
}

export interface RoomDashboard {
  roomId: number;
  roomNo: string;
  hotel: Hotel;
  guest: Guest;
  reservation?: Reservation;
  cleanRoom?: CleanRoom;
  weather?: Weather;
  controls?: Controls;
  dnd?: DND;
  contact?: Contact;
  notifications: NotificationItem[];
}

export interface RoomDashboardApiResponse {
  message: string;
  status: number;
  response: RoomDashboard;
}
