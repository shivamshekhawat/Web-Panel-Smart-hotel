import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Bell, 
  Send, 
  Clock, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { adminApi } from '../services/api';
import config from '../config/environment';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'success';
  target: 'all' | 'room' | 'guest' | 'floor' | 'multipleRooms';
  targetId?: string | string[];
  priority: 'low' | 'medium' | 'high';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

const Notifications = () => {
  const [notificationForm, setNotificationForm] = useState({
    message: '',
    target: 'all' as 'all' | 'room' | 'guest' | 'floor' | 'multipleRooms',
    targetId: '' as string | string[],
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rooms, setRooms] = useState<Array<{id: string, number: string, guest?: string}>>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [guests, setGuests] = useState<Array<{ id: string; name: string; roomNumber?: string; roomId?: string }>>([]);

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

  // Load rooms from API
  const loadRooms = async () => {
    try {
      const token = adminApi.getToken?.();
      if (!token) throw new Error('Please login again.');

      // Resolve selected hotel id from storage (prefer numeric hotel_id)
      let hotelId: string | undefined;
      try {
        const raw = localStorage.getItem('selected_hotel');
        if (raw) {
          const parsed = JSON.parse(raw);
          const candidate = parsed?.hotel_id ?? parsed?.id ?? parsed?.hotelId;
          if (candidate != null && /^\d+$/.test(String(candidate))) {
            hotelId = String(candidate);
          }
        }
      } catch {}

      if (!hotelId) {
        console.warn('No selected hotel found in storage. Loading all rooms as fallback.');
      }

      // Use centralized API which normalizes response and headers
      const list = await adminApi.getAllRooms(hotelId as any);

      setRooms((Array.isArray(list) ? list : []).map((room: any) => ({
        id: room.id ?? room.room_id ?? '',
        number: room.room_number ?? String(room.number ?? ''),
        guest: room.guest_name ?? room.guest ?? undefined,
      })));
    } catch (err) {
      console.error('Error loading rooms:', err);
      setRooms([]);
    }
  };

  // Load guests from API
  const loadGuests = async () => {
    try {
      const token = adminApi.getToken?.();
      if (!token) throw new Error('Please login again.');

      // Resolve selected hotel id from storage
      let hotelId: string | number | undefined;
      try {
        const raw = localStorage.getItem('selected_hotel');
        if (raw) {
          const parsed = JSON.parse(raw);
          hotelId = parsed?.id ?? parsed?.hotel_id ?? undefined;
        }
      } catch {}

      const resp = await adminApi.getAllGuests(hotelId as any);
      const list: any[] = Array.isArray(resp)
        ? resp
        : (Array.isArray((resp as any)?.data) ? (resp as any).data : []);

      setGuests(list.map((g: any) => ({
        id: g.id ?? g.guest_id ?? '',
        name: [g.first_name, g.last_name].filter(Boolean).join(' ') || g.name || g.username || '',
        roomNumber: g.room_number ?? g.roomNumber ?? undefined,
        roomId: g.room_id ?? g.roomId ?? undefined,
      })));
    } catch (err) {
      console.error('Error loading guests:', err);
      setGuests([]);
    }
  };

  // Load notifications from API
  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = adminApi.getToken?.();
      if (!token) throw new Error('Please login again.');

      const resp = await fetch(`${config.apiBaseUrl}/api/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (resp.status === 204) {
        setNotifications([]);
        return;
      }

      const data = await resp.json().catch(() => ([]));
      const list: any[] = Array.isArray(data)
        ? data
        : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.response) ? data.response : []));

      const transformed: Notification[] = list.map((n: any) => {
        const id = n.id ?? n.notification_id ?? String(Math.random());
        const message = n.message ?? n.text ?? '';
        const priority = (n.priority ?? 'medium') as 'low' | 'medium' | 'high';
        const type = (n.type ?? 'info') as 'info' | 'warning' | 'urgent' | 'success';
        const target = (n.target ?? (n.room_id ? 'room' : 'all')) as Notification['target'];
        const status = (n.status ?? (n.is_read ? 'read' : 'delivered')) as Notification['status'];
        const sentAt = n.sentAt ?? n.created_time ?? n.created_at ?? new Date().toISOString();
        const deliveredAt = n.deliveredAt ?? n.created_time ?? undefined;
        const readAt = n.readAt ?? (n.is_read ? n.created_time : undefined);
        const targetId = n.targetId ?? n.room_id ?? n.guest_id ?? undefined;
        return {
          id,
          title: n.title ?? `Notification ${id}`,
          message,
          type,
          target,
          targetId,
          priority,
          status,
          sentAt,
          deliveredAt,
          readAt,
        } as Notification;
      });

      setNotifications(transformed);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications and rooms on component mount
  useEffect(() => {
    loadNotifications();
    loadRooms();
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Bell className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-500';
      case 'warning': return 'text-yellow-500';
      case 'urgent': return 'text-red-500';
      case 'success': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'delivered':
        return <Badge variant="info">Delivered</Badge>;
      case 'read':
        return <Badge variant="success">Read</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      default:
        return <Badge variant="default">{priority}</Badge>;
    }
  };

  const formatTarget = (target: Notification['target'], targetId?: string | string[]) => {
    if (target === 'all') return 'All Guests';
    if (target === 'room') return `Room ${targetId}`;
    if (target === 'guest') return `Guest: ${targetId}`;
    if (target === 'floor') {
      const floor = floors.find(f => f.id === targetId);
      return `Floor: ${floor?.name || targetId}`;
    }
    if (target === 'multipleRooms') {
      const ids = Array.isArray(targetId) ? targetId : [];
      if (ids.length === 0) return 'Rooms: none selected';
      return `Rooms: ${ids.join(', ')}`;
    }
    return '';
  };

  const handleSendNotification = async () => {
    if (!notificationForm.message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = adminApi.getToken?.();
      if (!token) throw new Error('Please login again.');

      // Build request body per spec
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

      const resp = await fetch(`${config.apiBaseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson?.message || 'Failed to send notification');
      }

      // Optional: update timeline with returned notification(s)
      try {
        const respData = await resp.json();
        const list = Array.isArray(respData) ? respData : (Array.isArray(respData?.data) ? respData.data : []);
        if (list.length > 0) {
          // Merge newly created notifications
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
      } catch {}
      
      // Reset form
      setNotificationForm({
        message: '',
        target: 'all',
        targetId: '',
        priority: 'medium'
      });

      const event = new CustomEvent('showToast', {
        detail: { type: 'success', title: 'Notification Sent', message: 'Notification sent successfully!' }
      });
      window.dispatchEvent(event);
      // Refresh notifications list
      loadNotifications();
    } catch (err: any) {
      console.error('Error sending notification:', err);
      let message = 'Failed to send notification';
      
      if (err?.message) {
        message = err.message;
      }
      
      setError(message);
      alert(message);
    } finally {
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
                <select
                  value={typeof notificationForm.targetId === 'string' ? (notificationForm.targetId as string) : ''}
                  onChange={(e) => setNotificationForm({...notificationForm, targetId: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border dark:border-gray-600 rounded-md bg-background"
                >
                  <option value="">Select Guest</option>
                  {guests.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}{g.roomNumber ? ` - Room ${g.roomNumber}` : ''}
                    </option>
                  ))}
                </select>
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
          <CardTitle>Sent Notifications</CardTitle>
          <CardDescription>History of all sent notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-4 p-4 border dark:border-gray-700 rounded-lg hover:bg-muted/50">
                <div className={`p-2 rounded-full ${getTypeColor(notification.type)} bg-opacity-10`}>
                  {getTypeIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{notification.title}</h4>
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
                        <span>Sent {new Date(notification.sentAt).toLocaleString()}</span>
                      </div>
                      {notification.deliveredAt && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Delivered {new Date(notification.deliveredAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
