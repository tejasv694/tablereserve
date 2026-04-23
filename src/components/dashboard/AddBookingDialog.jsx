"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";

const bookingSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().optional(),
  partySize: z.coerce.number().int().min(1).max(20),
  specialRequests: z.string().optional(),
});

export default function AddBookingDialog({ open, onOpenChange, onCreated }) {
  const { data: session } = useSession();
  const slug = session?.user?.restaurantSlug;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("auto");
  const [source, setSource] = useState("PHONE");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch slots when date or party size changes
  const fetchSlots = useCallback(async () => {
    if (!slug || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(
        `/api/availability?slug=${slug}&date=${dateStr}&partySize=${partySize}`
      );
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [slug, selectedDate, partySize]);

  useEffect(() => {
    if (open) fetchSlots();
  }, [open, fetchSlots]);

  // Fetch tables
  useEffect(() => {
    if (!open || !slug) return;
    fetch(`/api/tables?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => setTables(data.tables || []))
      .catch(() => setTables([]));
  }, [open, slug]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setSpecialRequests("");
    setSelectedSlot(null);
    setSelectedTableId("auto");
    setError(null);
    setPartySize(2);
    setSource("PHONE");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const parsed = bookingSchema.safeParse({
      customerName: name,
      customerEmail: email,
      customerPhone: phone || undefined,
      partySize,
      specialRequests: specialRequests || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Validation failed");
      return;
    }

    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }

    setSubmitting(true);

    try {
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          tableId: selectedTableId,
          customerName: name,
          customerEmail: email,
          customerPhone: phone || undefined,
          partySize,
          startTime: startTime.toISOString(),
          gdprConsent: true,
          specialRequests: specialRequests || undefined,
          source,
        }),
      });

      if (res.status === 409) {
        setError("Slot just taken — please choose another time.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create booking");
        setSubmitting(false);
        return;
      }

      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-orange-200/60">
        <DialogHeader>
          <DialogTitle>Add Booking</DialogTitle>
          <DialogDescription>
            Create a booking on behalf of a customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source */}
          <div className="flex gap-2">
            {["PHONE", "WALKIN"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  source === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-white text-muted-foreground border border-orange-200/60 hover:border-orange-300"
                }`}
              >
                {s === "PHONE" ? "Phone" : "Walk-in"}
              </button>
            ))}
          </div>

          {/* Date */}
          <div>
            <Label className="mb-1.5 text-sm font-medium">Date</Label>
            <div className="flex justify-center rounded-lg border border-orange-200/60 bg-white p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Party size */}
          <div>
            <Label className="mb-1.5 text-sm font-medium">Party Size</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPartySize(s)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all ${
                    partySize === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-orange-200 bg-white hover:border-orange-300"
                  }`}
                >
                  {s === 6 ? "6+" : s}
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <Label className="mb-1.5 text-sm font-medium">Time</Label>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : slots.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No slots available
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex h-10 items-center justify-center rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedSlot === slot
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-orange-200 bg-white hover:border-orange-300"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table selector */}
          <div>
            <Label className="mb-1.5 text-sm font-medium">Table</Label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="h-10 w-full rounded-lg border border-orange-200/60 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
            >
              <option value="auto">Auto-assign best fit</option>
              {tables
                .filter((t) => t.isActive)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                    {t.section && ` (${t.section})`} — {t.capacity} seats
                  </option>
                ))}
            </select>
          </div>

          {/* Guest details */}
          <div className="space-y-3">
            <div>
              <Label className="mb-1 text-sm">Guest Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="h-10"
                required
              />
            </div>
            <div>
              <Label className="mb-1 text-sm">Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="h-10"
                required
              />
            </div>
            <div>
              <Label className="mb-1 text-sm">Phone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 123 456 7890"
                className="h-10"
              />
            </div>
            <div>
              <Label className="mb-1 text-sm">Special Requests</Label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Allergies, highchair..."
                rows={2}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="h-12 w-full text-base font-semibold shadow-md shadow-primary/20"
          >
            {submitting ? "Creating..." : "Create Booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
