"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";

const POLL_INTERVAL = 15000; // 15 seconds

export function useNewBookingAlert() {
  const { data: session } = useSession();
  const slug = session?.user?.restaurantSlug;
  const knownIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Play a pleasant two-tone chime
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(830, now, 0.15);       // first chime
      playTone(1100, now + 0.18, 0.2); // second chime (higher)
    } catch {
      // AudioContext not available — silent
    }
  }, []);

  const checkForNewBookings = useCallback(async () => {
    if (!slug) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(
        `/api/bookings?slug=${slug}&date=${today}&limit=100`
      );
      if (!res.ok) return;

      const data = await res.json();
      const bookings = data.bookings || [];

      if (initialLoadRef.current) {
        // First load — populate known IDs without alerting
        bookings.forEach((b) => knownIdsRef.current.add(b.id));
        initialLoadRef.current = false;
        return;
      }

      // Check for new bookings we haven't seen
      const newBookings = bookings.filter((b) => !knownIdsRef.current.has(b.id));

      if (newBookings.length > 0) {
        // Add to known set
        newBookings.forEach((b) => knownIdsRef.current.add(b.id));

        // Play sound
        playSound();

        // Show toast for each new booking
        newBookings.forEach((b) => {
          const time = format(new Date(b.startTime), "HH:mm");
          toast.success("🔔 New Booking!", {
            description: `${b.customerName} — ${b.partySize} guests at ${time}${b.table?.label ? ` · ${b.table.label}` : ""}`,
            duration: 10000,
            action: {
              label: "View",
              onClick: () => {
                // Scroll to the booking or trigger refresh
                window.dispatchEvent(new CustomEvent("booking-refresh"));
              },
            },
          });
        });
      }

      // Also update known IDs for any that disappeared (cancelled etc.)
      knownIdsRef.current = new Set(bookings.map((b) => b.id));
    } catch (err) {
      // Silent fail — don't spam console for polling
    }
  }, [slug, playSound]);

  useEffect(() => {
    if (!slug) return;

    // Initial check
    checkForNewBookings();

    // Poll every 15 seconds
    const interval = setInterval(checkForNewBookings, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [slug, checkForNewBookings]);
}
