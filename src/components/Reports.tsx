import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  BarChart3, 
  Download, 
  TrendingUp,
  DollarSign,
  Users,
  Bed,
  FileText,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { formatCurrency } from '../lib/utils';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedReport, setSelectedReport] = useState('revenue');

  // Mock data for reports
  const revenueData = [
    { month: 'Jan', revenue: 45000, occupancy: 78, guests: 234 },
    { month: 'Feb', revenue: 52000, occupancy: 82, guests: 256 },
    { month: 'Mar', revenue: 48000, occupancy: 75, guests: 221 },
    { month: 'Apr', revenue: 61000, occupancy: 88, guests: 298 },
    { month: 'May', revenue: 67000, occupancy: 92, guests: 312 },
    { month: 'Jun', revenue: 72000, occupancy: 95, guests: 345 },
  ];

  const roomTypeData = [
    { name: 'Standard', revenue: 250000, bookings: 450, avgRate: 150 },
    { name: 'Deluxe', revenue: 320000, bookings: 380, avgRate: 250 },
    { name: 'Suite', revenue: 180000, bookings: 120, avgRate: 400 },
    { name: 'Presidential', revenue: 95000, bookings: 25, avgRate: 800 },
  ];

  const occupancyTrends = [
    { day: 'Mon', occupancy: 85, revenue: 12500 },
    { day: 'Tue', occupancy: 92, revenue: 14200 },
    { day: 'Wed', occupancy: 78, revenue: 11800 },
    { day: 'Thu', occupancy: 95, revenue: 15600 },
    { day: 'Fri', occupancy: 88, revenue: 13200 },
    { day: 'Sat', occupancy: 96, revenue: 16800 },
    { day: 'Sun', occupancy: 82, revenue: 12400 },
  ];

  const guestSatisfaction = [
    { category: 'Service', rating: 4.5, reviews: 156 },
    { category: 'Cleanliness', rating: 4.7, reviews: 142 },
    { category: 'Amenities', rating: 4.3, reviews: 98 },
    { category: 'Location', rating: 4.8, reviews: 134 },
    { category: 'Value', rating: 4.2, reviews: 87 },
  ];

  const topPerformingRooms = [
    { room: '301', type: 'Presidential', revenue: 12500, occupancy: 95, rating: 4.9 },
    { room: '205', type: 'Deluxe', revenue: 8900, occupancy: 92, rating: 4.7 },
    { room: '108', type: 'Suite', revenue: 7600, occupancy: 88, rating: 4.6 },
    { room: '401', type: 'Deluxe', revenue: 7200, occupancy: 85, rating: 4.5 },
    { room: '302', type: 'Standard', revenue: 6800, occupancy: 82, rating: 4.4 },
  ];

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const avgOccupancy = revenueData.reduce((sum, item) => sum + item.occupancy, 0) / revenueData.length;
  const totalGuests = revenueData.reduce((sum, item) => sum + item.guests, 0);
  const avgRating = guestSatisfaction.reduce((sum, item) => sum + item.rating, 0) / guestSatisfaction.length;

  const handleExport = (type: string) => {
    console.log(`Exporting ${type} report for ${selectedPeriod}`);
    // Handle export logic
  };

  const handleRefresh = () => {
    console.log('Refreshing reports data');
    // Handle refresh logic
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">Comprehensive hotel performance insights and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="ml-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Type</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="ml-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="revenue">Revenue Report</option>
                <option value="occupancy">Occupancy Report</option>
                <option value="guests">Guest Analytics</option>
                <option value="satisfaction">Satisfaction Report</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white group-hover:scale-110 transition-transform duration-200">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{formatCurrency(totalRevenue)}</div>
            <p className="text-sm text-green-600 font-medium">
              <TrendingUp className="inline h-4 w-4 text-green-500" /> +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Occupancy
            </CardTitle>
            <Bed className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{avgOccupancy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Guests
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalGuests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +0.2 from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Type Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Room Type Performance</CardTitle>
            <CardDescription>Revenue by room type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roomTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Occupancy Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Occupancy & Revenue Trends</CardTitle>
          <CardDescription>Daily performance over the week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={occupancyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="occupancy" stroke="#3b82f6" strokeWidth={2} name="Occupancy %" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Guest Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Guest Satisfaction by Category</CardTitle>
            <CardDescription>Average ratings across different service areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {guestSatisfaction.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{item.category}</span>
                    <Badge variant="outline">{item.reviews} reviews</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i < Math.floor(item.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{item.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Rooms */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Rooms</CardTitle>
            <CardDescription>Highest revenue generating rooms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingRooms.map((room, index) => (
                <div key={room.room} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">Room {room.room}</div>
                      <div className="text-sm text-muted-foreground">{room.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(room.revenue)}</div>
                    <div className="text-sm text-muted-foreground">
                      {room.occupancy}% occupancy • {room.rating}★
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download detailed reports in various formats</CardDescription>
        </CardHeader>
        <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <Button 
               variant="outline" 
               onClick={() => {
                 handleExport('revenue-pdf');
                 const event = new CustomEvent('showToast', {
                   detail: { type: 'success', title: 'Export Successful', message: 'Revenue report exported to PDF!' }
                 });
                 window.dispatchEvent(event);
               }}
             >
               <FileText className="mr-2 h-4 w-4" />
               Revenue PDF
             </Button>
             <Button 
               variant="outline" 
               onClick={() => {
                 handleExport('occupancy-excel');
                 const event = new CustomEvent('showToast', {
                   detail: { type: 'success', title: 'Export Successful', message: 'Occupancy report exported to Excel!' }
                 });
                 window.dispatchEvent(event);
               }}
             >
               <Download className="mr-2 h-4 w-4" />
               Occupancy Excel
             </Button>
             <Button 
               variant="outline" 
               onClick={() => {
                 handleExport('guests-csv');
                 const event = new CustomEvent('showToast', {
                   detail: { type: 'success', title: 'Export Successful', message: 'Guest data exported to CSV!' }
                 });
                 window.dispatchEvent(event);
               }}
             >
               <Users className="mr-2 h-4 w-4" />
               Guest Data CSV
             </Button>
             <Button 
               variant="outline" 
               onClick={() => {
                 handleExport('satisfaction-pdf');
                 const event = new CustomEvent('showToast', {
                   detail: { type: 'success', title: 'Export Successful', message: 'Satisfaction report exported to PDF!' }
                 });
                 window.dispatchEvent(event);
               }}
             >
               <BarChart3 className="mr-2 h-4 w-4" />
               Satisfaction PDF
             </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
