import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Star,
  Download,
  User,
  X,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import { formatDate } from "../lib/utils";


// PDF export
import jsPDF from "jspdf";
import "jspdf-autotable";
import adminApi, { FeedbackApiItem, GuestData, GetAllGuestsResponse } from "../services/api";

interface FeedbackDisplayItem {
  id: string;
  guestName: string;
  roomNumber: string;
  rating: number;
  comment: string;
  timestamp: string;
}

const Feedback = () => {
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterRoom, setFilterRoom] = useState<string>("");



  const [feedbackData, setFeedbackData] = useState<FeedbackDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedbackAndGuests() {
      setLoading(true);
      try {
        // Get selected hotel ID
        const selectedHotel = localStorage.getItem('selected_hotel');
        const hotelId = selectedHotel ? JSON.parse(selectedHotel).hotel_id || JSON.parse(selectedHotel).id : null;
        
        // Fetch feedback for specific hotel
        const feedbackRes = await adminApi.getAllFeedback(hotelId);
        const feedbackList: FeedbackApiItem[] = Array.isArray(feedbackRes)
          ? feedbackRes
          : [];

        // Fetch guests for specific hotel
        const guestsRes = await adminApi.getAllGuests(hotelId);
        let guests: GuestData[] = [];
        if (Array.isArray(guestsRes)) {
          guests = guestsRes;
        } else if (guestsRes.data) {
          guests = guestsRes.data;
        }

        // Map reservation_id to guest (assuming reservation_id == guest.id or you have a mapping)
        // You may need to adjust this mapping logic based on your actual data model
        const feedbackDisplay: FeedbackDisplayItem[] = feedbackList.map((fb, idx) => {
          return {
            id: String(idx),
            guestName: fb.guest_name || "Unknown",
            roomNumber: fb.room_number || "-",
            rating: fb.rating,
            comment: fb.comments,
            timestamp: fb.submitted_time || "",
          };
        });
        setFeedbackData(feedbackDisplay);
      } catch (e) {
        setFeedbackData([]);
      }
      setLoading(false);
    }
    fetchFeedbackAndGuests();
  }, []);

  // Render stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "text-yellow-400 fill-current"
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  // Filters
  const filteredFeedback = feedbackData.filter((item) => {
    const ratingMatch =
      filterRating === "all" || item.rating.toString() === filterRating;
    const roomMatch = filterRoom
      ? item.roomNumber.toString() === filterRoom
      : true;
    const dateMatch = filterDate
      ? formatDate(item.timestamp) === formatDate(filterDate)
      : true;
    return ratingMatch && roomMatch && dateMatch;
  });

  // Metrics based on filtered data
  const averageRating =
    filteredFeedback.length > 0
      ? filteredFeedback.reduce((acc, item) => acc + item.rating, 0) /
        filteredFeedback.length
      : 0;
  const totalReviews = filteredFeedback.length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(
    (star) => filteredFeedback.filter((f) => f.rating === star).length
  );

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Guest Feedback Report", 14, 16);

    const tableData = filteredFeedback.map((f) => [
      f.guestName,
      f.roomNumber,
      f.rating,
      f.comment,
      formatDate(f.timestamp),
    
    ]);

    (doc as any).autoTable({
      head: [["Guest", "Room", "Rating", "Comment", "Date", "Status"]],
      body: tableData,
      startY: 25,
    });

    doc.save("feedback-report.pdf");
  };



  return (
    <div className="relative p-6 min-h-screen dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800 space-y-6">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 cursor-wait select-none" style={{ pointerEvents: 'all' }}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Feedback</h3>
            <p className="text-slate-500 dark:text-slate-400">Please wait while we fetch feedback data...</p>
          </div>
        </div>
      )}
      {/* TOP ROW */}
    

      {/* Filters + Export */}
      <Card className="mx-auto w-full max-w-7xl border dark:border-gray-700 bg-white dark:bg-slate-800">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          {/* Rating Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Rating
            </label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-3 py-1 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-200"
            >
              <option value="all">All</option>
              <option value="5">5 ⭐</option>
              <option value="4">4 ⭐</option>
              <option value="3">3 ⭐</option>
              <option value="2">2 ⭐</option>
              <option value="1">1 ⭐</option>
            </select>
          </div>

          {/* Room Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Room
            </label>
            <input
              type="text"
              placeholder="Enter room no."
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="px-3 py-1 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-200"
            />
          </div>

          {/* Date Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-200"
            />
          </div>

          {/* Clear Filters Button */}
          <div>
            <button
              className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => {
                setFilterRating("all");
                setFilterRoom("");
                setFilterDate("");
              }}
              type="button"
            >
              Clear Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Show current filter values for debugging */}
      <div className="mx-auto w-full max-w-7xl flex flex-wrap gap-4 items-center text-sm text-gray-600 dark:text-gray-300 p-2">
        <span>Current Filters:</span>
        <span>Rating: <b>{filterRating}</b></span>
        <span>Room: <b>{filterRoom || 'All'}</b></span>
        <span>Date: <b>{filterDate || 'All'}</b></span>
      </div>

      {/* Total Reviews */}
      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-lg font-medium">
        <span className="uppercase tracking-wide text-gray-500 dark:text-gray-300">
          Total Reviews:
        </span>
        <span className="font-semibold">{totalReviews}</span>
      </div>

      {/* Feedback List */}
      <Card className="mx-auto w-full max-w-7xl border dark:border-gray-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-gray-700 dark:text-gray-200">
            Recent Reviews
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Filtered guest feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredFeedback.length > 0 ? (
            filteredFeedback.map((feedback) => (
              <div
                key={feedback.id}
                className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-600 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {feedback.guestName}
                      </span>
                      <Badge variant="outline">Room {feedback.roomNumber}</Badge>
                   
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      {renderStars(feedback.rating)}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(feedback.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                      {feedback.comment}
                    </p>

                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No reviews match the selected filters.
            </p>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default Feedback;
