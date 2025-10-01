import { adminApi, HotelData } from './api';

export interface HotelCheckResult {
  hasHotel: boolean;
  hotels: HotelData[];
  selectedHotel?: HotelData;
  redirectPath: string;
}

/**
 * Check if the current admin has hotels and determine redirect path
 */
export async function checkAdminHotels(): Promise<HotelCheckResult> {
  try {
    console.log('🏨 Checking admin hotels...');
    const hotels = await adminApi.getAdminHotels();
    console.log('🏨 Hotels found:', hotels);

    if (hotels.length === 0) {
      // No hotels - redirect to create hotel
      return {
        hasHotel: false,
        hotels: [],
        redirectPath: '/create-hotel'
      };
    } else if (hotels.length === 1) {
      // Single hotel - redirect to dashboard
      const hotel = hotels[0];
      localStorage.setItem('selected_hotel', JSON.stringify(hotel));
      return {
        hasHotel: true,
        hotels,
        selectedHotel: hotel,
        redirectPath: `/hotel/${hotel.id}/dashboard`
      };
    } else {
      // Multiple hotels - this shouldn't happen in single hotel mode
      // But if it does, redirect to create hotel to handle it
      console.warn('🏨 Multiple hotels found, this should not happen in single hotel mode');
      return {
        hasHotel: true,
        hotels,
        redirectPath: '/create-hotel'
      };
    }
  } catch (error) {
    console.error('🏨 Error checking admin hotels:', error);
    // On error, assume no hotels and redirect to create hotel
    return {
      hasHotel: false,
      hotels: [],
      redirectPath: '/create-hotel'
    };
  }
}

/**
 * Get the currently selected hotel from localStorage
 */
export function getSelectedHotel(): HotelData | null {
  try {
    const stored = localStorage.getItem('selected_hotel');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Set the selected hotel in localStorage
 */
export function setSelectedHotel(hotel: HotelData): void {
  localStorage.setItem('selected_hotel', JSON.stringify(hotel));
}

/**
 * Clear the selected hotel from localStorage
 */
export function clearSelectedHotel(): void {
  localStorage.removeItem('selected_hotel');
}