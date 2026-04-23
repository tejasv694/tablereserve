import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";
import { generateShiftPlan } from "@/lib/shiftPlanner";
import { webhookShiftPlanReady, webhookShiftShortage } from "@/lib/n8nWebhook";
import { startOfWeek, addDays, startOfMonth, endOfMonth } from "date-fns";

// ─── GET: Get shift plan for a week ───

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
    const weekParam = searchParams.get("week");

    const targetDate = weekParam ? new Date(weekParam) : new Date();
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    weekStart.setHours(0, 0, 0, 0);

    const plan = await prisma.shiftPlan.findUnique({
      where: {
        restaurantId_weekStartDate: {
          restaurantId: restaurant.id,
          weekStartDate: weekStart,
        },
      },
      include: {
        assignments: {
          include: {
            staff: {
              select: { id: true, name: true, department: true },
            },
          },
          orderBy: [{ date: "asc" }, { shiftStart: "asc" }],
        },
      },
    });

    return NextResponse.json({
      plan,
      weekStartDate: weekStart.toISOString(),
    });
  } catch (error) {
    console.error("Get shift plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Generate a shift plan for next week ───

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const slug = session.user.restaurantSlug;
    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Get config
    const config = await prisma.shiftConfig.findUnique({
      where: { restaurantId: restaurant.id },
    });
    if (!config) {
      return NextResponse.json({ error: "Shift configuration not set up yet" }, { status: 400 });
    }

    // Target week (next week's Monday by default, or from body)
    const body = await request.json().catch(() => ({}));
    const targetDate = body.weekStartDate ? new Date(body.weekStartDate) : addDays(new Date(), 7);
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    weekStart.setHours(0, 0, 0, 0);

    // Delete existing plan for this week if regenerating
    const existingPlan = await prisma.shiftPlan.findUnique({
      where: {
        restaurantId_weekStartDate: {
          restaurantId: restaurant.id,
          weekStartDate: weekStart,
        },
      },
    });
    if (existingPlan) {
      await prisma.shiftAssignment.deleteMany({ where: { shiftPlanId: existingPlan.id } });
      await prisma.shiftPlan.delete({ where: { id: existingPlan.id } });
    }

    // Get active staff
    const staff = await prisma.staffMember.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
    });

    // Get availability submissions for this week, sorted by submittedAt (first come first serve)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const availabilities = await prisma.staffAvailability.findMany({
      where: {
        staffMemberId: { in: staff.map((s) => s.id) },
        weekStartDate: { gte: weekStart, lt: weekEnd },
      },
      orderBy: { submittedAt: "asc" },
    });

    // Get existing assignments this month (for monthly hours tracking)
    const monthStart = startOfMonth(weekStart);
    const monthEnd = endOfMonth(weekStart);

    const existingAssignments = await prisma.shiftAssignment.findMany({
      where: {
        staffMemberId: { in: staff.map((s) => s.id) },
        date: { gte: monthStart, lte: monthEnd },
        status: { not: "CANCELLED" },
      },
      select: { staffMemberId: true, hours: true },
    });

    // Run the planning algorithm
    const { assignments, shortages } = generateShiftPlan({
      config,
      staff,
      availabilities,
      weekStartDate: weekStart,
      existingAssignmentsThisMonth: existingAssignments,
    });

    // Determine plan status
    const planStatus = shortages.length > 0 ? "SHORTAGE" : "DRAFT";

    // Create the plan
    const shiftPlan = await prisma.shiftPlan.create({
      data: {
        restaurantId: restaurant.id,
        weekStartDate: weekStart,
        status: planStatus,
        shortageDetails: shortages.length > 0 ? shortages : undefined,
        assignments: {
          create: assignments,
        },
      },
      include: {
        assignments: {
          include: {
            staff: { select: { id: true, name: true, department: true, email: true, phone: true } },
          },
          orderBy: [{ date: "asc" }, { shiftStart: "asc" }],
        },
      },
    });

    // Fire n8n webhooks
    if (planStatus === "SHORTAGE") {
      webhookShiftShortage({
        shiftPlan,
        restaurant,
        shortageDetails: shortages,
      });
    }

    return NextResponse.json({ plan: shiftPlan, shortages }, { status: 201 });
  } catch (error) {
    console.error("Generate shift plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
