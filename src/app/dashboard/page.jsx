"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { format } from "date-fns";
import {
  CalendarDays,
  Grid3X3,
  Settings,
  LogOut,
  Plus,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TodayView from "@/components/dashboard/TodayView";
import AddBookingDialog from "@/components/dashboard/AddBookingDialog";
import Link from "next/link";
import { useNewBookingAlert } from "@/hooks/useNewBookingAlert";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const todayViewRef = useRef(null);

  // Real-time new booking alerts with sound
  useNewBookingAlert();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const restaurantName = session?.user?.restaurantName || "Dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/60 to-background">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-10 border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🍽️</div>
            <div>
              <h1 className="text-base font-bold text-foreground sm:text-lg">
                {restaurantName}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {format(currentTime, "EEEE, d MMMM yyyy")} · {format(currentTime, "HH:mm")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard/bookings">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Bookings</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard/tables">
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Tables</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard/staff">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Staff</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard/shifts">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Shifts</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => signOut({ callbackUrl: "/dashboard/login" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main content ─── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <TodayView />
      </main>

      {/* ─── Fixed "+ Add Booking" button ─── */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button
          className="h-14 gap-2 rounded-full px-6 text-base font-semibold shadow-lg shadow-primary/25"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Add Booking
        </Button>
      </div>

      <AddBookingDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCreated={() => window.location.reload()}
      />
    </div>
  );
}
