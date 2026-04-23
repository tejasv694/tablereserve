"use client";

import { format } from "date-fns";
import { Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  CONFIRMED: { label: "Confirmed", color: "bg-sky-50 text-sky-700 border border-sky-200" },
  SEATED: { label: "Seated", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-600 border border-gray-200" },
  NO_SHOW: { label: "No Show", color: "bg-red-50 text-red-700 border border-red-200" },
  CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-600 border border-red-200" },
  PENDING: { label: "Pending", color: "bg-amber-50 text-amber-700 border border-amber-200" },
};

export default function BookingCard({ booking, onStatusChange, onTap }) {
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
  const timeStr = format(new Date(booking.startTime), "h:mm a");

  return (
    <div
      onClick={() => onTap?.(booking)}
      className="group flex min-h-[80px] cursor-pointer flex-col rounded-xl border border-orange-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-orange-300/60"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight text-foreground">{timeStr}</p>
          <p className="mt-0.5 truncate text-base font-medium text-foreground">
            {booking.customerName}
          </p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", status.color)}>
          {status.label}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"}
        </span>
        {booking.table && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {booking.table.label}
            {booking.table.section && ` — ${booking.table.section}`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {booking.status === "PENDING" && (
          <>
            <Button
              size="sm"
              onClick={() => onStatusChange(booking.id, "CONFIRMED")}
              className="h-9 flex-1 bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(booking.id, "CANCELLED")}
              className="h-9 flex-1 border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Reject
            </Button>
          </>
        )}
        {booking.status === "CONFIRMED" && (
          <>
            <Button
              size="sm"
              onClick={() => onStatusChange(booking.id, "SEATED")}
              className="h-9 flex-1 bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Seat
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(booking.id, "NO_SHOW")}
              className="h-9 flex-1 border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              No Show
            </Button>
          </>
        )}
        {booking.status === "SEATED" && (
          <Button
            size="sm"
            onClick={() => onStatusChange(booking.id, "COMPLETED")}
            className="h-9 flex-1 bg-gray-700 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Done
          </Button>
        )}
        {(booking.status === "CONFIRMED" || booking.status === "SEATED" || booking.status === "PENDING") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(booking.id, "CANCELLED")}
            className="h-9 text-sm font-semibold text-muted-foreground"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
