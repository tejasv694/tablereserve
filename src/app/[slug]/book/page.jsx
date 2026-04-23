import { getPrismaClient } from "@/lib/tenant";
import BookingForm from "@/components/booking/BookingForm";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const prisma = getPrismaClient(slug);
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!restaurant) return { title: "Restaurant Not Found" };

  return {
    title: `Book a Table — ${restaurant.name}`,
    description: `Reserve your table at ${restaurant.name}. Quick and easy online booking.`,
  };
}

export default async function BookingPage({ params }) {
  const { slug } = await params;
  const prisma = getPrismaClient(slug);

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      locale: true,
      maxPartySize: true,
      advanceBookingDays: true,
      slotIntervalMinutes: true,
    },
  });

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50/60 to-background">
      <header className="border-b border-orange-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4">
          <div className="text-2xl">🍽️</div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {restaurant.name}
            </h1>
            <p className="text-xs text-muted-foreground">Reserve a table</p>
          </div>
        </div>
      </header>
      <BookingForm slug={slug} restaurant={restaurant} />
    </main>
  );
}
