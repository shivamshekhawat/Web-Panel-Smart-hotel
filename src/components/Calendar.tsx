import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Users,
  Bed,
  Clock,
  MapPin
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface Booking {
  id: string;
  guestName: string;
  roomNumber: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'checked-in' | 'checked-out';
  type: 'booking' | 'maintenance' | 'event';
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock bookings data
  const bookings: Booking[] = [
    {
      id: '1',
      guestName: 'John Smith',
      roomNumber: '101',
      checkIn: new Date(2024, 0, 15),
      checkOut: new Date(2024, 0, 18),
      status: 'checked-in',
      type: 'booking'
    },
    {
      id: '2',
      guestName: 'Sarah Johnson',
      roomNumber: '205',
      checkIn: new Date(2024, 0, 14),
      checkOut: new Date(2024, 0, 20),
      status: 'confirmed',
      type: 'booking'
    },
    {
      id: '3',
      guestName: 'Michael Brown',
      roomNumber: '312',
      checkIn: new Date(2024, 0, 16),
      checkOut: new Date(2024, 0, 19),
      status: 'pending',
      type: 'booking'
    },
    {
      id: '4',
      guestName: 'Maintenance',
      roomNumber: '108',
      checkIn: new Date(2024, 0, 10),
      checkOut: new Date(2024, 0, 12),
      status: 'confirmed',
      type: 'maintenance'
    },
    {
      id: '5',
      guestName: 'Corporate Event',
      roomNumber: 'Conference Room',
      checkIn: new Date(2024, 0, 25),
      checkOut: new Date(2024, 0, 25),
      status: 'confirmed',
      type: 'event'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked-in':
        return <Badge variant="success">Checked In</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'checked-out':
        return <Badge variant="secondary">Checked Out</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Users className="h-4 w-4" />;
      case 'maintenance':
        return <Bed className="h-4 w-4" />;
      case 'event':
        return <CalendarIcon className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'event':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return date >= checkIn && date <= checkOut;
    });
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getDayClass = (date: Date) => {
    const baseClass = "p-2 text-center border-b border-r hover:bg-muted/50 cursor-pointer";
    const isToday = isSameDay(date, new Date());
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isCurrentMonth = isSameMonth(date, currentDate);
    
    let classes = baseClass;
    
    if (!isCurrentMonth) {
      classes += " text-muted-foreground/50";
    }
    
    if (isToday) {
      classes += " bg-primary/10 font-semibold";
    }
    
    if (isSelected) {
      classes += " bg-primary text-primary-foreground";
    }
    
    return classes;
  };

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hotel Calendar
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">View and manage bookings, events, and maintenance schedules</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">Calendar View</CardTitle>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={previousMonth}
                    className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-lg">
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={nextMonth}
                    className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-base">Click on a date to view details</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-border">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-medium bg-background">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((date, index) => {
                  const dayBookings = getBookingsForDate(date);
                  return (
                    <div
                      key={index}
                      className={getDayClass(date)}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="text-sm mb-1">
                        {format(date, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map(booking => (
                          <div
                            key={booking.id}
                            className={`text-xs p-1 rounded ${getTypeColor(booking.type)}`}
                            title={`${booking.guestName} - ${booking.roomNumber}`}
                          >
                            {getTypeIcon(booking.type)}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span className="text-sm">Bookings</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-100 rounded"></div>
                <span className="text-sm">Maintenance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-100 rounded"></div>
                <span className="text-sm">Events</span>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <CardDescription>
                  {selectedDateBookings.length} item{selectedDateBookings.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDateBookings.length > 0 ? (
                  selectedDateBookings.map(booking => (
                    <div key={booking.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(booking.type)}
                          <span className="font-medium">{booking.guestName}</span>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{booking.roomNumber}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(booking.checkIn), 'MMM d')} - {format(new Date(booking.checkOut), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No bookings for this date
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Bookings:</span>
                <span className="font-medium">{bookings.filter(b => isSameMonth(new Date(b.checkIn), currentDate)).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Confirmed:</span>
                <span className="font-medium text-green-600">
                  {bookings.filter(b => b.status === 'confirmed' && isSameMonth(new Date(b.checkIn), currentDate)).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending:</span>
                <span className="font-medium text-orange-600">
                  {bookings.filter(b => b.status === 'pending' && isSameMonth(new Date(b.checkIn), currentDate)).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
