import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";
import { startOfWeek, addDays } from "date-fns";

// ─── GET: Get availability submissions for a week (dashboard, requires auth) ───

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slug = session.user.restaurantSlug;
    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get("week"); // ISO date string for any day in the target week

    // Calculate the Monday of the target week
    const targetDate = weekParam ? new Date(weekParam) : addDays(new Date(), 7);
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const nextWeekEnd = new Date(weekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    const availabilities = await prisma.staffAvailability.findMany({
      where: {
        weekStartDate: {
          gte: weekStart,
          lt: nextWeekEnd,
        },
        staff: { restaurantId: restaurant.id },
      },
      include: {
        staff: {
          select: { id: true, name: true, department: true, contractType: true },
        },
      },
      orderBy: { submittedAt: "asc" },
    });

    return NextResponse.json({
      availabilities,
      weekStartDate: weekStart.toISOString(),
    });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Submit availability (public — uses token, no auth needed) ───

const submitSchema = z.object({
  token: z.string().min(1),
  availableDays: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).min(1, "Select at least one day"),
  preferredShift: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, availableDays, preferredShift, notes } = parsed.data;

    // Find staff member by token — need to search across all tenant DBs
    // Since the token is unique and we embed the slug in the form URL, we receive slug too
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "slug query parameter required" }, { status: 400 });
    }

    const prisma = getPrismaClient(slug);

    const staff = await prisma.staffMember.findUnique({
      where: { availabilityToken: token },
      include: { restaurant: { select: { id: true } } },
    });

    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    // Check if deadline has passed
    const config = await prisma.shiftConfig.findUnique({
      where: { restaurantId: staff.restaurant.id },
    });

    // Calculate next week's Monday
    const now = new Date();
    const nextMonday = startOfWeek(addDays(now, 7), { weekStartsOn: 1 });
    nextMonday.setHours(0, 0, 0, 0);

    // Upsert availability (update if already submitted for this week)
    const availability = await prisma.staffAvailability.upsert({
      where: {
        staffMemberId_weekStartDate: {
          staffMemberId: staff.id,
          weekStartDate: nextMonday,
        },
      },
      update: {
        availableDays,
        preferredShift: preferredShift || null,
        notes: notes || null,
        submittedAt: new Date(),
      },
      create: {
        staffMemberId: staff.id,
        weekStartDate: nextMonday,
        availableDays,
        preferredShift: preferredShift || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      message: "Availability submitted successfully",
      weekStartDate: nextMonday.toISOString(),
      availableDays,
    }, { status: 201 });
  } catch (error) {
    console.error("Submit availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
