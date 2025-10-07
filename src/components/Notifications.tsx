import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Bell, 
  Send, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  LogIn,
  LogOut,
  Wrench,
  ConciergeBell
} from 'lucide-react';
import { adminApi } from '../services/api';
import config from '../config/environment';

// Format notification type for display
const formatType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Format date for display
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Just now';
  return new Date(dateString).toLocaleString();
};

// Get status badge
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: string; label: string }> = {
    sent: { variant: 'outline', label: 'Sent' },
    delivered: { variant: 'secondary', label: 'Delivered' },
    read: { variant: 'default', label: 'Read' },
    failed: { variant: 'destructive', label: 'Failed' }
  };
  
  const statusInfo = statusMap[status] || { variant: 'outline', label: status };
  return <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>;
};

// Get priority badge
const getPriorityBadge = (priority: string) => {
  const priorityMap: Record<string, { variant: string; label: string }> = {
    low: { variant: 'outline', label: 'Low' },
    medium: { variant: 'secondary', label: 'Medium' },
    high: { variant: 'destructive', label: 'High' }
  };
  
  const priorityInfo = priorityMap[priority] || { variant: 'outline', label: priority };
  return <Badge variant={priorityInfo.variant as any}>{priorityInfo.label}</Badge>;
};

// Format target for display
const formatTarget = (target?: string, targetId?: string | string[]): string => {
  if (!target) return 'All';
  if (target === 'all') return 'All';
  if (target === 'room') return `Room ${targetId}`;
  if (target === 'multipleRooms' && Array.isArray(targetId)) {
    return `${targetId.length} rooms`;
  }
  return target.charAt(0).toUpperCase() + target.slice(1);
};

// Define a local interface for the component's notification data
interface Notification {
  id: string;
  room_id?: string;
  room_number?: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'success';
  created_time?: string;
  is_read?: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  targetId?: string | string[];
  title?: string;
  target?: 'all' | 'room' | 'guest' | 'floor' | 'multipleRooms';
}

const Notifications = () => {
  const [notificationForm, setNotificationForm] = useState({
    message: '',
    target: 'all' as 'all' | 'room' | 'guest' | 'floor' | 'multipleRooms',
    targetId: '' as string | string[],
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rooms, setRooms] = useState<Array<{id: string, number: string, guest?: string}>>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [guests, setGuests] = useState<Array<{ id: string; name: string; roomNumber?: string; roomId?: string }>>([]);
  const [guestsError, setGuestsError] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);

  const filteredRoomsForMulti = rooms.filter(r =>
    r.number.toLowerCase().includes(roomSearch.toLowerCase()) ||
    (r.guest?.toLowerCase().includes(roomSearch.toLowerCase()) ?? false)
  );

  const toggleRoomSelection = (roomId: string) => {
    const current = Array.isArray(notificationForm.targetId) ? notificationForm.targetId as string[] : [];
    const next = current.includes(roomId)
      ? current.filter(id => id !== roomId)
      : [...current, roomId];
    setNotificationForm({ ...notificationForm, targetId: next });
  };

  const selectAllVisibleRooms = () => {
    const ids = filteredRoomsForMulti.map(r => r.id);
    setNotificationForm({ ...notificationForm, targetId: ids });
  };

  const clearAllSelectedRooms = () => {
    setNotificationForm({ ...notificationForm, targetId: [] });
  };

  // Load the selected hotel from localStorage
  useEffect(() => {
    const hotel = localStorage.getItem('selected_hotel');
    if (hotel) {
      setSelectedHotel(JSON.parse(hotel));
    }
  }, []);

  // Load notifications from API
  const fetchNotifications = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setError('Failed to refresh notifications');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadNotifications = async (): Promise<void> => {
    if (!selectedHotel) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    
    // Only set loading state if not already in a refresh operation
    if (!isRefreshing) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const response = await adminApi.getHotelNotifications(selectedHotel.hotel_id || selectedHotel.id);
      
      if (response && response.success) {
        // Transform and sort the notifications
        const transformedNotifications = response.data.map((notification: any): Notification => ({
          id: notification.id || String(Math.random()),
          room_id: notification.room_id || '',
          room_number: notification.room_number || 'N/A',
          message: notification.message || '',
          type: notification.type || 'info',
          created_time: notification.created_time || new Date().toISOString(),
          is_read: notification.is_read || false,
          priority: notification.priority || 'medium',
          status: notification.is_read ? 'read' : (notification.status || 'sent'),
          sentAt: notification.sentAt || new Date().toISOString(),
          title: notification.title || `Notification ${notification.id || ''}`,
          targetId: notification.target_id || undefined,
          target: notification.target || 'all'
        }));
        
        // Sort by created_time in descending order (newest first)
        const sortedNotifications = [...transformedNotifications].sort((a, b) => 
          new Date(b.created_time ?? 0).getTime() - new Date(a.created_time ?? 0).getTime()
        );
        
        setNotifications(sortedNotifications);
        setError(null);
      } else {
        const errorMsg = response?.error || 'Failed to load notifications';
        console.error('Error in notifications response:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load notifications when the selected hotel changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (selectedHotel) {
        try {
          await loadNotifications();
        } catch (error) {
          if (isMounted) {
            console.error('Error in notifications useEffect:', error);
            setError('Failed to load notifications. Please refresh the page.');
            setIsLoading(false);
            setIsRefreshing(false);
          }
        }
      } else {
        // If no hotel is selected, ensure loading states are reset
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [selectedHotel]);
  

  // Fallback method to load guests from reservations when direct API fails
  const loadGuestsFromReservations = async () => {
    try {
      console.log('🔄 Loading guests from reservations as fallback...');

      // Get selected hotel ID
      const selectedHotel = localStorage.getItem('selected_hotel');
      const hotelId = selectedHotel ? JSON.parse(selectedHotel).hotel_id || JSON.parse(selectedHotel).id : null;

      if (!hotelId) {
        console.log('🔍 No hotel ID available for fallback');
        setGuests([]);
        setGuestsError('No hotel selected. Please select a hotel first.');
        return;
      }

      // Load reservations, rooms in parallel for guest data
      const [reservationsData, roomsData] = await Promise.all([
        adminApi.getAllReservations(hotelId).catch(() => []),
        adminApi.getAllRooms(hotelId).catch(() => [])
      ]);

      // Normalize data from different response formats
      const reservations = Array.isArray(reservationsData)
        ? reservationsData
        : (reservationsData as any)?.response || (reservationsData as any)?.data || [];

      const rooms = Array.isArray(roomsData)
        ? roomsData
        : (roomsData as any)?.response || (roomsData as any)?.data || [];

      console.log('🔄 Fallback data loaded:', {
        reservationsCount: reservations.length,
        roomsCount: rooms.length
      });

      // Create maps for quick lookup
      const roomMap = new Map();
      rooms.forEach((room: any) => {
        const roomId = room.id || room.room_id;
        if (roomId) {
          roomMap.set(roomId, room);
        }
      });

      // Extract unique guests from reservations
      const guestMap = new Map();
      const seenGuests = new Set<string>();

      reservations.forEach((reservation: any) => {
        // Handle different reservation formats
        const guestIds = Array.isArray(reservation.guest_id) ? reservation.guest_id : [reservation.guest_id];
        const guestNames = Array.isArray(reservation.guest_name) ? reservation.guest_name : [reservation.guest_name];
        const roomIds = Array.isArray(reservation.room_id) ? reservation.room_id : [reservation.room_id];

        guestIds.forEach((guestId: any, index: number) => {
          const guestName = guestNames[index] || guestNames[0] || 'Guest';
          const roomId = roomIds[index] || roomIds[0];

          if (guestId && !seenGuests.has(guestId)) {
            seenGuests.add(guestId);

            const room = roomMap.get(roomId);
            const roomNumber = room?.room_number || room?.roomNumber || room?.number;

            guestMap.set(guestId, {
              id: guestId,
              name: guestName,
              roomNumber: roomNumber,
              roomId: roomId,
            });
          }
        });
      });

      // Convert map to array for dropdown
      const fallbackGuests = Array.from(guestMap.values()).filter(guest => guest.id && guest.name);

      console.log('🔄 Fallback guests derived from reservations:', fallbackGuests);

      if (fallbackGuests.length > 0) {
        setGuests(fallbackGuests);
        setGuestsError(null); // Clear any previous error
        console.log('🔄 Guest dropdown populated with', fallbackGuests.length, 'guests from reservations');
      } else {
        console.log('🔄 No guests found in reservations');
        setGuests([]);
        setGuestsError('No guests found in reservations. Please ensure you have guests with active reservations.');
      }

    } catch (fallbackError) {
      console.error('Error loading guests from reservations fallback:', fallbackError);
      setGuests([]);
      setGuestsError('Unable to load guests. Please check your authentication and try again.');
    }
  };

  // Load rooms from API
  const loadRooms = async () => {
    try {
      const token = adminApi.getToken?.();
      if (!token) throw new Error('Please login again.');

      console.log('🔍 Loading rooms for notifications...');

      // Get selected hotel ID
      const selectedHotel = localStorage.getItem('selected_hotel');
      const hotelId = selectedHotel ? JSON.parse(selectedHotel).hotel_id || JSON.parse(selectedHotel).id : null;

      // Load rooms for specific hotel
      const list = await adminApi.getAllRooms(hotelId);
      console.log('🔍 Rooms loaded:', list);

      const transformedRooms = (Array.isArray(list) ? list : []).map((room: any) => ({
        id: room.id ?? room.room_id ?? '',
        number: room.room_number ?? String(room.number ?? ''),
        guest: room.guest_name ?? room.guest ?? undefined,
      }));

      console.log('🔍 Transformed rooms:', transformedRooms);
      setRooms(transformedRooms);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setRooms([]);
    }
  };

  // Load guests from API with fallback to reservations if direct API fails (e.g., due to auth issues or backend problems)
  const loadGuests = async () => {
    try {
      const token = adminApi.getToken?.();
      if (!token) {
        console.log('🔍 No auth token found, trying fallback method for guests');
        return await loadGuestsFromReservations();
      }

      console.log('🔍 Loading guests for notifications...');

      // Get selected hotel ID
      const selectedHotel = localStorage.getItem('selected_hotel');
      const hotelId = selectedHotel ? JSON.parse(selectedHotel).hotel_id || JSON.parse(selectedHotel).id : null;

      if (!hotelId) {
        console.log('🔍 No hotel ID found, trying fallback method for guests');
        return await loadGuestsFromReservations();
      }

      // Try direct guests by hotel API first
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/guests/hotel/${hotelId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Handle the response structure: data.response contains the array of guests
          const list = Array.isArray(data?.response) 
            ? data.response 
            : (Array.isArray(data?.data) 
                ? data.data 
                : (Array.isArray(data) ? data : []));
          
          console.log('🔍 Raw guest data from API:', data);
          
          console.log('🔍 Guests loaded via hotel-specific API:', list);

          const transformedGuests = list.map((g: any) => ({
            id: g.id ?? g.guest_id ?? '',
            name: [g.first_name, g.last_name].filter(Boolean).join(' ') || g.name || g.username || 'Guest',
            roomNumber: g.room_number ?? g.roomNumber ?? undefined,
            roomId: g.room_id ?? g.roomId ?? undefined,
          }));

          console.log('🔍 Transformed guests from hotel API:', transformedGuests);
          setGuests(transformedGuests);
          setGuestsError(null);
          return;
        } else {
          console.log(`🔍 Hotel-specific guests API returned ${response.status}, falling back to general guests API`);
          throw new Error('Hotel-specific guests API failed');
        }
      } catch (hotelApiError) {
        console.log('🔍 Hotel-specific guests API failed, trying general guests API:', hotelApiError);
        
        // Fallback to general guests API
        try {
          const resp = await adminApi.getAllGuests(hotelId);
          const list: any[] = Array.isArray(resp)
            ? resp
            : (Array.isArray((resp as any)?.data) ? (resp as any).data : []);

          console.log('🔍 Guests loaded via general API:', list);

          const transformedGuests = list.map((g: any) => ({
            id: g.id ?? g.guest_id ?? '',
            name: [g.first_name, g.last_name].filter(Boolean).join(' ') || g.name || g.username || 'Guest',
            roomNumber: g.room_number ?? g.roomNumber ?? undefined,
            roomId: g.room_id ?? g.roomId ?? undefined,
          }));

          console.log('🔍 Transformed guests from general API:', transformedGuests);
          setGuests(transformedGuests);
          setGuestsError(null);
          return;
        } catch (directApiError) {
          console.log('🔍 General guests API failed, trying fallback method:', directApiError);
          return await loadGuestsFromReservations();
        }
      }
    } catch (err) {
      console.error('Error in loadGuests:', err);
      // Try fallback even if main logic fails
      try {
        await loadGuestsFromReservations();
      } catch (fallbackError) {
        console.error('Fallback loading guests failed:', fallbackError);
        setError('Failed to load guests. Please try again later.');
      }
    }
  };

  // Load notifications, rooms, and guests on component mount
  useEffect(() => {
    loadNotifications();
    loadRooms();
    loadGuests();
  }, []);

  // Ensure data loads when user switches target
  useEffect(() => {
    if ((notificationForm.target === 'room' || notificationForm.target === 'multipleRooms') && rooms.length === 0) {
      loadRooms();
    }
    if (notificationForm.target === 'guest' && guests.length === 0) {
      loadGuests();
    }
  }, [notificationForm.target, rooms.length, guests.length]);

  const floors = [
    { id: '1', name: '1st Floor', rooms: ['101', '102'] },
    { id: '2', name: '2nd Floor', rooms: ['201', '202'] },
  ];

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'check_in':
        return 'text-green-500';
      case 'check_out':
        return 'text-blue-500';
      case 'maintenance':
        return 'text-yellow-500';
      case 'service':
        return 'text-purple-500';
      case 'alert':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

  const getTypeIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'check_in':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'check_out':
        return <LogOut className="h-4 w-4 text-blue-500" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'service':
        return <ConciergeBell className="h-4 w-4 text-purple-500" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTarget = (type: string = 'all', targetId?: string | string[]): string => {
    if (type === 'all') return 'All Guests';
    if (type === 'room') return `Room ${targetId}`;
    if (type === 'guest') return `Guest: ${targetId}`;
    if (type === 'floor') {
      const floor = floors.find(f => f.id === targetId);
      return `Floor: ${floor?.name || targetId}`;
    }
    if (type === 'multipleRooms') {
      const ids = Array.isArray(targetId) ? targetId : [];
      if (ids.length === 0) return 'Rooms: none selected';
      return `Rooms: ${ids.join(', ')}`;
    }
    return '';
  };

  // Handle sending a new notification
  const handleSendNotification = async (): Promise<void> => {
    if (!notificationForm.message.trim()) {
      alert('Please enter a message');
      return;
    }

    // Set loading state and clear any previous errors
    setIsLoading(true);
    setError(null);

    try {
      const token = adminApi.getToken?.();
      if (!token) {
        throw new Error('Your session has expired. Please login again.');
      }

      // Build request body
      const body: any = {
        message: notificationForm.message.trim(),
        target: notificationForm.target,
        priority: notificationForm.priority,
      };

      if (notificationForm.target === 'multipleRooms') {
        body.targetId = Array.isArray(notificationForm.targetId) ? notificationForm.targetId : [];
      } else if (notificationForm.target !== 'all') {
        body.targetId = typeof notificationForm.targetId === 'string' ? notificationForm.targetId : '';
      }

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const resp = await fetch(`${config.apiBaseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson?.message || `Failed to send notification (${resp.status} ${resp.statusText})`);
      }

      // Process successful response
      try {
        const respData = await resp.json();
        const list = Array.isArray(respData) ? respData : (Array.isArray(respData?.data) ? respData.data : []);
        
        if (list.length > 0) {
          setNotifications(prev => [
            ...list.map((n: any) => ({
              id: n.id ?? String(Math.random()),
              title: n.title ?? `Notification ${n.id ?? ''}`,
              message: n.message ?? '',
              type: (n.type ?? 'info') as 'info' | 'warning' | 'urgent' | 'success',
              target: (n.target ?? 'all') as Notification['target'],
              targetId: n.targetId,
              priority: (n.priority ?? 'medium') as 'low' | 'medium' | 'high',
              status: (n.status ?? 'sent') as Notification['status'],
              sentAt: n.sentAt ?? new Date().toISOString(),
            } as Notification)),
            ...prev,
          ]);
        }
      } catch (parseError) {
        console.error('Error parsing notification response:', parseError);
        // Continue even if parsing fails, as the notification might have been sent successfully
      }
      
      // Reset form on success
      setNotificationForm({
        message: '',
        target: 'all',
        targetId: '',
        priority: 'medium'
      });

      // Show success message
      const event = new CustomEvent('showToast', {
        detail: { 
          type: 'success', 
          title: 'Notification Sent', 
          message: 'Notification sent successfully!',
          duration: 3000 // 3 seconds
        }
      });
      window.dispatchEvent(event);
      
      // Refresh notifications list
      await loadNotifications();
      
    } catch (err: any) {
      console.error('Error sending notification:', err);
      
      let message = 'Failed to send notification';
      if (err.name === 'AbortError') {
        message = 'Request timed out. Please check your connection and try again.';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      
      // Show error toast
      const event = new CustomEvent('showToast', {
        detail: { 
          type: 'error', 
          title: 'Error', 
          message: message,
          duration: 5000 // 5 seconds for error messages
        }
      });
      window.dispatchEvent(event);
      
    } finally {
      // Always ensure loading state is reset
      setIsLoading(false);
    }
};

return (
  <div className="space-y-6 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800">
    {/* Loader Overlay */}
    {isLoading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 cursor-wait select-none" style={{ pointerEvents: 'all' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Notifications</h3>
          <p className="text-slate-500 dark:text-slate-400">Please wait while we fetch notifications...</p>
        </div>
      </div>
    )}
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm mt-1">
            {error}
          </div>
        )}
      </div>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800">
      {/* Send Notification Form */}
      <Card>
        <CardContent className="space-y-4 bg-gray-50 dark:bg-gray-800">
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={notificationForm.message}
              onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
              placeholder="Enter notification message"
              rows={4}
              className="w-full mt-1 px-3 py-2 border dark:border-gray-600 rounded-md bg-background dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                value={notificationForm.priority}
                onChange={(e) => setNotificationForm({...notificationForm, priority: e.target.value as any})}
                className="w-full mt-1 px-3 py-2 border dark:border-gray-600 rounded-md bg-background dark:bg-gray-800 text-gray-900 dark:text-gray-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium dark:text-gray-200">Target</label>
            <select
              value={notificationForm.target}
              onChange={(e) => {
                const nextTarget = e.target.value as 'all' | 'room' | 'guest' | 'floor' | 'multipleRooms';
                setNotificationForm({
                  ...notificationForm,
                  target: nextTarget,
                  targetId: nextTarget === 'multipleRooms' ? [] : ''
                });
              }}
              className="w-full mt-1 px-3 py-2 border dark:border-gray-600 rounded-md bg-background dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            >
              <option value="all">All Guests</option>
              <option value="room">Specific Room</option>
              <option value="guest">Specific Guest</option>
              <option value="floor">By Floor</option>
              <option value="multipleRooms">Multiple Rooms</option>
            </select>
          </div>

          {notificationForm.target === 'room' && (
            <div>
              <label className="text-sm font-medium">Room Number</label>
              <select
                value={typeof notificationForm.targetId === 'string' ? (notificationForm.targetId as string) : ''}
                onChange={(e) => setNotificationForm({...notificationForm, targetId: e.target.value})}
                className="w-full mt-1 px-3 py-2 border dark:border-gray-600 rounded-md bg-background"
              >
                <option value="">Select Room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    Room {room.number} - {room.guest}
                  </option>
                ))}
              </select>
            </div>
          )}

          {notificationForm.target === 'guest' && (
            <div>
              <label className="text-sm font-medium">Guest Name</label>
              {guestsError ? (
                <div className="mt-1 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ {guestsError}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                    Using reservation data as fallback. Guests shown may not include all registered guests.
                  </p>
                </div>
              ) : null}
              <select
                value={typeof notificationForm.targetId === 'string' ? (notificationForm.targetId as string) : ''}
                onChange={(e) => setNotificationForm({...notificationForm, targetId: e.target.value})}
                className="w-full mt-1 px-3 py-2 border dark:border-gray-600 rounded-md bg-background"
                disabled={guests.length === 0 && guestsError !== null}
              >
                <option value="">Select Guest</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}{g.roomNumber ? ` - Room ${g.roomNumber}` : ''}
                  </option>
                ))}
              </select>
              {guests.length === 0 && !guestsError && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  No guests available for selection.
                </p>
              )}
            </div>
          )}

          {notificationForm.target === 'floor' && (
            <div>
              <label className="text-sm font-medium">Select Floor</label>
              <select
                value={typeof notificationForm.targetId === 'string' ? (notificationForm.targetId as string) : ''}
                onChange={(e) => setNotificationForm({...notificationForm, targetId: e.target.value})}
                className="w-full mt-1 px-3 py-2 border dark:border-gray-600 rounded-md bg-background"
              >
                <option value="">Select Floor</option>
                {floors.map(floor => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {notificationForm.target === 'multipleRooms' && (
            <div>
              <label className="text-sm font-medium">Select Rooms</label>
              <div className="mt-1 space-y-2">
                <input
                  type="text"
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder="Search by room number or guest"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-md bg-background dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                />

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={selectAllVisibleRooms}>Select All</Button>
                  <Button type="button" variant="outline" onClick={clearAllSelectedRooms}>Clear</Button>
                </div>

                <div className="h-40 overflow-auto border dark:border-gray-600 rounded-md p-2 bg-background dark:bg-gray-800">
                  {filteredRoomsForMulti.length === 0 && (
                    <div className="text-sm text-muted-foreground px-1">No rooms found</div>
                  )}
                  {filteredRoomsForMulti.map(room => {
                    const selected = Array.isArray(notificationForm.targetId) && (notificationForm.targetId as string[]).includes(room.id);
                    return (
                      <label key={room.id} className="flex items-center gap-2 py-1 px-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleRoomSelection(room.id)}
                        />
                        <span className="text-sm">Room {room.number}{room.guest ? ` - ${room.guest}` : ''}</span>
                      </label>
                    );
                  })}
                </div>

                {Array.isArray(notificationForm.targetId) && notificationForm.targetId.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(notificationForm.targetId as string[]).map((id) => {
                      const room = rooms.find(r => r.id === id);
                      return (
                        <Badge key={id} variant="outline">{`Room ${room?.number ?? id}`}</Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-2 bg-gray-50  dark:bg-gray-800">
            <Button
              type="button"
              onClick={handleSendNotification}
              className="flex-1"
              disabled={!notificationForm.message.trim() || isLoading}
            >
              <Send className="mr-2 h-4 w-4 text-white" />
              {isLoading ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>

    {/* Sent Notifications Timeline */}
    <Card className="bg-gray-50 dark:bg-gray-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Recent notifications for this hotel</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchNotifications}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-4 p-4 border dark:border-gray-700 rounded-lg hover:bg-muted/50">
                <div className={`p-2 rounded-full ${getTypeColor(notification.type)} bg-opacity-10`}>
                  {getTypeIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{formatType(notification.type)}</span>
                      {notification.room_number && notification.room_number !== 'N/A' && (
                        <span className="text-sm text-muted-foreground">
                          Room {notification.room_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(notification.status)}
                      {getPriorityBadge(notification.priority)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>

                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                    Target: {formatTarget(notification.target, notification.targetId)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(notification.created_time)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>{notification.is_read ? 'Read' : 'Unread'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No notifications found</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
};

export default Notifications;
