import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatDate } from "../lib/utils";
import adminApi from "../services/api";

interface GuestWithRoom {
  guest_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  room?: {
    room_number: string;
    check_in_time: string;
    check_out_time: string;
    is_checked_in: boolean;
  };
}

const Reservations = () => {
  const [guests, setGuests] = useState<GuestWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuestsWithRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.getGuestsWithRooms();
        setGuests(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load guest data');
      } finally {
        setLoading(false);
      }
    };

    fetchGuestsWithRooms();
  }, []);

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
          Total: {guests.length} guests
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Room</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Check-in</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Check-out</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {guests.map((guest) => (
                  <tr key={guest.guest_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {guest.first_name} {guest.last_name}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{guest.email}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{guest.phone}</td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {guest.room?.room_number || 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {guest.room?.check_in_time ? formatDate(guest.room.check_in_time) : 'N/A'}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {guest.room?.check_out_time ? formatDate(guest.room.check_out_time) : 'N/A'}
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={
                          !guest.room ? "secondary" : 
                          guest.room.is_checked_in ? "success" : "destructive"
                        }
                      >
                        {!guest.room ? 'No Room' : 
                         guest.room.is_checked_in ? 'Checked In' : 'Not Checked In'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reservations;