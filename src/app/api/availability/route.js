import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";
import { getAvailableSlots } from "@/lib/availability";
import { parseISO } from "date-fns";

const querySchema = z.object({
  slug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  partySize: z.coerce.number().int().min(1).max(20),
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      slug: searchParams.get("slug"),
      date: searchParams.get("date"),
      partySize: searchParams.get("partySize"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slug, date, partySize } = parsed.data;
    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const dateObj = parseISO(date);
    const slots = await getAvailableSlots(
      restaurant.id,
      dateObj,
      partySize,
      prisma
    );

    return NextResponse.json({ slots, date, partySize });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
