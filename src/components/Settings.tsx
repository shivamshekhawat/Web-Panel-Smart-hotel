import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Save, 
  User, 
  Palette,
  Key,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import { adminApi } from '../services/api';
import axios from 'axios';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [reservations, setReservations] = useState<any[]>([]);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [reservationsStatus, setReservationsStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [settings, setSettings] = useState({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@hotel.com',
      phone: '+1 (555) 123-4567',
      role: 'Administrator'
    },
    appearance: {
      timezone: 'UTC-5',
      dateFormat: 'MM/DD/YYYY'
    }
  });
  
  // Load profile from localStorage on component mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        setSettings(prev => ({
          ...prev,
          profile: { ...prev.profile, ...profileData }
        }));
        console.log('🔍 Loaded profile from localStorage:', profileData);
      }
    } catch (e) {
      console.warn('Could not load profile from localStorage');
    }
  }, []);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [key]: value
      }
    }));
  };

  const handleSave = async (section: string) => {
    if (section === 'profile') {
      try {
        setIsLoading(true);
        
        // Get admin ID from localStorage (stored during login)
        let adminId = localStorage.getItem('currentUserId')?.trim();
        
        // Fallback: try to get from admin_info stored during login
        if (!adminId) {
          try {
            const adminInfo = localStorage.getItem('admin_info');
            if (adminInfo) {
              const parsed = JSON.parse(adminInfo);
              adminId = parsed?.admin_id || parsed?.id || parsed?.adminId;
            }
          } catch (e) {
            console.warn('Could not parse admin_info from localStorage');
          }
        }
        
        // Additional fallback: check auth_token for embedded admin info
        if (!adminId) {
          try {
            const authToken = localStorage.getItem('auth_token');
            if (authToken && authToken.includes('.')) {
              const payload = JSON.parse(atob(authToken.split('.')[1]));
              adminId = payload?.adminId || payload?.admin_id || payload?.id || payload?.sub;
            }
          } catch (e) {
            console.warn('Could not decode auth token:', e);
          }
        }

        // Prepare the data for the API call
        const profileData = {
          firstName: settings.profile.firstName,
          lastName: settings.profile.lastName,
          email: settings.profile.email,
          phone: settings.profile.phone,
          username: localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).username : 'admin'
        };

        try {
          if (adminId) {
            const response = await adminApi.updateAdminProfile(adminId, profileData);
            
            // Show success toast
            const event = new CustomEvent('showToast', {
              detail: { 
                type: 'success', 
                title: 'Profile Updated', 
                message: response.message || 'Profile information saved successfully!' 
              }
            });
            window.dispatchEvent(event);

            // Update local state with the returned data
            setSettings(prev => ({
              ...prev,
              profile: {
                ...prev.profile,
                firstName: response.admin.firstName,
                lastName: response.admin.lastName,
                email: response.admin.email,
                phone: response.admin.phone
              }
            }));
          } else {
            throw new Error('Admin ID not found');
          }
        } catch (apiError: any) {
          console.warn('API update failed, falling back to localStorage:', apiError.message);
          
          // Fallback: Save to localStorage only
          localStorage.setItem('user_profile', JSON.stringify(profileData));
          
          // Show success toast for localStorage save
          const event = new CustomEvent('showToast', {
            detail: { 
              type: 'success', 
              title: 'Profile Updated', 
              message: 'Profile information saved locally!' 
            }
          });
          window.dispatchEvent(event);
        }
      } catch (error: any) {
        console.error('Error updating profile:', error);
        
        // Show error toast only for non-API errors
        const event = new CustomEvent('showToast', {
          detail: { 
            type: 'error', 
            title: 'Update Failed', 
            message: 'Could not save profile. Please try again.' 
          }
        });
        window.dispatchEvent(event);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log(`Saving ${section} settings:`, (settings as any)[section]);
    }
  };

  const applyTheme = (theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleSaveApiKey = async () => {
    const hotelId = localStorage.getItem('hotelId');
    if (!hotelId) {
      setApiKeyStatus('error');
      setErrorMessage('Hotel ID not found in localStorage');
      return;
    }

    if (!apiKey.trim()) {
      setApiKeyStatus('error');
      setErrorMessage('Please enter an API key');
      return;
    }

    setApiKeyLoading(true);
    setApiKeyStatus('idle');
    setErrorMessage('');

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'https://557fd583d2a4.ngrok-free.app';
      await axios.put(`${apiBaseUrl}/api/hotels/${hotelId}/api-key`, {
        apiKey: apiKey.trim()
      });
      
      setApiKeyStatus('success');
      setTimeout(() => setApiKeyStatus('idle'), 3000);
    } catch (error: any) {
      setApiKeyStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleFetchReservations = async () => {
    const hotelId = localStorage.getItem('hotelId');
    if (!hotelId) {
      setReservationsStatus('error');
      setErrorMessage('Hotel ID not found in localStorage');
      return;
    }

    setReservationsLoading(true);
    setReservationsStatus('idle');
    setErrorMessage('');

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'https://557fd583d2a4.ngrok-free.app';
      const response = await axios.get(`${apiBaseUrl}/api/hotels/${hotelId}/reservations/today`);
      
      setReservations(response.data || []);
      setReservationsStatus('success');
      setTimeout(() => setReservationsStatus('idle'), 3000);
    } catch (error: any) {
      setReservationsStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to fetch reservations');
      setReservations([]);
    } finally {
      setReservationsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'api', name: 'API Settings', icon: Key },
    { id: 'appearance', name: 'Appearance', icon: Palette }
  ];

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 cursor-wait select-none" style={{ pointerEvents: 'all' }}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Saving Settings</h3>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we save your changes...</p>
          </div>
        </div>
      )}
      {/* <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Setting
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">Manage your account and preferences</p>
        </div>
      </div> */}

      <div className="flex space-x-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-2 rounded-xl border border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-3 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Profile Information</CardTitle>
            <CardDescription className="text-base">Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                <input
                  type="text"
                  value={settings.profile.firstName}
                  onChange={(e) => handleSettingChange('profile', 'firstName', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                <input
                  type="text"
                  value={settings.profile.lastName}
                  onChange={(e) => handleSettingChange('profile', 'lastName', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  value={settings.profile.phone}
                  onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button 
              onClick={() => handleSave('profile')}
              disabled={isLoading}
              className="min-w-[140px]"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'api' && (
        <div className="space-y-6">
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">API Key Management</CardTitle>
              <CardDescription className="text-base">Manage your hotel's API key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <Button 
                onClick={handleSaveApiKey}
                disabled={apiKeyLoading}
                className="min-w-[140px]"
              >
                <Save className="mr-2 h-4 w-4" />
                {apiKeyLoading ? 'Saving...' : 'Save API Key'}
              </Button>

              {apiKeyStatus === 'success' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-green-800 dark:text-green-200">API key saved successfully!</p>
                </div>
              )}

              {apiKeyStatus === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Today's Reservations</CardTitle>
              <CardDescription className="text-base">Fetch and view active reservations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                onClick={handleFetchReservations}
                disabled={reservationsLoading}
                className="min-w-[180px]"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {reservationsLoading ? 'Fetching...' : 'Fetch Active Reservations'}
              </Button>

              {reservationsStatus === 'success' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-green-800 dark:text-green-200">Reservations fetched successfully!</p>
                </div>
              )}

              {reservationsStatus === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
                </div>
              )}

              {reservations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Reservations ({reservations.length})</h3>
                  <div className="space-y-3">
                    {reservations.map((reservation, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Guest Name</p>
                            <p className="text-gray-900 dark:text-white">{reservation.guestName || reservation.guest_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Room Number</p>
                            <p className="text-gray-900 dark:text-white">{reservation.roomNumber || reservation.room_number || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-in</p>
                            <p className="text-gray-900 dark:text-white">{reservation.checkIn || reservation.check_in_time || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-out</p>
                            <p className="text-gray-900 dark:text-white">{reservation.checkOut || reservation.check_out_time || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reservations.length === 0 && reservationsStatus === 'success' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-blue-800 dark:text-blue-200">No reservations found for today.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Appearance & Display</CardTitle>
            <CardDescription>Choose your theme preference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                <select
                  value={theme}
                  onChange={e => setTheme(e.target.value as 'light' | 'dark')}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
            {/* <Button 
              onClick={() => {
                const event = new CustomEvent('showToast', {
                  detail: { type: 'success', title: 'Appearance Updated', message: 'Theme preference saved!' }
                });
                window.dispatchEvent(event);
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Appearance Settings
            </Button> */}
          </CardContent>
        </Card>

        {/* <Card className="border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">Danger Zone</CardTitle>
            <CardDescription>These actions are irreversible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-t border-red-100 dark:border-red-900/50 pt-4">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Sign out of your account</h4>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  You'll be logged out of your account and redirected to the login page.
                </p>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-red-600 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
      )}
    </div>
  );
};

export default Settings;
