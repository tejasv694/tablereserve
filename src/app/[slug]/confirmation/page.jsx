import { getPrismaClient } from "@/lib/tenant";
import { decrypt } from "@/lib/encrypt";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: "Booking Received" };
}

export default async function ConfirmationPage({ params, searchParams }) {
  const { slug } = await params;
  const { bookingId } = await searchParams;

  if (!bookingId) notFound();

  const prisma = getPrismaClient(slug);

  const [booking, restaurant] = await Promise.all([
    prisma.booking.findUnique({
      where: { id: bookingId },
      include: { table: { select: { label: true, section: true } } },
    }),
    prisma.restaurant.findUnique({ where: { slug } }),
  ]);

  if (!booking || !restaurant) notFound();

  const customerName = decrypt(booking.customerName);
  const dateFormatted = format(new Date(booking.startTime), "EEEE, d MMMM yyyy");
  const timeFormatted = format(new Date(booking.startTime), "h:mm a");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50/60 to-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 shadow-sm">
          <svg className="h-10 w-10 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Booking Received!
        </h1>
        <p className="mb-2 text-muted-foreground">
          {restaurant.name}
        </p>
        <p className="mb-8 text-sm text-orange-600 font-medium">
          The restaurant will confirm your reservation shortly.
        </p>

        <div className="mb-8 rounded-xl border border-orange-200/60 bg-white p-6 text-left shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</p>
              <p className="text-lg font-semibold">{dateFormatted}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time</p>
              <p className="text-lg font-semibold">{timeFormatted}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Party Size</p>
              <p className="text-lg font-semibold">
                {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Table</p>
              <p className="text-lg font-semibold">
                {booking.table.label}
                {booking.table.section && ` — ${booking.table.section}`}
              </p>
            </div>
            <div className="border-t border-orange-200/60 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Booking Reference</p>
              <p className="font-mono text-base font-semibold">{booking.id}</p>
            </div>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          You will receive a confirmation email once the restaurant approves your booking.
        </p>

        <Link href={`/${slug}/book`}>
          <Button className="h-14 w-full text-base font-semibold shadow-md shadow-primary/20">
            Make Another Booking
          </Button>
        </Link>

        <p className="mt-8 text-xs text-muted-foreground">
          Your personal data will be automatically deleted 30 days after your visit.
        </p>
      </div>
    </main>
  );
}
