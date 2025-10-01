import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Save, 
  User, 
  Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import { adminApi } from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
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
        
        // Get admin ID from localStorage (stored as 'currentUserId')
        const storedId = localStorage.getItem('currentUserId');
        const adminId = (storedId ?? '').toString().trim();
        if (!adminId) {
          throw new Error('Admin ID not found. Please login again.');
        }

        // Prepare the data for the API call
        const profileData = {
          firstName: settings.profile.firstName,
          lastName: settings.profile.lastName,
          email: settings.profile.email,
          phone: settings.profile.phone
        };

        // Call the API
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

        console.log('Profile updated successfully:', response);
      } catch (error: any) {
        console.error('Error updating profile:', error);
        
        // Show error toast
        const event = new CustomEvent('showToast', {
          detail: { 
            type: 'error', 
            title: 'Update Failed', 
            message: error.message || 'Could not save profile. Please try again.' 
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

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
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
