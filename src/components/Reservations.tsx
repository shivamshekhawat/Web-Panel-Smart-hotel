import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar, List } from "lucide-react";
import { formatDate } from "../lib/utils";
import adminApi from "../services/api";
import ReservationsCalendar from "./ReservationsCalendar";

interface ReservationData {
  guest_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  room_number?: string;
  check_in_time?: string;
  check_out_time?: string;
  is_checked_in: boolean;
}

const Reservations = () => {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  
  // Ensure we always have an array to map over
  const safeReservations = Array.isArray(reservations) ? reservations : [];

  const fetchReservations = useCallback(async () => {
    if (loadingRef.current) {
      console.log('🏨 Already loading reservations, skipping...');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
        // Get selected hotel ID
        const selectedHotel = localStorage.getItem('selected_hotel');
        const hotelId = selectedHotel ? JSON.parse(selectedHotel).hotel_id || JSON.parse(selectedHotel).id : null;
        
        // Fetch reservations, guests, and rooms in parallel
        const [reservationsData, guestsData, roomsData] = await Promise.all([
          adminApi.getAllReservations(hotelId),
          adminApi.getAllGuests(hotelId),
          adminApi.getAllRooms(hotelId)
        ]);

        // Normalize data from different response formats
        const guests = Array.isArray(guestsData) 
          ? guestsData 
          : (guestsData as any)?.response || (guestsData as any)?.data || [];
          
        const rooms = Array.isArray(roomsData) 
          ? roomsData 
          : (roomsData as any)?.response || (roomsData as any)?.data || [];
          
        const reservations = Array.isArray(reservationsData) 
          ? reservationsData 
          : (reservationsData as any)?.response || (reservationsData as any)?.data || [];

        // Create maps for quick lookup
        const guestMap = new Map();
        guests.forEach((guest: any) => {
          const guestId = guest.guest_id || guest.id;
          guestMap.set(guestId, guest);
        });

        const roomMap = new Map();
        rooms.forEach((room: any) => {
          const roomId = room.id || room.room_id;
          roomMap.set(roomId, room);
        });

        // Create reservation map for quick lookup
        const reservationMap = new Map();
        const seenReservations = new Set<string>();
        
        reservations.forEach((reservation: any) => {
          const guestIds = Array.isArray(reservation.guest_id) ? reservation.guest_id : [reservation.guest_id];
          const roomIds = Array.isArray(reservation.room_id) ? reservation.room_id : [reservation.room_id];
          
          // Handle array format from your API
          guestIds.forEach((guestId: any, index: number) => {
            const roomId = roomIds[index] || roomIds[0];
            const dedupeKey = `${guestId}-${roomId}`;
            
            if (!seenReservations.has(dedupeKey) && guestId && guestMap.has(guestId)) {
              seenReservations.add(dedupeKey);
              const room = roomMap.get(roomId);
              const roomNumber = room?.room_number || room?.roomNumber || room?.number;
              
              reservationMap.set(guestId, {
                room_number: roomNumber,
                check_in_time: reservation.check_in_time || reservation.check_in,
                check_out_time: reservation.check_out_time || reservation.check_out,
                is_checked_in: reservation.is_checked_in || false,
              });
            }
          });
        });

        // Combine all guests with their reservation data
        const combinedData = (Array.isArray(guests) ? guests : [])
          .map((guest: any): ReservationData | null => {
            try {
              const guestId = guest?.guest_id || guest?.id;
              if (!guestId) return null;
              
              const reservationData = reservationMap.get(guestId);
              
              return {
                guest_id: guestId,
                first_name: guest?.first_name || '',
                last_name: guest?.last_name || '',
                email: guest?.email || '',
                phone: guest?.phone || '',
                room_number: reservationData?.room_number,
                check_in_time: reservationData?.check_in_time,
                check_out_time: reservationData?.check_out_time,
                is_checked_in: Boolean(reservationData?.is_checked_in),
              };
            } catch (err) {
              console.error('Error processing guest:', guest, err);
              return null;
            }
          })
          .filter((item): item is ReservationData => item !== null); // Type guard to filter out nulls

        setReservations(combinedData);
      } catch (err: any) {
        console.error('Error fetching reservations:', err);
        setError(err.message || 'Failed to load reservation data');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchReservations();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchReservations]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Reservations</h3>
          <p className="text-slate-500 dark:text-slate-400">Please wait while we fetch guest data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error Loading Reservations</h3>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {safeReservations.length} {safeReservations.length === 1 ? 'guest' : 'guests'}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <Tabs defaultValue="list" className="w-full">
            <div className="flex justify-between items-center">
              <CardTitle>Guest Reservations</CardTitle>
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span>List View</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Calendar View</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="mt-6">
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Guest</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check-in</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check-out</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {safeReservations.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              No reservations found
                            </td>
                          </tr>
                        ) : (
                        safeReservations.map((reservation) => (
                          <tr key={reservation.guest_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {reservation.first_name} {reservation.last_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  ID: {reservation.guest_id}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col space-y-1">
                                <div className="text-sm text-gray-900 dark:text-gray-300">{reservation.email}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{reservation.phone}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge variant={reservation.room_number ? "default" : "secondary"} className="font-medium">
                                {reservation.room_number || 'N/A'}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                {reservation.check_in_time ? (
                                  <div className="flex flex-col">
                                    <span>{new Date(reservation.check_in_time).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(reservation.check_in_time).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                {reservation.check_out_time ? (
                                  <div className="flex flex-col">
                                    <span>{new Date(reservation.check_out_time).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(reservation.check_out_time).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge 
                                variant={
                                  !reservation.room_number ? "secondary" : 
                                  reservation.is_checked_in ? "default" : "outline"
                                }
                                className={
                                  !reservation.room_number ? "bg-gray-100 text-gray-600" : 
                                  reservation.is_checked_in ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                }
                              >
                                {!reservation.room_number ? 'No Room' : 
                                 reservation.is_checked_in ? 'Checked In' : 'Pending'}
                              </Badge>
                            </td>
                          </tr>
                        )))
                        }
                      </tbody>
                    </table>
                  </div>
                </CardContent>
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
              <ReservationsCalendar />
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Reservations;