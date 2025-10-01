import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Users, Bed, Bell, Clock, Settings, Building2 } from "lucide-react";
import adminApi, { DashboardData } from '../services/api';
import pynBookingApi from '../services/pynBookingApi';
import { Badge } from "./ui/badge";

interface HotelRecord {
  hotel_id: number;
  name: string;
  logo_url: string;
  established_year: string;
  address: string;
  service_care_no: string;
  city: string;
  country: string;
  postal_code: string;
  username: string;
  password: string;
}

// Strict 12-hour format: "hh:mm am/pm"
function formatTimeAmPm(dateString: string) {
  if (!dateString || dateString === "-" || dateString === null || dateString === undefined) return "-";
  try {
    const parseToDate = (val: any): Date | null => {
      const d1 = new Date(val);
      if (!isNaN(d1.getTime())) return d1;
      const ts = parseInt(val);
      if (!isNaN(ts)) {
        const d2 = new Date(ts);
        if (!isNaN(d2.getTime())) return d2;
      }
      return null;
    };
    const d = parseToDate(dateString);
    if (!d) return "-";
    // Use hour12 and 2-digit hour/minute, then normalize to lowercase am/pm
    const s = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return s.replace(/\s*[AP]M$/i, (m) => ` ${m.toLowerCase()}`);
  } catch {
    return "-";
  }
}

// Relative time like: "2 minutes ago"
function formatRelativeTime(dateString: string) {
  if (!dateString || dateString === "-" || dateString === null || dateString === undefined) return "-";
  try {
    const parseToDate = (val: any): Date | null => {
      const d1 = new Date(val);
      if (!isNaN(d1.getTime())) return d1;
      const ts = parseInt(val);
      if (!isNaN(ts)) {
        const d2 = new Date(ts);
        if (!isNaN(d2.getTime())) return d2;
      }
      return null;
    };
    const d = parseToDate(dateString);
    if (!d) return "-";
    const now = new Date().getTime();
    const diffMs = Math.max(0, now - d.getTime());
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `${sec} second${sec === 1 ? "" : "s"} ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
    const week = Math.floor(day / 7);
    if (week < 4) return `${week} week${week === 1 ? "" : "s"} ago`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} month${month === 1 ? "" : "s"} ago`;
    const year = Math.floor(day / 365);
    return `${year} year${year === 1 ? "" : "s"} ago`;
  } catch {
    return "-";
  }
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedHotel, setSelectedHotel] = useState<HotelRecord | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationsCount, setReservationsCount] = useState(0);


  // Load selected hotel from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('selected_hotel');
      if (stored) {
        setSelectedHotel(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading selected hotel:', error);
    }
  }, []);

  // Fetch dashboard data when hotel is selected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchDashboard = async () => {
      if (!selectedHotel) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch PynBooking reservations count
        try {
          const reservations = await pynBookingApi.getAllReservations();
          setReservationsCount(reservations.length);
        } catch (pynError) {
          console.log('PynBooking API not available:', pynError);
          setReservationsCount(0);
        }
        const res = await adminApi.getDashboard(selectedHotel.hotel_id);
        console.log("Raw API Response:", res);
        
        let dashboard: DashboardData | null = null;
        // Build a fallback map from feedback: room_number -> latest guest_name
        let latestGuestByRoom: Record<string, string> = {};
        try {
          const feedbackApiList = await adminApi.getAllFeedback();
          if (Array.isArray(feedbackApiList)) {
            // Sort by submitted_time if present to get latest per room
            const sorted = [...feedbackApiList].sort((a: any, b: any) => {
              const ta = new Date(a.submitted_time || a.created_at || 0).getTime();
              const tb = new Date(b.submitted_time || b.created_at || 0).getTime();
              return tb - ta; // desc
            });
            for (const fb of sorted) {
              const rn = String(fb.room_number || '').trim();
              const gn = String(fb.guest_name || '').trim();
              if (rn && gn && !latestGuestByRoom[rn]) {
                latestGuestByRoom[rn] = gn;
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch feedback for guest fallback:', e);
        }
        if (res) {
          if (
            typeof res === "object" &&
            res !== null &&
            "hotel" in res &&
            "rooms" in res &&
            "roomServices" in res &&
            "technicalIssues" in res &&
            "feedback" in res
          ) {
            const r = res as Record<string, any>;
            const rooms = Array.isArray(r.rooms) ? r.rooms : [];
            const roomServices = Array.isArray(r.roomServices) ? r.roomServices : [];
            const technicalIssues = Array.isArray(r.technicalIssues) ? r.technicalIssues : [];
            const feedback = Array.isArray(r.feedback) ? r.feedback : [];
            const rawNotifications = Array.isArray(r.notifications) ? r.notifications : [];
            
            console.log("Rooms data:", rooms);
            console.log("Sample room object:", rooms[0]);

            // Build latest action per room map from roomServices, technicalIssues, notifications
            type Latest = { mode: string; time: string };
            const latestByRoom: Record<string, Latest> = {};

            const normRoom = (obj: any): string => {
              return (
                obj?.room_number || obj?.roomNumber || obj?.room || obj?.room_id || obj?.roomId || obj?.number || ""
              )
                .toString()
                .trim();
            };

            const normTime = (obj: any): string => {
              return (
                obj?.time ||
                obj?.created_time ||
                obj?.created_at ||
                obj?.createdAt ||
                obj?.updated_at ||
                obj?.updatedAt ||
                obj?.timestamp ||
                obj?.timeStamp ||
                obj?.event_time ||
                obj?.reported_at ||
                obj?.requestedAt ||
                obj?.submitted_time ||
                obj?.last_action ||
                obj?.lastAction ||
                ""
              );
            };

            const normMode = (obj: any): string => {
              const raw = (
                obj?.action || obj?.type || obj?.status || obj?.mode || obj?.request_type || obj?.requestType || ""
              )
                .toString()
                .trim();
              if (!raw) return "";
              // Normalize some common variants
              const map: Record<string, string> = {
                cleaning: "Cleaning",
                clean: "Cleaning",
                dnd: "Do Not Disturb",
                donotdisturb: "Do Not Disturb",
                'do not disturb': "Do Not Disturb",
                occupied: "Occupied",
                idle: "Idle",
                available: "Available",
              };
              const key = raw.toLowerCase();
              return map[key] || raw;
            };

            const consider = (obj: any) => {
              const r = normRoom(obj);
              if (!r) return;
              const t = normTime(obj);
              const m = normMode(obj);
              if (!m && !t) return;
              const current = latestByRoom[r];
              const newTs = new Date(t || 0).getTime();
              const curTs = current ? new Date(current.time || 0).getTime() : -Infinity;
              if (!current || newTs >= curTs) {
                latestByRoom[r] = { mode: m || current?.mode || "", time: t || current?.time || "" };
              }
            };

            (roomServices || []).forEach(consider);
            (technicalIssues || []).forEach((ti: any) => {
              // treat technical issue as a mode if it has type/status, else label as "Technical Issue"
              const hasType = ti?.type || ti?.status || ti?.issue_type;
              if (!hasType) {
                ti = { ...ti, type: "Technical Issue" };
              }
              consider(ti);
            });
            (rawNotifications || []).forEach(consider);
            
            dashboard = {
              stats: [
                { value: rooms.length, label: "Total Rooms", href: `/hotel/${selectedHotel.hotel_id}/rooms` },
                { value: roomServices.length, label: "Clean Requests", href: `/hotel/${selectedHotel.hotel_id}/clean-requests` },
                { value: technicalIssues.length, label: "Technical Issues", href: `/hotel/${selectedHotel.hotel_id}/technical-issues` },
                { value: feedback.length, label: "Guest Feedback", href: `/hotel/${selectedHotel.hotel_id}/feedback` },
              ],
              liveRoomStatus: rooms.map((room: any) => {
                console.log("Processing room:", room);
                const roomNo = room.room_number || room.roomNumber || room.number || "-";
                const fallbackGuest = latestGuestByRoom[String(roomNo).trim()] || "-";
                const latest = latestByRoom[String(roomNo).trim()] || { mode: "", time: "" };
                return {
                  room: roomNo,
                  floor: room.floor || room.floorNumber || room.floor_number || "-",
                  // Prefer full name if available, else try multiple keys, else compose first + last, else fallback from feedback map
                  guest:
                    room.guest_name ||
                    room.guest_full_name ||
                    room.guestName ||
                    room.guestname ||
                    room.guest?.name ||
                    (room.guest?.first_name && room.guest?.last_name
                      ? `${room.guest.first_name} ${room.guest.last_name}`
                      : room.guest?.first_name || room.guest?.last_name) ||
                    fallbackGuest ||
                    "-",
                  // Live room status (Idle, Cleaning, Do Not Disturb, etc.)
                  mode:
                    latest.mode ||
                    room.status ||
                    room.room_status ||
                    room.mode ||
                    room.current_status ||
                    room.live_status ||
                    "Idle",
                  // Last action time - handle multiple variants including snake/camel and *_time
                  lastAction:
                    latest.time ||
                    room.last_action ||
                    room.last_action_time ||
                    room.lastAction ||
                    room.lastActionTime ||
                    room.last_activity ||
                    room.lastActivity ||
                    room.updated_at ||
                    room.updatedAt ||
                    "-",
                  tabletStatus: room.tablet_status || room.tabletStatus || "Active", // keep for type compatibility
                };
              }),
              notifications: (() => {
                const normTime = (obj: any): string => (
                  obj?.time ||
                  obj?.created_time ||
                  obj?.created_at ||
                  obj?.createdAt ||
                  obj?.updated_at ||
                  obj?.updatedAt ||
                  obj?.timestamp ||
                  obj?.timeStamp ||
                  obj?.event_time ||
                  obj?.reported_at ||
                  obj?.requestedAt ||
                  obj?.submitted_time ||
                  obj?.last_action ||
                  obj?.lastAction ||
                  ""
                );
                const normType = (obj: any): string => {
                  const raw = (
                    obj?.type || obj?.event_type || obj?.action || obj?.status || obj?.mode || ""
                  ).toString().trim().toLowerCase();
                  if (["checkin", "check-in", "new_checkin"].includes(raw)) return "checkin";
                  if (["checkout", "check-out", "new_checkout"].includes(raw)) return "checkout";
                  if (["maintenance", "issue", "technical", "technical_issue"].includes(raw)) return "maintenance";
                  if (["review", "rating", "feedback"].includes(raw)) return "review";
                  return raw || "activity";
                };
                const normRoom = (obj: any): string => (
                  obj?.room_number || obj?.roomNumber || obj?.room || obj?.room_id || obj?.roomId || obj?.number || ""
                )?.toString().trim();

                // Base: notifications directly from API
                const items = (rawNotifications || []).map((n: any, idx: number) => {
                  const t = normTime(n);
                  const type = normType(n);
                  const room = normRoom(n);
                  const rating = n?.rating || n?.stars || n?.score;
                  let message = n?.message || n?.title || n?.description || "Activity update";
                  if (!n?.message) {
                    switch (type) {
                      case "checkin":
                        message = `New guest checked in to Room ${room || "-"}`;
                        break;
                      case "checkout":
                        message = `Guest checked out from Room ${room || "-"}`;
                        break;
                      case "maintenance":
                        message = `Maintenance request for Room ${room || "-"}`;
                        break;
                      case "review": {
                        const stars = parseInt(rating) || 5;
                        message = `New ${stars}-star review received`;
                        break;
                      }
                      default:
                        // keep default message
                        break;
                    }
                  }
                  const id = n?.id || n?._id || `${type}-${t}-${room || idx}`;
                  return { id, type, message, time: t };
                });

                // Derive activities from roomServices (treat as maintenance/service requests)
                (roomServices || []).forEach((rs: any, idx: number) => {
                  const t = normTime(rs);
                  const room = normRoom(rs);
                  const req = (rs?.request_type || rs?.requestType || rs?.type || rs?.action || "Service").toString();
                  const type = "maintenance";
                  const message = `${req.charAt(0).toUpperCase()}${req.slice(1)} request for Room ${room || "-"}`;
                  const id = rs?.id || rs?._id || `svc-${t}-${room || idx}`;
                  items.push({ id, type, message, time: t });
                });

                // Derive activities from technicalIssues
                (technicalIssues || []).forEach((ti: any, idx: number) => {
                  const t = normTime(ti);
                  const room = normRoom(ti);
                  const issue = (ti?.issue || ti?.issue_type || ti?.type || ti?.status || "Technical issue").toString();
                  const type = "maintenance";
                  const message = `${issue.charAt(0).toUpperCase()}${issue.slice(1)} reported for Room ${room || "-"}`;
                  const id = ti?.id || ti?._id || `ti-${t}-${room || idx}`;
                  items.push({ id, type, message, time: t });
                });

                // Derive activities from feedback as reviews
                (feedback || []).forEach((fb: any, idx: number) => {
                  const t = normTime(fb);
                  const rating = fb?.rating || fb?.stars || fb?.score;
                  const stars = parseInt(rating) || undefined;
                  const type = "review";
                  const message = stars ? `New ${stars}-star review received` : (fb?.title || fb?.message || "New feedback received");
                  const id = fb?.id || fb?._id || `fb-${t}-${idx}`;
                  items.push({ id, type, message, time: t });
                });

                // Sort newest first by time if parseable
                items.sort((a: any, b: any) => {
                  const ta = new Date(a.time || 0).getTime();
                  const tb = new Date(b.time || 0).getTime();
                  return tb - ta;
                });
                return items;
              })(),
            };
          } else if (res.success && res.data) {
            console.log("Using res.data:", res.data);
            dashboard = res.data;
          } else if (
            typeof res === "object" &&
            res !== null &&
            "stats" in res &&
            "liveRoomStatus" in res &&
            "notifications" in res
          ) {
            console.log("Using direct dashboard format:", res);
            dashboard = res as DashboardData;
          }
        }
        if (dashboard) {
          setDashboardData(dashboard);
        } else {
          setError(res.message || 'Failed to load dashboard data');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    interval = setInterval(fetchDashboard, 100000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [selectedHotel]);


  // Fallbacks for UI if API data is missing
  const dashboardStats = dashboardData?.stats || [
    { value: "-", label: "Total Rooms", href: selectedHotel ? `/hotel/${selectedHotel.hotel_id}/rooms` : "/rooms" },
    { value: "-", label: "Clean Requests", href: selectedHotel ? `/hotel/${selectedHotel.hotel_id}/clean-requests` : "/clean-requests" },
    { value: "-", label: "Technical Issues", href: selectedHotel ? `/hotel/${selectedHotel.hotel_id}/technical-issues` : "/technical-issues" },
    { value: "-", label: "Guest Feedback", href: selectedHotel ? `/hotel/${selectedHotel.hotel_id}/feedback` : "/feedback" },
  ];
 
  console.log("Dashboard data set:", dashboardData);

  const liveRoomStatus = dashboardData?.liveRoomStatus || [];
  const notifications = dashboardData?.notifications || [];

  const [filters, setFilters] = useState({ floor: "", room: "", status: "" });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredRooms = liveRoomStatus.filter((r) => {
    const byFloor = filters.floor ? r.floor === filters.floor : true;
    const byRoom = filters.room ? r.room === filters.room : true;
    const byStatus = filters.status ? r.mode === filters.status : true;
    return byFloor && byRoom && byStatus;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "checkin":
      case "checkout":
        return <Users className="h-4 w-4" />;
      case "maintenance":
        return <Bed className="h-4 w-4" />;
      case "review":
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 cursor-wait select-none" style={{ pointerEvents: 'all' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Dashboard</h3>
          <p className="text-slate-500 dark:text-slate-400">Please wait while we fetch dashboard data...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">{error}</h3>
          <button className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Hotel Header */}
      {selectedHotel && (
        <div className="mx-auto w-full max-w-7xl">
          <Card className="border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {/* logo removed as per request */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedHotel.name}</h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedHotel.address}, {selectedHotel.city}, {selectedHotel.country} {selectedHotel.postal_code}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Established {selectedHotel.established_year} • Service: {selectedHotel.service_care_no}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/hotels')}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Switch Hotel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Room Status */}
      <div className="mx-auto w-full max-w-7xl grid grid-cols-1 gap-6">
        <Card className="border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div>
                <CardTitle className="text-xl font-semibold">Live Room Status</CardTitle>
                <CardDescription>Current status of all rooms</CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  className="text-sm border rounded-lg px-2 py-1 bg-white dark:bg-slate-700 dark:text-white"
                  value={filters.floor}
                  onChange={(e) => handleFilterChange("floor", e.target.value)}
                >
                  <option value="">All Floors</option>
                  {liveRoomStatus
                    .map((r) => r.floor)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((floor) => (
                    <option key={floor} value={floor}>
                      Floor {floor}
                    </option>
                  ))}
                </select>

                <select
                  className="text-sm border rounded-lg px-2 py-1 bg-white dark:bg-slate-700 dark:text-white"
                  value={filters.room}
                  onChange={(e) => handleFilterChange("room", e.target.value)}
                >
                  <option value="">All Rooms</option>
                  {liveRoomStatus
                    .map((r) => r.room)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((room) => (
                    <option key={room} value={room}>
                      Room {room}
                    </option>
                  ))}
                </select>

                <select
                  className="text-sm border rounded-lg px-2 py-1 bg-white dark:bg-slate-700 dark:text-white"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">All Status</option>
                  {liveRoomStatus
                    .map((r) => r.mode)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredRooms.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">No rooms found in Live Room Status.</p>
                <Button onClick={() => navigate(selectedHotel ? `/hotel/${selectedHotel.hotel_id}/rooms` : "/rooms")} className="mt-1">Create Room</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-h-56 max-h-96 overflow-y-auto text-sm scrollbar-thin">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Room</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Guest</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Live Room Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Action</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredRooms.map((room, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium">{room.room}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-300">{room.guest}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-300">{room.mode}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-300">{formatTimeAmPm(room.lastAction)}</td>
                          <td className="px-3 py-2">
                            <Badge variant={
                              room.mode === "Idle" || room.mode === "Available" || room.mode === "Clean" ? "success" :
                              room.mode === "Occupied" || room.mode === "Do Not Disturb" || room.mode === "Cleaning" ? "destructive" :
                              "secondary"
                            }>
                              {(room.mode === "Idle" || room.mode === "Available" || room.mode === "Clean")
                                ? "Available"
                                : "Not Available"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="mx-auto w-full max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-4">
        {dashboardStats.map((stat, idx) => (
          <Card
            key={idx}
            onClick={() => navigate(stat.href || '/')}
            className="cursor-pointer p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
              <span className="text-sm text-gray-500 dark:text-gray-300">{stat.label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          className="flex-1 flex items-center justify-center sm:justify-start h-12 text-sm font-medium border bg-white dark:bg-slate-800 rounded-xl"
          variant="outline"
          onClick={() => navigate(selectedHotel ? `/hotel/${selectedHotel.hotel_id}/guests` : "/guests")}
        >
          <Users className="h-4 w-4 mr-2" />
          Add New Guest
        </Button>

        <Button
          className="flex-1 flex items-center justify-center sm:justify-start h-12 text-sm font-medium border bg-white dark:bg-slate-800 rounded-xl"
          variant="outline"
          onClick={() => navigate(selectedHotel ? `/hotel/${selectedHotel.hotel_id}/notifications` : "/notifications")}
        >
          <Bell className="h-4 w-4 mr-2" />
          Send Notification
        </Button>

        <Button
          className="flex-1 flex items-center justify-center sm:justify-start h-12 text-sm font-medium border bg-white dark:bg-slate-800 rounded-xl"
          variant="outline"
          onClick={() => navigate(selectedHotel ? `/hotel/${selectedHotel.hotel_id}/configure-display` : "/configure-display")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configure Display
        </Button>
      </div>

      {/* Notifications */}
      <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest hotel activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="min-h-40 max-h-96 flex flex-col items-center justify-center text-center gap-2 text-sm">
                <p className="text-gray-600 dark:text-gray-300">No recent activity yet.</p>
                <p className="text-gray-500 dark:text-gray-400">Activities will appear here as things happen in your hotel.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 p-3 border rounded-lg dark:border-gray-700"
                  >
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.message}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" /> {formatRelativeTime(n.time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start h-11 text-sm font-medium bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600"
              variant="outline"
              onClick={() => navigate(selectedHotel ? `/hotel/${selectedHotel.hotel_id}/guests` : "/guests")}
            >
              <Users className="h-4 w-4 mr-2" />
              Add New Guest
            </Button>
            <Button
              className="w-full justify-start h-11 text-sm font-medium bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600"
              variant="outline"
              onClick={() => navigate(selectedHotel ? `/hotel/${selectedHotel.hotel_id}/rooms` : "/rooms")}
            >
              <Bed className="h-4 w-4 mr-2" />
              Add Room
            </Button>
            <Button
              className="w-full justify-start h-11 text-sm font-medium bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600"
              variant="outline"
              onClick={() => navigate(selectedHotel ? `/hotel/${selectedHotel.hotel_id}/notifications` : "/notifications")}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
