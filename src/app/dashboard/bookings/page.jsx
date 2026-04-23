"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Search,
  Loader2,
  CalendarDays,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import BookingCard from "@/components/dashboard/BookingCard";
import AddBookingDialog from "@/components/dashboard/AddBookingDialog";
import Link from "next/link";

const STATUSES = [
  { value: "", label: "All" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SEATED", label: "Seated" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function BookingsPage() {
  const { data: session } = useSession();
  const slug = session?.user?.restaurantSlug;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogBooking, setDeleteDialogBooking] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      let url = `/api/bookings?slug=${slug}&date=${dateStr}&page=${page}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [slug, selectedDate, statusFilter, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedDate, statusFilter]);

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

  const handleDeleteCustomerData = async () => {
    if (!deleteDialogBooking || !slug) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/bookings/${deleteDialogBooking.id}?slug=${slug}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setBookings((prev) =>
          prev.filter((b) => b.id !== deleteDialogBooking.id)
        );
        setDeleteDialogBooking(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Client-side name search filter
  const filtered = search
    ? bookings.filter((b) =>
        b.customerName?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-base font-bold text-foreground sm:text-lg">All Bookings</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {format(selectedDate, "EEEE, d MMMM yyyy")}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Booking</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6">
        {/* Controls */}
        <div className="mb-4 space-y-3">
          {/* Date picker row */}
          <div className="flex justify-center rounded-xl border border-orange-200/60 bg-white p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="rounded-md"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatusFilter(s.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === s.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-white text-muted-foreground border border-orange-200/60 hover:border-orange-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by guest name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 border-orange-200/60"
            />
          </div>
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-3 text-sm">Loading bookings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50/30 py-20">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">No bookings found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your date or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((b) => (
              <div key={b.id} className="relative">
                <BookingCard
                  booking={b}
                  onStatusChange={handleStatusChange}
                  onTap={(booking) => setDeleteDialogBooking(booking)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* GDPR Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialogBooking}
        onOpenChange={(open) => !open && setDeleteDialogBooking(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Customer Data</DialogTitle>
            <DialogDescription className="text-center">
              This will permanently remove this booking and all associated
              personal data (GDPR erasure). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteDialogBooking(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-1.5"
              disabled={deleting}
              onClick={handleDeleteCustomerData}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Data"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddBookingDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={fetchBookings}
      />
    </div>
  );
}
