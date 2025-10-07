import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, isWithinInterval } from 'date-fns';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import adminApi from '../services/api';

interface ReservationEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    guestName: string;
    roomNumber: string;
    status: string;
    guestId: number;
    roomId: number;
    checkIn: string;
    checkOut: string;
  };
}

const ReservationsCalendar = () => {
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize the localizer with date-fns
  const localizer = dateFnsLocalizer({
    format,
    startOfWeek: () => new Date(),
    getDay,
    locales: {},
  });

  // Custom date navigation
  const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    switch (action) {
      case 'PREV':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
      case 'NEXT':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
      case 'TODAY':
        setCurrentDate(new Date());
        break;
    }
  };

  // Fetch reservations from the API
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get selected hotel ID
      const selectedHotel = localStorage.getItem('selected_hotel');
      const hotelId = selectedHotel ? JSON.parse(selectedHotel).hotel_id || JSON.parse(selectedHotel).id : null;
      
      if (!hotelId) {
        throw new Error('No hotel selected');
      }

      // Fetch reservations
      const reservations = await adminApi.getAllReservations(hotelId);
      
      // Transform reservations into calendar events
      const calendarEvents = reservations.map((reservation: any) => {
        const checkIn = new Date(reservation.check_in_time || reservation.check_in);
        const checkOut = new Date(reservation.check_out_time || reservation.check_out);
        
        return {
          id: reservation.reservation_id || reservation.id,
          title: `${reservation.guest_name || 'Guest'} (Room ${reservation.room_number || 'N/A'})`,
          start: checkIn,
          end: checkOut,
          allDay: true,
          resource: {
            guestName: reservation.guest_name || 'Guest',
            roomNumber: reservation.room_number || 'N/A',
            status: reservation.status || 'confirmed',
            guestId: reservation.guest_id,
            roomId: reservation.room_id,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
          },
        };
      });
      
      setEvents(calendarEvents);
    } catch (err: any) {
      console.error('Error fetching reservations:', err);
      const errorMessage = err.message || 'Failed to load reservation data';
      setError(errorMessage);
      
      // Show toast using custom event
      const event = new CustomEvent('showToast', { 
        detail: { 
          type: 'error', 
          title: 'Error', 
          message: errorMessage 
        } 
      });
      window.dispatchEvent(event);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchReservations();
    
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(fetchReservations, 60000);
    
    return () => clearInterval(interval);
  }, [fetchReservations]);

  // Custom event component
  const EventComponent = ({ event }: { event: ReservationEvent }) => {
    const statusColors: Record<string, string> = {
      'checked-in': 'bg-green-100 text-green-800 border-green-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'completed': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    const status = event.resource?.status?.toLowerCase() || 'confirmed';
    const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    
    return (
      <div className="p-1 text-xs">
        <div className={`p-1 rounded border ${statusColor} truncate`}>
          <div className="font-medium truncate">{event.title}</div>
          <div className="text-xs opacity-80 truncate">
            {format(event.start, 'h:mma')} - {format(event.end, 'h:mma')}
          </div>
        </div>
      </div>
    );
  };

  // Custom toolbar
  const CustomToolbar = (toolbar: any) => {
    const { date, onView, view } = toolbar;
    
    return (
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('TODAY')}
              className="h-8"
            >
              Today
            </Button>
            <div className="flex items-center space-x-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => navigate('PREV')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => navigate('NEXT')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 font-semibold text-lg px-2"
              disabled
            >
              {format(date, 'MMMM yyyy')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 ml-2"
              onClick={fetchReservations}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={view === Views.MONTH ? 'default' : 'ghost'} 
              size="sm" 
              className="h-8"
              onClick={() => onView(Views.MONTH)}
            >
              Month
            </Button>
            <Button 
              variant={view === Views.WEEK ? 'default' : 'ghost'} 
              size="sm" 
              className="h-8"
              onClick={() => onView(Views.WEEK)}
            >
              Week
            </Button>
            <Button 
              variant={view === Views.DAY ? 'default' : 'ghost'} 
              size="sm" 
              className="h-8"
              onClick={() => onView(Views.DAY)}
            >
              Day
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Event style getter
  const eventStyleGetter = (event: ReservationEvent) => {
    const status = event.resource?.status?.toLowerCase() || 'confirmed';
    const backgroundColor = {
      'checked-in': '#d1fae5',
      'confirmed': '#dbeafe',
      'pending': '#fef3c7',
      'cancelled': '#fee2e2',
      'completed': '#e5e7eb',
    }[status] || '#e5e7eb';
    
    const borderColor = {
      'checked-in': '#a7f3d0',
      'confirmed': '#bfdbfe',
      'pending': '#fde68a',
      'cancelled': '#fca5a5',
      'completed': '#d1d5db',
    }[status] || '#d1d5db';
    
    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '4px',
        color: '#1f2937',
        border: 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      },
    };
  };

  // Handle event click
  const handleSelectEvent = (event: ReservationEvent) => {
    const eventDetail = new CustomEvent('showToast', {
      detail: {
        type: 'info',
        title: 'Reservation Details',
        message: `
          Guest: ${event.resource.guestName}
          Room: ${event.resource.roomNumber}
          Check-in: ${format(new Date(event.resource.checkIn), 'PPp')}
          Check-out: ${format(new Date(event.resource.checkOut), 'PPp')}
          Status: ${event.resource.status}
        `
      }
    });
    window.dispatchEvent(eventDetail);
  };

  // Filter events to only show those in the current month view
  const filteredEvents = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    return events.filter(event => {
      return isWithinInterval(event.start, { start, end }) || 
             isWithinInterval(event.end, { start, end }) ||
             (event.start <= start && event.end >= end);
    });
  }, [events, currentDate]);

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error loading reservations: {error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={fetchReservations}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Reservations Calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[700px]">
          <BigCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            components={{
              event: EventComponent,
              toolbar: CustomToolbar,
            }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            defaultView={Views.MONTH}
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            selectable
            popup
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function for date-fns localizer
function getDay(date: Date) {
  const day = date.getDay();
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  return day === 0 ? 6 : day - 1;
}

export default ReservationsCalendar;
