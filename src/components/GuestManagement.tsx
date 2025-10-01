import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Search,
  MoreHorizontal,
  ArrowUpDown,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { adminApi, CreateGuestPayload, ApiError } from '../services/api';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  status: 'checked-in' | 'checked-out' | 'pending';
  address: string;
  specialRequests: string[];
  lastActivity: string;
}

interface NewGuestForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  language: string;
  hotel_id: string;
}

const GuestManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Guest>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGuestForm, setNewGuestForm] = useState<NewGuestForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    language: 'English',
    hotel_id: '',
  });

  const [guestList, setGuestList] = useState<Guest[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      roomNumber: '101',
      checkIn: '2024-01-15',
      checkOut: '2024-01-18',
      status: 'checked-in',
      address: '123 Main St, New York, NY 10001',
      specialRequests: ['Late check-out', 'Extra towels'],
      lastActivity: '2 hours ago',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 (555) 987-6543',
      roomNumber: '205',
      checkIn: '2024-01-14',
      checkOut: '2024-01-20',
      status: 'checked-in',
      address: '456 Oak Ave, Los Angeles, CA 90210',
      specialRequests: ['Room service', 'Wake-up call'],
      lastActivity: '1 hour ago',
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1 (555) 456-7890',
      roomNumber: '312',
      checkIn: '2024-01-16',
      checkOut: '2024-01-19',
      status: 'pending',
      address: '789 Pine Rd, Chicago, IL 60601',
      specialRequests: [],
      lastActivity: '30 minutes ago',
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1 (555) 321-0987',
      roomNumber: '108',
      checkIn: '2024-01-10',
      checkOut: '2024-01-17',
      status: 'checked-out',
      address: '321 Elm St, Miami, FL 33101',
      specialRequests: ['Early check-in'],
      lastActivity: '1 day ago',
    },
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load guests from API with room mapping by hotel
  const loadGuests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAllGuests();
      const guestsRaw: any[] = Array.isArray(response) ? response : (response?.data || []);
  
      // Collect unique hotel_ids
      const uniqueHotelIds = Array.from(
        new Set(
          guestsRaw
            .map((g) => g?.hotel_id)
            .filter((v) => v !== undefined && v !== null)
        )
      );
  
      // Fetch rooms for each hotel
      const hotelIdToRooms: Record<string, string[]> = {};

      // Fetch rooms for each hotel
      const roomsResults = await Promise.all(
        uniqueHotelIds.map(async (hid) => {
          try {
            const rooms = await adminApi.getAllRooms(hid);
            const roomNumbers = (rooms || []).map((r: any) => r?.room_number || r?.roomNumber);
            // Shuffle rooms (optional) to avoid always picking the first
            return { hid, roomNumbers };
          } catch (e) {
            return { hid, roomNumbers: [] };
          }
        })
      );
      roomsResults.forEach(({ hid, roomNumbers }) => {
        hotelIdToRooms[hid] = [...roomNumbers]; // copy array
      });
      
      // Assign room numbers uniquely
      const hotelAssignedRooms: Record<string, Set<string>> = {};
      
      console.log('🔍 Guests Response:', response);
      console.log('🔍 Guests Raw:', guestsRaw);
      
      // Fetch reservations from PynBooking API
      let reservationsRaw: any[] = [];
      try {
        const reservationsResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/api/pynbooking/reservations`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (reservationsResponse.ok) {
          const resData = await reservationsResponse.json();
          reservationsRaw = Array.isArray(resData) ? resData : (resData?.data || []);
          console.log('🔍 PynBooking Reservations:', reservationsRaw);
        }
      } catch (e) {
        console.log('PynBooking reservations API error:', e);
      }
      
      // Create guest-to-room mapping from reservations
      const guestRoomMap = new Map();
      reservationsRaw.forEach((res: any) => {
        const guestId = res?.guest_id || res?.guestId;
        const roomId = res?.room_id || res?.roomId;
        const roomNumber = res?.room_number || res?.roomNumber;
        if (guestId && (roomId || roomNumber)) {
          guestRoomMap.set(String(guestId), roomNumber || roomId);
        }
      });
      
      // Also check feedback data for room numbers as fallback
      const feedbackRoomMap = new Map();
      try {
        const feedbackData = await adminApi.getAllFeedback();
        const feedbackList = Array.isArray(feedbackData) ? feedbackData : [];
        
        // Sort by timestamp to get most recent feedback first
        const sortedFeedback = feedbackList.sort((a: any, b: any) => {
          const timeA = new Date(a?.submitted_time || 0).getTime();
          const timeB = new Date(b?.submitted_time || 0).getTime();
          return timeB - timeA; // Most recent first
        });
        
        const usedRooms = new Set();
        sortedFeedback.forEach((fb: any) => {
          const guestName = fb?.guest_name?.toLowerCase().trim();
          const roomNumber = fb?.room_number;
          if (guestName && roomNumber && !usedRooms.has(roomNumber)) {
            feedbackRoomMap.set(guestName, roomNumber);
            usedRooms.add(roomNumber);
          }
        });
      } catch (e) {
        console.log('Could not fetch feedback for room mapping:', e);
      }
      
      const transformedGuests: Guest[] = guestsRaw.map((g: any) => {
        const guestId = g?.guest_id || g?.id;
        const guestName = `${g?.first_name || ''} ${g?.last_name || ''}`.trim();
        
        // Try multiple sources for room number (priority order)
        let roomNumber = guestRoomMap.get(String(guestId)) || // Reservations first
                        g?.room_number || 
                        g?.roomNumber || 
                        feedbackRoomMap.get(guestName.toLowerCase()) || // Feedback fallback
                        'N/A';
        
        console.log(`🔍 Guest ${guestName} (ID: ${guestId}) -> Room: ${roomNumber}`);
        
        return {
          id: guestId || `${g?.email || ''}`,
          name: guestName || 'Guest',
          email: g?.email || '-',
          phone: g?.phone || '-',
          roomNumber: roomNumber,
          checkIn: g?.check_in || g?.checkIn || '',
          checkOut: g?.check_out || g?.checkOut || '',
          status: g?.status || 'pending',
          address: g?.address || 'N/A',
          specialRequests: g?.specialRequests || [],
          lastActivity: g?.lastActivity || 'Just now',
        } as Guest;
      });
        
      setGuestList(transformedGuests);
    } catch (err) {
      console.error('Error loading guests:', err);
      setError('Failed to load guests.');
    } finally {
      setIsLoading(false);
    }
  };
  

  // Load guests on component mount
  useEffect(() => {
    loadGuests();
  }, []);

  // Status badge
  // Status badge - simple text (no background colors)
// Status badge - simple text (Checked Out par border + rounded)
const getStatusBadge = (status: string) => {
  switch (status) {
    case "checked-in":
      return (
        <span className="text-green-600 dark:text-green-400 border border-green-400 dark:border-green-600 rounded-md px-2 py-0.5 text-sm font-medium">
          Checked In
        </span>
      );
    case "checked-out":
      return (
        <span className="text-gray-700 dark:text-gray-300 border border-gray-400 dark:border-gray-600 rounded-md px-2 py-0.5 text-sm font-medium">
          Checked Out
        </span>
      );
    case "pending":
      return (
        <span className="text-yellow-600 border border-yellow-400 dark:border-yellow-600 rounded-md px-2 py-0.5 text-sm dark:text-yellow-400 font-medium">
          Pending
        </span>
      );
    default:
      return (
        <span className="text-gray-600 dark:text-gray-400  font-medium">
          {status}
        </span>
      );
  }
};


  // Sorting
  const handleSort = (column: keyof Guest) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Add Guest
  const handleAddGuest = async () => {
    // Validate required fields
    if (!newGuestForm.first_name || !newGuestForm.last_name || !newGuestForm.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateGuestPayload = {
        first_name: newGuestForm.first_name,
        last_name: newGuestForm.last_name,
        email: newGuestForm.email,
        phone: newGuestForm.phone,
        language: newGuestForm.language,
        hotel_id: newGuestForm.hotel_id || 'default-hotel-id', // You might want to get this from context
      };

      const response = await adminApi.createGuest(payload);
      
      if (response.success && response.data) {
        const d = response.data;
        setGuestList((prev) => [
          ...prev,
          {
            id: d.id || d.email,
            name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Guest',
            email: d.email || '-',
            phone: d.phone || '-',
            roomNumber: 'N/A', // Not available in GuestData
            checkIn: '', // Not available in GuestData
            checkOut: '', // Not available in GuestData
            status: 'pending', // Not available in GuestData
            address: 'N/A', // Not available in GuestData
            specialRequests: [], // Not available in GuestData
            lastActivity: 'Just now',
          }
        ]);
      }
      // Reload guests from API (to ensure sync with backend)
      await loadGuests();
      resetForm();
      
      // Show success message
      const event = new CustomEvent('showToast', {
        detail: { 
          type: 'success', 
          title: 'Guest Added', 
          message: `Guest ${newGuestForm.first_name} ${newGuestForm.last_name} has been added successfully!` 
        }
      });
      window.dispatchEvent(event);
    } catch (err: any) {
      console.error('Error creating guest:', err);
      let message = 'Failed to create guest';
      
      if (err instanceof ApiError) {
        message = err.message || 'Failed to create guest';
      } else if (err?.message) {
        message = err.message;
      }
      
      setError(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Guest
  const handleUpdateGuest = () => {
    if (!selectedGuest) return;

    // Validate required fields
    if (!newGuestForm.first_name || !newGuestForm.last_name || !newGuestForm.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    const updatedGuests = guestList.map((g) =>
      g.id === selectedGuest.id
        ? {
            ...g,
            name: `${newGuestForm.first_name} ${newGuestForm.last_name}`,
            email: newGuestForm.email,
            phone: newGuestForm.phone,
            lastActivity: 'Just now',
          }
        : g
    );

    setGuestList(updatedGuests);
    setSelectedGuest(null);
    setShowUpdateModal(false);
    resetForm();
    
    // Show success message
    alert(`Guest ${newGuestForm.first_name} ${newGuestForm.last_name} has been updated successfully!`);
  };

  const resetForm = () => {
    setNewGuestForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      language: 'English',
      hotel_id: '',
    });
    setSelectedGuest(null);
    setShowGuestModal(false);
    setShowUpdateModal(false);
  };

  const handleOpenModal = (guest?: Guest) => {
    if (guest) {
      setSelectedGuest(guest);
      // Parse the name to get first and last name
      const nameParts = guest.name.split(' ');
      setNewGuestForm({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: guest.email,
        phone: guest.phone,
        language: 'English',
        hotel_id: '',
      });
      setShowUpdateModal(true);
    } else {
      setShowGuestModal(true);
    }
  };

  // Filter & sort
  const filteredAndSortedGuests = guestList
    .filter(
      (guest) =>
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.roomNumber.includes(searchTerm)
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

  // Pagination
  const totalGuests = filteredAndSortedGuests.length;
  const totalPages = Math.ceil(totalGuests / itemsPerPage);
  const paginatedGuests = filteredAndSortedGuests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 p-4 min-h-screen bg-background dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 cursor-wait select-none" style={{ pointerEvents: 'all' }}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Guests</h3>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we fetch guest data...</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Guest Management</h1>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm mt-1">
              {error}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="default"
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => handleOpenModal()}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          {isLoading ? 'Loading...' : 'Add Guest'}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4 bg-gray-50 dark:bg-gray-800">
          <div className="relative flex-1 bg-gray-50 dark:bg-gray-800">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search guests"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
            />
          </div>
          <span className="text-sm">{totalGuests} guests found</span>
        </CardContent>
      </Card>

      {/* Guest Table */}
      <Card>
        <CardHeader className="bg-gray-50 dark:bg-gray-800">
          <CardTitle>Guest List</CardTitle>
          <CardDescription>
            All registered guests and their current status
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-gray-50 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1"
                    >
                      Name <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="p-3 text-left">Room</th>
                  <th className="p-3 text-left">Check-in</th>
                  <th className="p-3 text-left">Check-out</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="p-6 text-center text-sm text-gray-600 dark:text-gray-300" colSpan={6}>
                      Loading guests...
                    </td>
                  </tr>
                ) : paginatedGuests.length === 0 ? (
                  <tr>
                    <td className="p-6 text-center text-sm text-gray-600 dark:text-gray-300" colSpan={6}>
                      No guests found.
                    </td>
                  </tr>
                ) : (
                paginatedGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="border-t hover:bg-muted/5 dark:hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-medium">{guest.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {guest.email}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">Room {guest.roomNumber || '-'}</Badge>
                    </td>
                    <td className="p-3 text-sm">{guest.checkIn ? formatDate(guest.checkIn) : '-'}</td>
                    <td className="p-3 text-sm">{guest.checkOut ? formatDate(guest.checkOut) : '-'}</td>
                    <td className="p-3">{getStatusBadge(guest.status)}</td>
                    <td className="p-3 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(guest)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {guest.status === 'checked-in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => alert(`Checking out ${guest.name}`)}
                        >
                          <LogOut className="h-4 w-4 mr-1 text-gray-900 dark:text-gray-200" />
                          Check-out
                        </Button>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 p-2 rounded">
  <span className="text-sm text-gray-700 dark:text-gray-200">Rows per page:</span>
  <select
    value={itemsPerPage}
    onChange={(e) => {
      setItemsPerPage(Number(e.target.value));
      setCurrentPage(1);
    }}
    className="border rounded p-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
  >
    <option value={5}>5</option>
    <option value={10}>10</option>
    <option value={20}>20</option>
  </select>
</div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Prev
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Guest Modal */}
     {showGuestModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-auto">
    <Card className="w-full max-w-lg p-6 relative">
      <CardHeader className="flex justify-center items-center relative">
        <CardTitle>Add Guest</CardTitle>
        {/* Absolute positioned X button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={resetForm}
          className="absolute top-2 right-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 min-h-[80vh] max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name *"
            value={newGuestForm.first_name}
            onChange={(e) =>
              setNewGuestForm({ ...newGuestForm, first_name: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Last Name *"
            value={newGuestForm.last_name}
            onChange={(e) =>
              setNewGuestForm({ ...newGuestForm, last_name: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <input
          type="email"
          placeholder="Email *"
          value={newGuestForm.email}
          onChange={(e) =>
            setNewGuestForm({ ...newGuestForm, email: e.target.value })
          }
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={newGuestForm.phone}
          onChange={(e) =>
            setNewGuestForm({ ...newGuestForm, phone: e.target.value })
          }
          className="w-full p-2 border rounded"
        />
        <select
          value={newGuestForm.language}
          onChange={(e) =>
            setNewGuestForm({ ...newGuestForm, language: e.target.value })
          }
          className="w-full p-2 border rounded"
        >
          <option value="English">English</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Spanish">Spanish</option>
          <option value="Italian">Italian</option>
          <option value="Hindi">Hindi</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
          <option value="Arabic">Arabic</option>
        </select>
        <input
          type="text"
          placeholder="Hotel ID (optional)"
          value={newGuestForm.hotel_id}
          onChange={(e) =>
            setNewGuestForm({ ...newGuestForm, hotel_id: e.target.value })
          }
          className="w-full p-2 border rounded"
        />
        {/* <textarea
          placeholder="Address"
          value={newGuestForm.address}
          onChange={(e) =>
            setNewGuestForm({ ...newGuestForm, address: e.target.value })
          }
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Special Requests (comma separated)"
          value={newGuestForm.specialRequests}
          onChange={(e) =>
            setNewGuestForm({
              ...newGuestForm,
              specialRequests: e.target.value,
            })
          }
          className="w-full p-2 border rounded"
        /> */}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-2 sticky bottom-0 bg-background p-2">
          <Button
            variant="outline"
            onClick={resetForm}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleAddGuest}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Guest'}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}

      {/* Update Guest Modal */}
      {showUpdateModal && selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-auto">
          <Card className="w-full max-w-lg p-6 relative">
            <CardHeader className="flex justify-center items-center relative">
              <CardTitle>Update Guest - {selectedGuest.name}</CardTitle>
              {/* Absolute positioned X button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 min-h-[80vh] max-h-[90vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    value={newGuestForm.first_name}
                    onChange={(e) =>
                      setNewGuestForm({ ...newGuestForm, first_name: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={newGuestForm.last_name}
                    onChange={(e) =>
                      setNewGuestForm({ ...newGuestForm, last_name: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={newGuestForm.email}
                    onChange={(e) =>
                      setNewGuestForm({ ...newGuestForm, email: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={newGuestForm.phone}
                    onChange={(e) =>
                      setNewGuestForm({ ...newGuestForm, phone: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <select
                    value={newGuestForm.language}
                    onChange={(e) =>
                      setNewGuestForm({ ...newGuestForm, language: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="English">English</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Italian">Italian</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hotel ID</label>
                  <input
                    type="text"
                    value={newGuestForm.hotel_id}
                    onChange={(e) =>
                      setNewGuestForm({ ...newGuestForm, hotel_id: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Current Status Display */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <label className="block text-sm font-medium mb-1">Current Status</label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedGuest.status)}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Last activity: {selectedGuest.lastActivity}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-background p-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleUpdateGuest}
                >
                  Update Guest
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};

export default GuestManagement;
