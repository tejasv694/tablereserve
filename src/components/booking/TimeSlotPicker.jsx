"use client";

import { Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimeSlotPicker({ slots, selectedSlot, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Checking availability...
        </p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50/30 py-12 text-center">
        <Clock className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-medium text-foreground">
          No available time slots
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please try a different date or party size.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onSelect(slot)}
          className={cn(
            "flex h-14 items-center justify-center rounded-xl border-2 text-base font-semibold transition-all active:scale-95",
            selectedSlot === slot
              ? "border-primary bg-primary text-primary-foreground shadow-md"
              : "border-orange-200 bg-white text-foreground hover:border-orange-300 hover:shadow-sm"
          )}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
