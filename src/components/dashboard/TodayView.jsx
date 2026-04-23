"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format, addHours } from "date-fns";
import { Users, Clock, CalendarDays, Loader2 } from "lucide-react";
import BookingCard from "./BookingCard";

export default function TodayView() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const slug = session?.user?.restaurantSlug;
  const restaurantName = session?.user?.restaurantName;

  const fetchBookings = useCallback(async () => {
    if (!slug) return;
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(
        `/api/bookings?slug=${slug}&date=${today}&limit=100`
      );
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Initial fetch + auto-refresh every 60 seconds
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 60000);
    // Listen for manual refresh events (e.g. from new-booking alert toast)
    const handleRefresh = () => fetchBookings();
    window.addEventListener("booking-refresh", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("booking-refresh", handleRefresh);
    };
  }, [fetchBookings]);

  // Live clock — updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}?slug=${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: newStatus } : b
          )
        );
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  // Split bookings into "Now" and "Upcoming"
  const now = currentTime;
  const threeHoursLater = addHours(now, 3);

  const nowBookings = bookings.filter((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    return (
      (b.status === "SEATED" || b.status === "CONFIRMED" || b.status === "PENDING") &&
      now >= start &&
      now <= end
    );
  });

  const upcomingBookings = bookings.filter((b) => {
    const start = new Date(b.startTime);
    return (
      (b.status === "CONFIRMED" || b.status === "PENDING") &&
      start > now &&
      start <= threeHoursLater
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-3 text-sm">Loading today's bookings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── NOW section ─── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
            <Users className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            Now
          </h2>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {nowBookings.length}
          </span>
        </div>
        {nowBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">No guests currently seated</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {nowBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── UPCOMING section ─── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100">
            <Clock className="h-3.5 w-3.5 text-sky-600" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            Upcoming
          </h2>
          <span className="text-xs text-muted-foreground">
            next 3 hours
          </span>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
            {upcomingBookings.length}
          </span>
        </div>
        {upcomingBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">No upcoming bookings in the next 3 hours</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {upcomingBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── ALL TODAY section ─── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
            <CalendarDays className="h-3.5 w-3.5 text-orange-600" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            All Today
          </h2>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            {bookings.length}
          </span>
        </div>
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">No bookings for today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
