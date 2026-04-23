"use client";

import { Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TableGrid({ tables, bookings, onTableTap }) {
  const now = new Date();
  const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000);

  function getTableStatus(table) {
    if (!bookings || bookings.length === 0) return "available";

    const tableBookings = bookings.filter((b) => b.tableId === table.id);

    // Occupied: someone is SEATED now
    const seated = tableBookings.find((b) => b.status === "SEATED");
    if (seated) return "occupied";

    // Occupied: CONFIRMED booking whose time window includes now
    const activeConfirmed = tableBookings.find((b) => {
      if (b.status !== "CONFIRMED") return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return now >= start && now <= end;
    });
    if (activeConfirmed) return "occupied";

    // Upcoming: CONFIRMED booking starting within next 30 min
    const upcoming = tableBookings.find((b) => {
      if (b.status !== "CONFIRMED") return false;
      const start = new Date(b.startTime);
      return start > now && start <= thirtyMinLater;
    });
    if (upcoming) return "upcoming";

    return "available";
  }

  const STATUS_STYLES = {
    available: "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300 hover:shadow-sm",
    occupied: "border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:shadow-sm",
    upcoming: "border-red-200 bg-red-50/60 hover:border-red-300 hover:shadow-sm",
  };

  const STATUS_DOT = {
    available: "bg-emerald-500",
    occupied: "bg-amber-500",
    upcoming: "bg-red-500",
  };

  const STATUS_LABEL = {
    available: "Available",
    occupied: "Occupied",
    upcoming: "Soon",
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {tables.map((table) => {
        const status = getTableStatus(table);
        return (
          <button
            key={table.id}
            onClick={() => onTableTap(table)}
            className={cn(
              "flex flex-col rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98]",
              STATUS_STYLES[status]
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">{table.label}</span>
              <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-white", STATUS_DOT[status])} />
            </div>
            {table.section && (
              <span className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {table.section}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {table.capacity} seats
            </span>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
              <span className="text-xs font-medium text-muted-foreground">
                {STATUS_LABEL[status]}
              </span>
            </div>
            {!table.isActive && (
              <span className="mt-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                Inactive
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
