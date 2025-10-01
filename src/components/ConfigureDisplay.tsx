import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Save, X } from 'lucide-react';
import { adminApi, LanguageData, CreateLanguagePayload, ApiError } from '../services/api';

const allowedLanguages = [
  'English','Romanian','French','German','Spanish','Italian','Hindi','Chinese','Japanese','Arabic'
];

const ConfigureDisplay = () => {
  const [logo, setLogo] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [roomNumber, setRoomNumber] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState(['English', 'Romanian']);
  const [defaultLanguage, setDefaultLanguage] = useState('English');
  const [languageInput, setLanguageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageData[]>([]);

  useEffect(() => {
    if (!supportedLanguages.includes(defaultLanguage)) {
      setDefaultLanguage(supportedLanguages[0] || '');
    }
  }, [supportedLanguages, defaultLanguage]);

  // Load languages from API
  const loadLanguages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAllLanguages();
      const languagesData = Array.isArray(response) ? response : response.data || [];
      setAvailableLanguages(languagesData);
      
      // Update supported languages with API data
      const languageNames = languagesData.map((lang: LanguageData) => lang.language_name);
      if (languageNames.length > 0) {
        setSupportedLanguages(languageNames);
        if (!languageNames.includes(defaultLanguage)) {
          setDefaultLanguage(languageNames[0]);
        }
      }
    } catch (err) {
      console.error('Error loading languages:', err);
      setError('Failed to load languages. Using default languages.');
      // Keep using default languages as fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Load languages on component mount
  useEffect(() => {
    loadLanguages();
  }, []);

  const handleAddLanguage = async () => {
    const val = languageInput.trim();
    if (!val || !allowedLanguages.includes(val) || supportedLanguages.includes(val)) {
      setLanguageInput('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create language code from name (simple mapping)
      const languageCode = val.toLowerCase().substring(0, 2);
      
      const payload: CreateLanguagePayload = {
        language_code: languageCode,
        language_name: val,
      };

      const response = await adminApi.createLanguage(payload);
      
      if (response.success) {
        // Reload languages from API
        await loadLanguages();
        setLanguageInput('');
        
        const event = new CustomEvent('showToast', {
          detail: { 
            type: 'success', 
            title: 'Language Added', 
            message: `Language ${val} has been added successfully!` 
          }
        });
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      console.error('Error creating language:', err);
      let message = 'Failed to add language';
      
      if (err instanceof ApiError) {
        message = err.message || 'Failed to add language';
      } else if (err?.message) {
        message = err.message;
      }
      
      setError(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
    const file = files[0];

    if (validTypes.includes(file.type)) {
      setLogoFile(file);
      setLogo(file.name);
    } else {
      alert("Only image files (PNG, JPG, JPEG, GIF) are allowed.");
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configure Display</h1>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm mt-1">
              {error}
            </div>
          )}
        </div>
      </div>
      
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Logo Upload */}
      
        {/* Room Info */}
        <Card className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-800 border dark:border-gray-700">
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Room Number</label>
              <input
                type="text"
                placeholder="e.g., 101"
                className="border dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-400 outline-none"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Welcome Message</label>
              <input
                type="text"
                placeholder="Welcome Mr. Doe to Hotel Aurora"
                className="border dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-400 outline-none"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Supported Languages */}
        <Card className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-800 border dark:border-gray-700">
          <CardContent className="flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Supported Languages</label>
            <div className="flex flex-wrap gap-2">
              {supportedLanguages.map((lang) => (
                <span
                  key={lang}
                  className="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                >
                  {lang}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSupportedLanguages(supportedLanguages.filter(l => l !== lang))}
                  />
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type language and press Enter / Space / Comma"
              className="border dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-400 outline-none"
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              onKeyDown={(e) => { if ([' ', ',', 'Enter'].includes(e.key)) { e.preventDefault(); handleAddLanguage(); } }}
              disabled={isLoading}
            />
           <Button
  type="button"
  className="w-max flex items-center gap-1 mt-2 bg-blue-600 text-white border border-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:border-blue-600 dark:hover:bg-blue-600"
  onClick={() => setSupportedLanguages([])}
>
  <X className="h-4 w-4" /> Clear All
</Button>


            {/* Default Language */}
            <div className="flex flex-col mt-4">
              <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Default Language</label>
              <select
                className="border dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-400 outline-none"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
              >
                {supportedLanguages.length > 0 ? (
                  supportedLanguages.map((lang) => <option key={lang} value={lang}>{lang}</option>)
                ) : (
                  <option value="">No languages available</option>
                )}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-start">
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            onClick={async () => {
              if (!roomNumber || !welcomeMessage) {
                alert("Please enter both Room Number and Welcome Message");
                return;
              }
              try {
                setIsLoading(true);
                setError(null);
                // Derive a simple language code from Default Language (fallback to 'en')
                const languageCode = (defaultLanguage || 'en').toLowerCase().slice(0, 2);
                // Try to resolve room ID from the entered room number for safer API call
                let roomIdForApi: string | number = roomNumber;
                try {
                  const allRooms = await adminApi.getAllRooms();
                  const match = Array.isArray(allRooms)
                    ? allRooms.find((r: any) => String(r?.room_number || r?.roomNumber) === String(roomNumber))
                    : null;
                  if (match?.id) {
                    roomIdForApi = match.id;
                  }
                } catch (e) {
                  // If room list fetch fails, fall back to using entered value
                  console.warn('Could not resolve room ID from number, using entered value');
                }

                const res: any = await adminApi.updateRoomGreeting(roomIdForApi, {
                  language: languageCode,
                  message: welcomeMessage.trim(),
                });
                const event = new CustomEvent('showToast', {
                  detail: { 
                    type: 'success', 
                    title: `Room ${res?.roomNumber || roomNumber} Greeting Updated`, 
                    message: res?.message || 'Greeting updated successfully', 
                  }
                });
                window.dispatchEvent(event);
                // Emit refresh event so any open room dashboard can refetch immediately
                const refreshEvt = new CustomEvent('refreshRoomDashboard', {
                  detail: {
                    roomNumber: res?.roomNumber || roomNumber,
                    language: res?.language || languageCode,
                    greeting: welcomeMessage.trim(),
                  },
                });
                window.dispatchEvent(refreshEvt);
              } catch (err: any) {
                console.error('Save Display Settings (greeting) error:', err);
                const msg = err?.message || 'Failed to update greeting';
                setError(msg);
                const event = new CustomEvent('showToast', {
                  detail: { type: 'error', title: 'Greeting Update Failed', message: msg },
                });
                window.dispatchEvent(event);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Display Settings
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ConfigureDisplay;
