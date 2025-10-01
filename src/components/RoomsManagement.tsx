"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { adminApi,  } from "../services/api"
import pynBookingApi from "../services/pynBookingApi"
import {
  Bed,
  Users,
  Heart,
  Calendar,
  CreditCard,
  Search,

  Home,
  
  
  
  
  
  
  
  
  
  
  CheckCircle2,
  Wrench,
  User2,
} from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
// import { Badge } from "../components/ui/badge"
import RoomDetailsModalComponent from "./RoomDetailsModal"

interface RoomDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  room: {
    id: string
    number: string
    type: string
    floor: number
    status: "available" | "occupied" | "maintenance" | "cleaning"
    capacity?: number
    guestName?: string
    guestEmail?: string
    guestPhone?: string
    checkIn?: string
    checkOut?: string
    specialRequests?: string
  }
}

const statusColors: Record<string, string> = {
  available: "text-blue-600 dark:text-blue-400",
  occupied: "text-blue-600 dark:text-blue-400",
  maintenance: "text-blue-600 dark:text-blue-400",
  cleaning: "text-blue-600 dark:text-blue-400",
}

type RoomType = "standard" | "deluxe" | "suite" | "family" | "executive"
type RoomStatus = "available" | "occupied" | "maintenance" | "cleaning"

const roomTypeIcons = {
  standard: <Home className="h-4 w-4" />,
  deluxe: <Bed className="h-4 w-4" />,
  suite: <Heart className="h-4 w-4" />,
  family: <Users className="h-4 w-4" />,
  executive: <CreditCard className="h-4 w-4" />,
}





const RoomsManagement: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<RoomDetailsModalProps["room"] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all")
  const [floorFilter, setFloorFilter] = useState<number | "all">("all")
  const [sortOrder] = useState<"asc" | "desc">("asc")
  const [rooms, setRooms] = useState<RoomDetailsModalProps["room"][]>([])
  const [showAddRoomModal, setShowAddRoomModal] = useState(false)
  const [showUpdateRoomModal, setShowUpdateRoomModal] = useState(false)
  const [newRoom, setNewRoom] = useState<RoomDetailsModalProps["room"]>({
    id: (Date.now()).toString(),
    number: "",
    type: "standard",
    floor: 1,
    status: "available",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reservation state (additive, does not change existing logic)
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [reserveRoom, setReserveRoom] = useState<RoomDetailsModalProps["room"] | null>(null)
  const [reservationForm, setReservationForm] = useState({
    guestId: "",
    guestName: "",
    checkIn: "",
    checkOut: "",
  })
  const [isReserving, setIsReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [guests, setGuests] = useState<Array<{id: string, name: string}>>([])
  const [isLoadingGuests, setIsLoadingGuests] = useState(false)

  // Load rooms from API
  const loadRooms = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Helper: transform a backend room object into UI room shape handling variant keys
      const toUiRoom = (r: any): RoomDetailsModalProps["room"] => {
        const numberRaw = r?.room_number ?? r?.roomNumber ?? r?.number ?? r?.room ?? r?.id ?? "";
        const statusRaw = (r?.status ?? (r?.availability === false ? "occupied" : r?.availability ? "available" : "")).toString().toLowerCase();
        const mappedStatus: RoomStatus = statusRaw.includes("occup")
          ? "occupied"
          : statusRaw.includes("maint")
            ? "maintenance"
            : statusRaw.includes("clean")
              ? "cleaning"
              : "available";
        const typeRaw = (r?.room_type ?? r?.type ?? "standard").toString().toLowerCase();
        const allowedTypes = new Set(["standard", "deluxe", "suite", "family", "executive"]);
        const safeType = (allowedTypes.has(typeRaw) ? typeRaw : "standard") as RoomType;
        const floor = Number(r?.floor ?? r?.floor_number ?? r?.floorNumber ?? 1) || 1;
        const capacityAdults = Number(r?.capacity_adults ?? r?.adults ?? 0) || 0;
        const capacityChildren = Number(r?.capacity_children ?? r?.children ?? 0) || 0;
        const guestFirst = r?.guest?.first_name ?? r?.guest_first_name;
        const guestLast = r?.guest?.last_name ?? r?.guest_last_name;
        const guestFull = r?.guest_name ?? r?.guest_full_name ?? r?.guestName ?? r?.guest?.name ?? (guestFirst && guestLast ? `${guestFirst} ${guestLast}` : (guestFirst || guestLast));
        return {
          id: String(r?.id ?? r?.room_id ?? r?._id ?? numberRaw ?? Date.now()),
          number: String(numberRaw),
          type: safeType,
          floor,
          status: mappedStatus,
          capacity: capacityAdults + capacityChildren,
          guestName: guestFull || undefined,
          guestEmail: r?.guest_email ?? r?.guest?.email ?? undefined,
          guestPhone: r?.guest_phone ?? r?.guest?.phone ?? undefined,
          checkIn: r?.check_in_time ?? r?.check_in ?? r?.checkIn ?? r?.checkin_date ?? r?.checkinDate ?? undefined,
          checkOut: r?.check_out_time ?? r?.check_out ?? r?.checkOut ?? r?.checkout_date ?? r?.checkoutDate ?? undefined,
        };
      };

      // Get selected hotel ID
      const selectedHotel = localStorage.getItem('selected_hotel');
      const hotelId = selectedHotel ? JSON.parse(selectedHotel).hotel_id || JSON.parse(selectedHotel).id : null;
      
      // Fetch rooms, guests, and reservations in parallel
      const [roomsResponse, guestsWithRoomsResponse, reservationsResponse] = await Promise.all([
        adminApi.getAllRooms(hotelId),
        adminApi.getGuestsWithRooms().catch(() => []),
        adminApi.getAllReservations(hotelId).catch(() => [])
      ]);

      console.log("getAllRooms() response:", roomsResponse);
      console.log("getGuestsWithRooms() response:", guestsWithRoomsResponse);
      console.log("getAllReservations() response:", reservationsResponse);

      const roomsData = Array.isArray(roomsResponse) ? roomsResponse : (roomsResponse as any)?.data ?? [];
      const guestsData = Array.isArray(guestsWithRoomsResponse) ? guestsWithRoomsResponse : [];
      const reservationsData = Array.isArray(reservationsResponse) ? reservationsResponse : [];

      // Create a map of room numbers to reservation data
      const roomReservationMap = new Map();
      
      // First, map from reservations API (primary source)
      reservationsData.forEach((reservation: any) => {
        const roomId = reservation?.room_id;
        const guestId = reservation?.guest_id;
        
        if (roomId && guestId) {
          // Find the room number from rooms data
          const room = roomsData.find((r: any) => String(r.id || r.room_id) === String(roomId));
          const roomNumber = room?.room_number || room?.roomNumber || room?.number;
          
          // Find guest info from guests data
          const guest = guestsData.find((g: any) => String(g.guest_id || g.id) === String(guestId));
          
          if (roomNumber) {
            roomReservationMap.set(String(roomNumber), {
              guestName: guest ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() : 'Guest',
              guestEmail: guest?.email || '',
              guestPhone: guest?.phone || '',
              checkIn: reservation.check_in_time || reservation.check_in || reservation.checkIn,
              checkOut: reservation.check_out_time || reservation.check_out || reservation.checkOut,
              isCheckedIn: reservation.is_checked_in || false,
            });
          }
        }
      });
      
      // Fallback: map from guests with rooms data
      guestsData.forEach((guest: any) => {
        const roomNumber = guest?.room_number ?? guest?.roomNumber ?? guest?.room?.number;
        if (roomNumber && !roomReservationMap.has(String(roomNumber))) {
          roomReservationMap.set(String(roomNumber), {
            guestName: `${guest.first_name || ''} ${guest.last_name || ''}`.trim(),
            guestEmail: guest.email,
            guestPhone: guest.phone,
            checkIn: guest.check_in_time ?? guest.check_in ?? guest.checkIn,
            checkOut: guest.check_out_time ?? guest.check_out ?? guest.checkOut,
            isCheckedIn: false,
          });
        }
      });

      const transformedRooms: RoomDetailsModalProps["room"][] = (roomsData || []).map((r: any) => {
        console.log('Raw room data:', r);
        const room = toUiRoom(r);
        
        // Merge reservation data if available
        const reservationData = roomReservationMap.get(room.number);
        if (reservationData) {
          return {
            ...room,
            status: 'occupied' as RoomStatus,
            guestName: reservationData.guestName || room.guestName,
            guestEmail: reservationData.guestEmail || room.guestEmail,
            guestPhone: reservationData.guestPhone || room.guestPhone,
            checkIn: reservationData.checkIn || room.checkIn,
            checkOut: reservationData.checkOut || room.checkOut,
          };
        }
        
        return room;
      }).filter((r: any) => !!r.number);

      console.log('Transformed rooms with reservations:', transformedRooms);

      if (!transformedRooms.length) {
        setError("No rooms found for the selected hotel.");
      }

      setRooms(transformedRooms)
    } catch (err) {
      console.error('Error loading rooms:', err)
      setError('Failed to load rooms from server. Please try again.')
      setRooms([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load rooms on component mount
  useEffect(() => {
    loadRooms()
  }, [])

  // Helpers for reservation form date-time handling
  const toLocalDateTimeInputValue = (date: Date) => {
    const pad = (n: number) => `${n}`.padStart(2, "0")
    const y = date.getFullYear()
    const m = pad(date.getMonth() + 1)
    const d = pad(date.getDate())
    const h = pad(date.getHours())
    const min = pad(date.getMinutes())
    return `${y}-${m}-${d}T${h}:${min}`
  }

  const nowPlusDays = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d
  }

  // Fetch guests list
  const fetchGuests = async () => {
    setIsLoadingGuests(true)
    try {
      // Get selected hotel ID
      const selectedHotel = localStorage.getItem('selected_hotel');
      const hotelId = selectedHotel ? JSON.parse(selectedHotel).hotel_id || JSON.parse(selectedHotel).id : null;
      
      const response = await adminApi.getAllGuests(hotelId)
      const guestData = Array.isArray(response) ? response : response.data || []
      const guestList = guestData.map((g: any) => ({
        id: String(g.id || g.guest_id || ''),
        name: `${g.first_name || ''} ${g.last_name || ''}`.trim()
      }))
      setGuests(guestList)
    } catch (e) {
      console.error('Failed to fetch guests:', e)
      setGuests([])
    } finally {
      setIsLoadingGuests(false)
    }
  }

  // Open/Close reservation modal
  const openReserveModal = (room: RoomDetailsModalProps["room"]) => {
    if (room.status !== "available") return
    setReserveRoom(room)
    const defaultIn = new Date()
    const defaultOut = nowPlusDays(1)
    setReservationForm({
      guestId: "",
      guestName: "",
      checkIn: toLocalDateTimeInputValue(defaultIn),
      checkOut: toLocalDateTimeInputValue(defaultOut),
    })
    setReserveError(null)
    setGuests([])
    setShowReserveModal(true)
    fetchGuests()
  }

  const closeReserveModal = () => {
    setShowReserveModal(false)
    setReserveRoom(null)
  }

  // Fetch guest info and auto-fill using backend API
  const fetchGuestById = async (guestId: string) => {
    if (!guestId) return null
    try {
      const data = await adminApi.getGuestById(guestId)
      const fullName = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
      return {
        id: String(data.guest_id ?? guestId),
        name: fullName || '',
      }
    } catch (e: any) {
      throw e
    }
  }

  const handleGuestSelection = async (guestId: string) => {
    const selectedGuest = guests.find(g => g.id === guestId)
    setReservationForm(prev => ({
      ...prev,
      guestId,
      guestName: selectedGuest?.name || ""
    }))
    
    setReserveError(null)
  }

  const handleGuestIdChange = async (guestId: string) => {
    setReservationForm(prev => ({ ...prev, guestId, guestName: "" }))
    setReserveError(null)
    
    if (!guestId.trim()) return
    
    try {
      const guest = await fetchGuestById(guestId)
      if (guest) {
        setReservationForm(prev => ({ ...prev, guestName: guest.name }))
      }
    } catch (e: any) {
      setReserveError(`Guest ID ${guestId} not found`)
    }
  }



  const submitReservation = async () => {
    if (!reserveRoom) return
    setIsReserving(true)
    setReserveError(null)
    try {
      const toIsoZ = (v: string) => new Date(v).toISOString()
      const res = await adminApi.createReservation({
        guest_id: Number(reservationForm.guestId),
        room_id: Number(reserveRoom.id),
        check_in_time: toIsoZ(reservationForm.checkIn),
        check_out_time: toIsoZ(reservationForm.checkOut),
        is_checked_in: false,
      })

      // Update room status to occupied
      setRooms(prev => prev.map(r => 
        r.id === reserveRoom.id 
          ? { ...r, status: 'occupied' as RoomStatus, guestName: reservationForm.guestName }
          : r
      ))

      // Notify dashboard to refresh
      const reservationEvent = new CustomEvent('reservationUpdated');
      window.dispatchEvent(reservationEvent);

      // Update UI and show toast
      const event = new CustomEvent('showToast', {
        detail: { type: 'success', title: 'Reservation Created', message: `Reservation ID ${res.reservation_id} for room ${reserveRoom.number}` }
      });
      window.dispatchEvent(event)

      closeReserveModal()
    } catch (e: any) {
      setReserveError(e?.message ?? 'Failed to create reservation')
    } finally {
      setIsReserving(false)
    }
  }

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        const matchesSearch =
          room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (room.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

        const matchesStatus = statusFilter === "all" || room.status === statusFilter
        const matchesFloor = floorFilter === "all" || room.floor === floorFilter

        return matchesSearch && matchesStatus && matchesFloor
      })
      .sort((a, b) => {
        return sortOrder === "asc"
          ? Number.parseInt(a.number) - Number.parseInt(b.number)
          : Number.parseInt(b.number) - Number.parseInt(a.number)
      })
  }, [rooms, searchTerm, statusFilter, floorFilter, sortOrder])

  const handleRoomClick = (room: RoomDetailsModalProps["room"]) => {
    setSelectedRoom(room)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRoom(null)
  }



  const handleAddRoom = () => {
    if (!newRoom.number) {
      const event = new CustomEvent('showToast', {
        detail: { type: 'error', title: 'Validation Error', message: 'Please enter room number' }
      });
      window.dispatchEvent(event);
      return;
    }

    setRooms(prev => [...prev, { ...newRoom, id: Date.now().toString() }]);
    setShowAddRoomModal(false);
    setNewRoom({ id: (Date.now()).toString(), number: "", type: "standard", floor: 1, status: "available" });
    
    const event = new CustomEvent('showToast', {
      detail: { type: 'success', title: 'Room Added', message: `Room ${newRoom.number} has been successfully added` }
    });
    window.dispatchEvent(event);
  }

  const handleUpdateRoom = () => {
    if (!newRoom.number) {
      const event = new CustomEvent('showToast', {
        detail: { type: 'error', title: 'Validation Error', message: 'Please enter room number' }
      });
      window.dispatchEvent(event);
      return;
    }

    const updatedRooms = rooms.map((room) =>
      room.id === newRoom.id
        ? { ...newRoom }
        : room
    );

    setRooms(updatedRooms);
    setShowUpdateRoomModal(false);
    setNewRoom({ id: (Date.now()).toString(), number: "", type: "standard", floor: 1, status: "available" });
    
    const event = new CustomEvent('showToast', {
      detail: { type: 'success', title: 'Room Updated', message: `Room ${newRoom.number} has been successfully updated` }
    });
    window.dispatchEvent(event);
  }

  const handleOpenUpdateModal = (room: RoomDetailsModalProps["room"]) => {
    setNewRoom(room);
    setShowUpdateRoomModal(true);
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      )}
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

        <div className="flex flex-col sm:flex-row gap-3">
          {/* <Button

            className="gap-2 h-11 px-5 border bg-blue-500 text-white "
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setFloorFilter("all")
            }}
          >
            Clear Filters
          </Button> */}

          <Button

            className="gap-2 h-11 px-5 text-white bg-blue-500 "
            onClick={() => setShowAddRoomModal(true)}
          >
            Add New Room
          </Button>
        </div>

      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700  transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{rooms.length}</p>
            </div>
            <div className="h-12 w-12  flex items-center justify-center">
              <Bed className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700  transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupied</p>
              <p className="text-2xl font-bold text-black-600 ">{rooms.filter(r => r.status === 'occupied').length}</p>
            </div>
            <div className="h-12 w-12  rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700  transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'available').length}
              </p>
            </div>
            <div className="h-12 w-12   rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700  transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'maintenance').length}
              </p>
            </div>
            <div className="h-12 w-12  rounded-lg flex items-center justify-center">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search by room number"
                className="pl-10 h-12 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="min-w-[160px]">
              <select
                className="w-full h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 
             bg-white dark:bg-gray-700 text-gray-700 dark:text-white 
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
             transition-all duration-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RoomStatus | "all")}
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="cleaning">Cleaning</option>
              </select>



            </div>

            <div className="min-w-[140px]">
              <select
                className="w-full h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600
               bg-white dark:bg-gray-700 text-gray-700 dark:text-white
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               transition-all duration-200"
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">All Floors</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((floor) => (
                  <option key={floor} value={floor}>
                    Floor {floor}
                  </option>
                ))}
              </select>
            </div>


            <Button
  variant="pill"
  className="h-12 px-6 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
  onClick={() => {
    setSearchTerm("")
    setStatusFilter("all")
    setFloorFilter("all")
  }}
>
  Clear
</Button>

          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col h-full"
            onClick={() => handleRoomClick(room)}
          >
            {/* Room Header */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Room {room.number}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full px-2 py-1">
                      {roomTypeIcons[room.type as RoomType]}
                      <span className="ml-1 capitalize font-medium">{room.type}</span>
                    </span>

                    <span className="bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 font-medium">Floor {room.floor}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[room.status]}`}>
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </div>
              </div>

              {/* Reservation Button: Only show if room is available */}
              {room.status === 'available' && (
                <div className="mb-4">
                  <Button
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      openReserveModal(room);
                    }}
                  >
                    Reservation
                  </Button>
                </div>
              )}

              {/* Room Details */}
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center text-blue-700 dark:text-blue-400 mb-1">
                    <Bed className="h-4 w-4 mr-1" />
                    <span className="text-xs font-semibold uppercase">Type</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{room.type}</p>
                </div>

              </div>

              {/* Guest Information */}
              {room.guestName && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-1">Current Guest</p>
                      <p className="font-bold text-gray-900 dark:text-white">{room.guestName}</p>
                      {(room.checkIn || room.checkOut) && (
                        <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="font-medium">
                            {room.checkIn ? new Date(room.checkIn).toLocaleDateString() : 'N/A'} - {room.checkOut ? new Date(room.checkOut).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="h-10 w-10 bg-indigo-500 dark:bg-indigo-600 rounded-full flex items-center justify-center ml-3">
                      <User2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <div className="flex gap-2">
                <Button
                  variant="pill"
                  size="sm"
                  className={`flex-1 font-semibold transition-all duration-200
      border
      border-blue-300 dark:border-blue-400
      bg-transparent
      text-blue-600
    `}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoomClick(room);
                  }}
                >
                  View Details
                </Button>
                
                <Button
  // variant="pill"
  size="sm"
  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all duration-200
             focus:outline-none focus:ring-0 active:bg-blue-100"
  onClick={(e) => {
    e.stopPropagation();
    handleOpenUpdateModal(room);
  }}
>
  Edit
</Button>


              </div>
            </div>



          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 cursor-wait select-none" style={{ pointerEvents: 'all' }}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Rooms</h3>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we fetch room data...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600 mb-6">
            <Bed className="h-full w-full opacity-20" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No rooms found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            No rooms match your current search criteria. Try adjusting your filters or search terms.
          </p>
          <Button
            variant="pill"
            className="px-6 py-2"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setFloorFilter("all")
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Room Details Modal */}
      {selectedRoom && (
        <RoomDetailsModalComponent isOpen={isModalOpen} onClose={handleCloseModal} room={selectedRoom} />
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add New Room</h3>
              <button className="text-2xl text-gray-400 " onClick={() => setShowAddRoomModal(false)}>&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Room Number</label>
                <input className="w-full mt-1 px-3 py-2 border rounded-md bg-background" value={newRoom.number} onChange={e => setNewRoom({ ...newRoom, number: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select className="w-full mt-1 px-3 py-2 border rounded-md bg-background" value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value as RoomType })}>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="family">Family</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Floor</label>
                <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md bg-background" value={newRoom.floor} onChange={e => setNewRoom({ ...newRoom, floor: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium ">Status</label>
                <select className="w-full mt-1 px-3 py-2 border rounded-md " value={newRoom.status} onChange={e => setNewRoom({ ...newRoom, status: e.target.value as RoomStatus })}>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>
              

            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowAddRoomModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddRoom}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Room Modal */}
      {showUpdateRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Update Room - {newRoom.number}</h3>
              <button className="text-2xl text-gray-400" onClick={() => setShowUpdateRoomModal(false)}>&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Room Number *</label>
                <input 
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background" 
                  value={newRoom.number} 
                  onChange={e => setNewRoom({ ...newRoom, number: e.target.value })} 
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background" 
                  value={newRoom.type} 
                  onChange={e => setNewRoom({ ...newRoom, type: e.target.value as RoomType })}
                >
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="family">Family</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Floor</label>
                <input 
                  type="number" 
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background" 
                  value={newRoom.floor} 
                  onChange={e => setNewRoom({ ...newRoom, floor: Number(e.target.value) })} 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="w-full mt-1 px-3 py-2 border rounded-md" 
                  value={newRoom.status} 
                  onChange={e => setNewRoom({ ...newRoom, status: e.target.value as RoomStatus })}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>
              

            </div>
            
            {/* Current Room Info */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="block text-sm font-medium mb-2">Current Room Information</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Room ID:</span>
                  <span className="ml-2 font-medium">{newRoom.id}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="ml-2 font-medium capitalize">{newRoom.type}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowUpdateRoomModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRoom}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Update Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Room Modal */}
      {showReserveModal && reserveRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Reservation Room - {reserveRoom.number}</h3>
              <button className="text-2xl text-gray-400" onClick={closeReserveModal}>&times;</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">Guest ID</label>
                <Input
                  value={reservationForm.guestId}
                  onChange={(e) => handleGuestIdChange(e.target.value.trim())}
                  placeholder="Enter Guest ID"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={reservationForm.guestName} readOnly placeholder="Auto-filled" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Check-in</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    value={reservationForm.checkIn}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Check-out</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    value={reservationForm.checkOut}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, checkOut: e.target.value }))}
                  />
                </div>
              </div>

              {reserveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                  {reserveError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={closeReserveModal} disabled={isReserving}>
                Cancel
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={submitReservation}
                disabled={
                  isReserving || !reservationForm.guestId || !reservationForm.guestName || !reservationForm.checkIn || !reservationForm.checkOut
                }
              >
                {isReserving ? 'Saving...' : 'Save Reservation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomsManagement
