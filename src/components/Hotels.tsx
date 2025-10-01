import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, ApiError, HotelData } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Use the same interface as the API
type HotelRecord = HotelData;

interface StoredUser {
  username: string;
  email: string;
  role: string;
  accessScope: string;
}

const HOTELS_STORAGE_KEY = 'hotels_by_admin';

const Hotels = () => {
  const navigate = useNavigate();

  const currentUser: StoredUser | null = useMemo(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const adminKey = currentUser?.username || currentUser?.email || 'unknown_admin';

  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; hotel: HotelRecord | null }>({
    show: false,
    hotel: null,
  });
  const [formData, setFormData] = useState<HotelRecord>({
    id: '',
    name: '',
    logo_url: '',
    established_year: 0, // number now
    address: '',
    service_care_no: '',
    city: '',
    country: '',
    postal_code: '',
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof HotelRecord, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Clear messages after timeout
  const clearMessages = () => {
    setApiError(null);
    setApiSuccess(null);
  };

  const showSuccessMessage = (message: string) => {
    setApiSuccess(message);
    setTimeout(() => {
      setApiSuccess(null);
    }, 5000); // Clear after 5 seconds
  };

  const showErrorMessage = (message: string) => {
    setApiError(message);
    setTimeout(() => {
      setApiError(null);
    }, 5000); // Clear after 5 seconds
  };

  const saveHotels = useCallback((list: HotelRecord[]) => {
    try {
      const raw = localStorage.getItem(HOTELS_STORAGE_KEY);
      const map: Record<string, HotelRecord[]> = raw ? JSON.parse(raw) : {};
      map[adminKey] = list;
      localStorage.setItem(HOTELS_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }
  }, [adminKey]);

  // Function to clean and deduplicate hotel data
  const cleanAndDeduplicateHotels = useCallback((hotels: HotelRecord[]): HotelRecord[] => {
    const seen = new Set<string>();
    const cleanedHotels: HotelRecord[] = [];

    for (const hotel of hotels) {
      // Skip hotels with missing essential data
      if (!hotel.name || !hotel.name.trim()) {
        console.warn('Skipping hotel with missing name:', hotel);
        continue;
      }

      // Create a unique key for deduplication (using name + address + city)
      const uniqueKey = `${hotel.name.trim().toLowerCase()}_${hotel.address?.trim().toLowerCase() || ''}_${hotel.city?.trim().toLowerCase() || ''}`;
      
      if (seen.has(uniqueKey)) {
        console.warn('Skipping duplicate hotel:', hotel.name);
        continue;
      }
      seen.add(uniqueKey);

      // Clean and validate hotel data
      const cleanedHotel: HotelRecord = {
        ...hotel,
        id: hotel.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: hotel.name.trim(),
        address: hotel.address?.trim() || '',
        city: hotel.city?.trim() || '',
        country: hotel.country?.trim() || '',
        postal_code: hotel.postal_code?.trim() || '',
        username: hotel.username?.trim() || '',
        password: hotel.password || '',
        service_care_no: hotel.service_care_no?.trim() || '',
        logo_url: hotel.logo_url?.trim() || '',
        // Validate established year
        established_year: (hotel.established_year && 
          typeof hotel.established_year === 'number' && 
          hotel.established_year > 1900 && 
          hotel.established_year <= new Date().getFullYear()) 
          ? hotel.established_year 
          : 2000, // Default to 2000 if invalid
      };

      // Only include hotels with valid location data
      if (cleanedHotel.address && cleanedHotel.city && cleanedHotel.country) {
        cleanedHotels.push(cleanedHotel);
      } else {
        console.warn('Skipping hotel with incomplete location data:', cleanedHotel.name);
      }
    }

    console.log(`Cleaned ${hotels.length} hotels down to ${cleanedHotels.length} valid hotels`);
    return cleanedHotels;
  }, []);

  const loadHotels = useCallback(async () => {
    setIsLoading(true);
    clearMessages();
    
    try {
      const token = adminApi.getToken();
      if (!token) {
        showErrorMessage('Please login to view hotels.');
        navigate('/', { replace: true });
        return;
      }

      console.log('Loading admin hotels with token:', token);
      const response = await adminApi.getAdminHotels();
      console.log('Get admin hotels response:', response);
      
      const hotelsData: HotelRecord[] = Array.isArray(response) ? response : [];
      console.log('Admin hotels loaded:', hotelsData);
      
      if (hotelsData.length > 0) {
        const cleanedHotels = cleanAndDeduplicateHotels(hotelsData);
        setHotels(cleanedHotels);
        saveHotels(cleanedHotels);
        
        // If admin has exactly 1 hotel, redirect to dashboard
        if (cleanedHotels.length === 1) {
          const hotel = cleanedHotels[0];
          localStorage.setItem('selected_hotel', JSON.stringify(hotel));
          navigate(`/hotel/${hotel.id}/dashboard`, { replace: true });
          return;
        }
      } else {
        setHotels([]);
        setShowCreateForm(true); // Auto-show create form if no hotels
      }
    } catch (err: any) {
      console.error('API error:', err);
      let message = 'Failed to load hotels';
      
      if (err instanceof ApiError) {
        if (err.status === 401) {
          message = 'Please login to view hotels';
          navigate('/', { replace: true });
          return;
        } else if (err.message.includes('HTML instead of JSON')) {
          message = 'API server is not responding correctly. Please check if the backend server is running.';
        } else {
          message = err.message || 'Failed to load hotels';
        }
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }
      
      showErrorMessage(message);
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, adminKey, saveHotels, cleanAndDeduplicateHotels]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  // Removed auto-show create form when no hotels

  // Prevent background scroll when full-screen create overlay is open
  useEffect(() => {
    if (showCreateForm) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [showCreateForm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'established_year' ? parseInt(value || '0', 10) : value,
    }));
  
    if (errors[name as keyof HotelRecord]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData(prev => ({ ...prev, logo_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof HotelRecord, string>> = {};
    if (!formData.name.trim()) next.name = 'Name is required';
    const year = Number(formData.established_year);
    if (!year) next.established_year = 'Established year is required';
    if (!Number.isInteger(year) || String(year).length !== 4) next.established_year = 'Enter 4-digit year';
    if (!formData.address.trim()) next.address = 'Address is required';
    if (!formData.city.trim()) next.city = 'City is required';
    if (!formData.country.trim()) next.country = 'Country is required';
    if (!formData.postal_code.trim()) next.postal_code = 'Postal code is required';
    if (!formData.username.trim()) next.username = 'UserName is required';
    if (!formData.password.trim()) next.password = 'Password is required';
    
    // Check for existing username in current hotels list
    if (formData.username.trim()) {
      const existingHotel = hotels.find(hotel => 
        hotel.username.toLowerCase() === formData.username.toLowerCase()
      );
      if (existingHotel) {
        next.username = 'Hotel with this username already exists';
      }
    }
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // ✅ Validate inputs
    if (!validate()) return;

    setIsSubmitting(true);
    clearMessages();

  // Server-only: no local persistence helper

    try {
      // Try backend first if token exists
      const token = adminApi.getToken();

      if (!token) {
        showErrorMessage('Please login to create a hotel.');
        setShowCreateForm(false);
        navigate('/', { replace: true });
        return;
      }

      // ✅ Payload with proper key names (no spaces, backend-friendly)
      const payload = {
        Name: formData.name.trim(),
        Logo_url: formData.logo_url.trim(),
        Established_year: formData.established_year, // number
        Address: formData.address.trim(),
        Service_care_no: formData.service_care_no.trim(),
        City: formData.city.trim(),
        Country: formData.country.trim(),
        Postal_code: formData.postal_code.trim(),
        UserName: formData.username.trim(),
        Password: formData.password,
      };
      

      // Call backend API
      const response = await adminApi.createHotel(payload);
      console.log('Create hotel response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response));

      // Check if hotel creation was successful
      if (!response.success) {
        // Handle the specific error format from your backend
        if (response.c && Array.isArray(response.c)) {
          const errorMessage = response.c.join(', ');
          throw new Error(`Validation errors: ${errorMessage}`);
        }
        throw new Error(response.message || 'Failed to create hotel');
      }

      showSuccessMessage('Hotel Created Successfully');

      // Log the response to debug the structure
      console.log('Hotel creation response:', response);
      console.log('Response data:', response.data);

      // Create the new hotel object and add it to the state immediately
      const newHotel: HotelRecord = {
        id: response.data?.id || response.data?.hotel_id || Date.now().toString(),
        name: formData.name,
        logo_url: formData.logo_url,
        established_year: formData.established_year,
        address: formData.address,
        service_care_no: formData.service_care_no,
        city: formData.city,
        country: formData.country,
        postal_code: formData.postal_code,
        username: formData.username,
        password: formData.password,
      };

      console.log('Created new hotel object:', newHotel);

      // Add the new hotel to the current hotels list immediately
      setHotels(prevHotels => {
        const updatedHotels = [...prevHotels, newHotel];
        // Clean and deduplicate the updated list
        const cleanedHotels = cleanAndDeduplicateHotels(updatedHotels);
        console.log('Updated hotels list:', cleanedHotels);
        return cleanedHotels;
      });

      // Also reload from API to ensure consistency, but with a longer delay
      setTimeout(async () => {
        console.log('Reloading hotels from API for consistency...');
        try {
          await loadHotels();
        } catch (error) {
          console.error('Failed to reload hotels from API:', error);
          // Don't show error to user since we already have the hotel in state
        }
      }, 1000);

      // Reset form
      setFormData({
        id: '',
        name: '',
        logo_url: '',
        established_year: 0,
        address: '',
        service_care_no: '',
        city: '',
        country: '',
        postal_code: '',
        username: '',
        password: '',
      });

      // Clear any existing errors
      setErrors({});

      // Redirect to hotel dashboard after creation
      localStorage.setItem('selected_hotel', JSON.stringify(newHotel));
      navigate(`/hotel/${newHotel.id}/dashboard`, { replace: true });
    } catch (err: any) {
      console.error('API error:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        status: err.status,
        response: err.response,
        stack: err.stack
      });
      
      let message = 'Failed to create hotel';
      
      if (err instanceof ApiError) {
        // Handle specific API errors
        if (err.status === 400) {
          message = err.message || 'Invalid hotel data provided';
        } else if (err.status === 409) {
          message = 'Hotel with this username already exists';
        } else if (err.status === 401) {
          message = 'Please login to create a hotel';
          setShowCreateForm(false);
          navigate('/', { replace: true });
          return;
        } else if (err.message.includes('HTML instead of JSON')) {
          message = 'API server is not responding correctly. Please check if the backend server is running.';
        } else if (err.message.includes('Validation errors:')) {
          message = err.message;
        } else {
          message = err.message || 'Failed to create hotel';
        }
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }
      
      showErrorMessage(message);
    } finally {
      setIsSubmitting(false);
      // Close the form modal after all state updates are complete
      setShowCreateForm(false);
      console.log('Modal closed in finally block');
    }
  };
  

  const handleSelectHotel = (hotel: HotelRecord) => {
    try {
      localStorage.setItem('selected_hotel', JSON.stringify(hotel));
    } catch {
      // ignore storage errors
    }
    navigate(`/hotel/${hotel.id}/dashboard`, { replace: true });
  };

  const handleDeleteClick = (e: React.MouseEvent, hotel: HotelRecord) => {
    e.stopPropagation(); // Prevent hotel selection when clicking delete
    setDeleteConfirm({ show: true, hotel });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.hotel) return;
    
    // For now, just remove from local state and localStorage
    // In a real app, you'd call a delete API endpoint here
    const updatedHotels = hotels.filter(hotel => hotel.id !== deleteConfirm.hotel!.id);
    saveHotels(updatedHotels);
    setHotels(updatedHotels);
    setDeleteConfirm({ show: false, hotel: null });
    
    // Reload from API to ensure consistency
    await loadHotels();
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, hotel: null });
  };

  return (
    <div className="relative p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Create Hotel</h1>
            <p className="text-sm text-slate-500 mt-1">Set up your hotel to get started</p>
          </div>
        </div>

        {apiError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 flex items-center gap-2">
            <span>{apiError}</span>
            <button onClick={loadHotels} className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm">
              Retry
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Hotel Data</h3>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we check your hotel...</p>
          </div>
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold">Create Hotel</h2>
                  <p className="text-sm text-slate-500">Add details for the new property</p>
                </div>
              </div>

              <form onSubmit={handleCreate} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="Hotel Name" />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Logo</label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center justify-center px-3 py-2 rounded-md border bg-white dark:bg-slate-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      Upload Image
                    </label>
                    <input
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleChange}
                      className="flex-1 border rounded-md px-3 py-2"
                      placeholder="Or paste image URL"
                    />
                  </div>
                  {formData.logo_url && (
                    <div className="mt-2">
                      <img src={formData.logo_url} alt="Preview" className="h-12 w-12 rounded object-cover ring-1 ring-gray-200" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Established Year</label>
                  <input name="established_year" value={formData.established_year} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="e.g. 2005" />
                  {errors.established_year && <p className="text-xs text-red-600 mt-1">{errors.established_year}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="Street, Area" />
                  {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Service Care No.</label>
                  <input name="service_care_no" value={formData.service_care_no} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="Support Number" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="City" />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input name="country" value={formData.country} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="Country" />
                  {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <input name="postal_code" value={formData.postal_code} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="Postal Code" />
                  {errors.postal_code && <p className="text-xs text-red-600 mt-1">{errors.postal_code}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hotel Login Username</label>
                  <input name="username" value={formData.username} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="e.g. hyatt-admin" />
                  {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hotel Login Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border rounded-md px-3 py-2" placeholder="••••••••" />
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>

                <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Hotel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default Hotels;


