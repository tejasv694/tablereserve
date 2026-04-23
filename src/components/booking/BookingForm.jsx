"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import TimeSlotPicker from "./TimeSlotPicker";

const PARTY_SIZES = [1, 2, 3, 4, 5, 6];

const detailsSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().optional(),
  specialRequests: z.string().optional(),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the privacy policy" }),
  }),
  marketingConsent: z.boolean().optional().default(false),
});

export default function BookingForm({ slug, restaurant }) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [selectedDate, setSelectedDate] = useState(null);
  const [partySize, setPartySize] = useState(null);

  // Step 2 state
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Step 3 state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      specialRequests: "",
      gdprConsent: false,
      marketingConsent: false,
    },
  });

  const gdprConsent = watch("gdprConsent");
  const marketingConsent = watch("marketingConsent");

  // Step 1 → Step 2: Fetch available slots
  const handleCheckAvailability = useCallback(async () => {
    if (!selectedDate || !partySize) return;

    setSlotsLoading(true);
    setSelectedSlot(null);
    setSlots([]);
    setStep(2);

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(
        `/api/availability?slug=${slug}&date=${dateStr}&partySize=${partySize}`
      );
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error("Failed to fetch slots:", err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, partySize, slug]);

  // Step 3: Submit booking
  const onSubmit = async (formData) => {
    if (!selectedDate || !selectedSlot || !partySize) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build the full startTime ISO string from date + slot
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      // First, find an available table for this slot
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const availRes = await fetch(
        `/api/availability?slug=${slug}&date=${dateStr}&partySize=${partySize}`
      );
      const availData = await availRes.json();

      if (!availData.slots?.includes(selectedSlot)) {
        setSubmitError("This time slot is no longer available. Please go back and choose another.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          tableId: "auto",
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone || undefined,
          partySize,
          startTime: startTime.toISOString(),
          gdprConsent: formData.gdprConsent,
          marketingConsent: formData.marketingConsent || false,
          specialRequests: formData.specialRequests || undefined,
        }),
      });

      if (res.status === 409) {
        setSubmitError("This time slot was just taken. Please go back and choose another.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        setSubmitError(errData.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      const booking = await res.json();
      router.push(`/${slug}/confirmation?bookingId=${booking.id}`);
    } catch (err) {
      console.error("Booking submission error:", err);
      setSubmitError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                step >= s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-orange-100 text-orange-400"
              )}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "h-0.5 w-8 rounded-full transition-colors",
                  step > s ? "bg-primary" : "bg-orange-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <p className="mb-6 text-center text-sm text-muted-foreground">
        Step {step} of 3
      </p>

      {/* ───────── STEP 1: Date & Party Size ───────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-xl font-bold">Choose a date</h2>
            <p className="text-sm text-muted-foreground">
              When would you like to dine?
            </p>
          </div>

          <Card className="border-orange-200/60 shadow-sm">
            <CardContent className="flex justify-center p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                  date > addDays(new Date(), restaurant?.advanceBookingDays || 60)
                }
                className="rounded-md"
              />
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-xl font-bold">Party size</h2>
            <div className="grid grid-cols-6 gap-2">
              {PARTY_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPartySize(size)}
                  className={cn(
                    "flex h-14 items-center justify-center rounded-xl border-2 text-lg font-semibold transition-all active:scale-95",
                    partySize === size
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-orange-200 bg-white text-foreground hover:border-orange-300"
                  )}
                >
                  {size === 6 ? "6+" : size}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCheckAvailability}
            disabled={!selectedDate || !partySize}
            className="h-14 w-full text-lg font-semibold shadow-md shadow-primary/20"
          >
            Check Availability
          </Button>
        </div>
      )}

      {/* ───────── STEP 2: Pick a Time Slot ───────── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-xl font-bold">Pick a time</h2>
            <p className="text-sm text-muted-foreground">
              {selectedDate && format(selectedDate, "EEEE, d MMMM yyyy")} &middot;{" "}
              {partySize} {partySize === 1 ? "guest" : "guests"}
            </p>
          </div>

          <TimeSlotPicker
            slots={slots}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
            loading={slotsLoading}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setSelectedSlot(null);
              }}
              className="h-14 flex-1 text-base font-semibold"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedSlot}
              className="h-14 flex-1 text-base font-semibold"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ───────── STEP 3: Your Details ───────── */}
      {step === 3 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-bold">Your details</h2>
            <p className="text-sm text-muted-foreground">
              {selectedDate && format(selectedDate, "EEEE, d MMMM yyyy")} at{" "}
              {selectedSlot} &middot; {partySize}{" "}
              {partySize === 1 ? "guest" : "guests"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName" className="mb-1.5 text-base">
                Full Name *
              </Label>
              <Input
                id="customerName"
                placeholder="Your name"
                autoComplete="name"
                className="h-12 text-base"
                {...register("customerName")}
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="customerEmail" className="mb-1.5 text-base">
                Email *
              </Label>
              <Input
                id="customerEmail"
                type="email"
                inputMode="email"
                placeholder="your@email.com"
                autoComplete="email"
                className="h-12 text-base"
                {...register("customerEmail")}
              />
              {errors.customerEmail && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.customerEmail.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="customerPhone" className="mb-1.5 text-base">
                Phone (optional)
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                inputMode="tel"
                placeholder="+49 123 456 7890"
                autoComplete="tel"
                className="h-12 text-base"
                {...register("customerPhone")}
              />
            </div>

            <div>
              <Label htmlFor="specialRequests" className="mb-1.5 text-base">
                Special Requests (optional)
              </Label>
              <textarea
                id="specialRequests"
                placeholder="Allergies, highchair, birthday..."
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("specialRequests")}
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-orange-200/60 bg-orange-50/30 p-4">
              <Checkbox
                id="gdprConsent"
                checked={gdprConsent === true}
                onCheckedChange={(checked) =>
                  setValue("gdprConsent", checked === true ? true : false, {
                    shouldValidate: true,
                  })
                }
                className="mt-0.5"
              />
              <label
                htmlFor="gdprConsent"
                className="text-sm leading-relaxed text-foreground"
              >
                I agree that my personal data will be stored for the purpose of
                this reservation and automatically deleted 30 days after my
                visit.{" "}
                <a
                  href={`/${slug}/privacy-policy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.gdprConsent && (
              <p className="text-sm text-destructive">
                {errors.gdprConsent.message}
              </p>
            )}

            <div className="flex items-start gap-3 rounded-lg border border-orange-200/60 bg-white p-4">
              <Checkbox
                id="marketingConsent"
                checked={marketingConsent === true}
                onCheckedChange={(checked) =>
                  setValue("marketingConsent", checked === true ? true : false)
                }
                className="mt-0.5"
              />
              <label
                htmlFor="marketingConsent"
                className="text-sm leading-relaxed text-muted-foreground"
              >
                I&apos;d like to receive special offers, event notifications, and
                today&apos;s menu updates from {restaurant.name}. (Optional)
              </label>
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="h-14 flex-1 text-base font-semibold"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-14 flex-1 text-base font-semibold"
            >
              {submitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
