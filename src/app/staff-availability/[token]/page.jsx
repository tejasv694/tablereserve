"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { format, addDays, startOfWeek } from "date-fns";
import {
  CalendarDays, CheckCircle2, Loader2, Clock, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: "MONDAY", label: "Mon", full: "Monday" },
  { key: "TUESDAY", label: "Tue", full: "Tuesday" },
  { key: "WEDNESDAY", label: "Wed", full: "Wednesday" },
  { key: "THURSDAY", label: "Thu", full: "Thursday" },
  { key: "FRIDAY", label: "Fri", full: "Friday" },
  { key: "SATURDAY", label: "Sat", full: "Saturday" },
  { key: "SUNDAY", label: "Sun", full: "Sunday" },
];

const SHIFTS = ["Morning", "Evening", "Any"];

export default function AvailabilityFormPage() {
  const { token } = useParams();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [selectedDays, setSelectedDays] = useState([]);
  const [preferredShift, setPreferredShift] = useState("Any");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Calculate next week dates
  const now = new Date();
  const nextMonday = startOfWeek(addDays(now, 7), { weekStartsOn: 1 });
  nextMonday.setHours(0, 0, 0, 0);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      setError("Please select at least one day you can work");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/staff-availability?slug=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          availableDays: selectedDays,
          preferredShift,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50/60 to-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Availability Submitted!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your availability for the week of {format(nextMonday, "d MMM yyyy")} has been recorded.
            You&apos;ll receive your shift schedule on Thursday.
          </p>
          <div className="mt-6 rounded-lg border border-orange-200/60 bg-white p-4">
            <p className="text-sm font-medium text-foreground">Your available days:</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedDays.map((d) => (
                <span key={d} className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {DAYS.find((day) => day.key === d)?.full}
                </span>
              ))}
            </div>
            {preferredShift !== "Any" && (
              <p className="mt-2 text-xs text-muted-foreground">Preferred: {preferredShift} shift</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      {/* Header */}
      <header className="border-b border-orange-200/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-sm items-center gap-3 px-4 py-4">
          <div className="text-2xl">📋</div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Weekly Availability</h1>
            <p className="text-xs text-muted-foreground">
              Week of {format(nextMonday, "d MMM yyyy")}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Day Selection */}
          <div>
            <h2 className="mb-1 text-base font-bold">Which days can you work?</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Tap all days you&apos;re available next week
            </p>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, i) => {
                const date = addDays(nextMonday, i);
                const isSelected = selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border-2 py-3 transition-all active:scale-95",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-orange-200 bg-white text-foreground hover:border-orange-300"
                    )}
                  >
                    <span className="text-xs font-semibold">{day.label}</span>
                    <span className="mt-0.5 text-lg font-bold">{format(date, "d")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Shift */}
          <div>
            <h2 className="mb-1 text-base font-bold">Preferred shift</h2>
            <p className="mb-3 text-sm text-muted-foreground">Optional — we&apos;ll try to match your preference</p>
            <div className="flex gap-2">
              {SHIFTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreferredShift(s)}
                  className={cn(
                    "flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all active:scale-95",
                    preferredShift === s
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-orange-200 bg-white text-foreground hover:border-orange-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h2 className="mb-1 text-base font-bold">Notes (optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Can only do morning on Friday..."
              rows={2}
              className="w-full rounded-xl border border-orange-200/60 bg-white px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <Button
            type="submit"
            disabled={submitting || selectedDays.length === 0}
            className="h-14 w-full text-lg font-semibold shadow-md shadow-primary/20"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting…</>
            ) : (
              <><Send className="mr-2 h-5 w-5" />Submit Availability</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            First come, first serve — submit early to get priority for your preferred days.
          </p>
        </form>
      </div>
    </main>
  );
}
