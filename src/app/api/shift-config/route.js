import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";

// ─── GET: Get shift config for current restaurant ───

export async function GET() {
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

    let config = await prisma.shiftConfig.findUnique({
      where: { restaurantId: restaurant.id },
    });

    // If no config exists yet, create default
    if (!config) {
      config = await prisma.shiftConfig.create({
        data: { restaurantId: restaurant.id },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Get shift config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT: Update shift config ───

const updateConfigSchema = z.object({
  minStaffPerRole: z.record(z.string(), z.number().int().min(0)).optional(),
  minTotalStaff: z.coerce.number().int().min(1).optional(),
  shiftMode: z.enum(["CONSTANT", "SHUFFLE"]).optional(),
  shiftSlots: z.array(z.object({
    name: z.string().min(1),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  availabilityDeadlineDay: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]).optional(),
  planReleaseDay: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]).optional(),
  planReleaseTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const slug = session.user.restaurantSlug;
    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const data = {};
    if (parsed.data.minStaffPerRole !== undefined) data.minStaffPerRole = parsed.data.minStaffPerRole;
    if (parsed.data.minTotalStaff !== undefined) data.minTotalStaff = parsed.data.minTotalStaff;
    if (parsed.data.shiftMode !== undefined) data.shiftMode = parsed.data.shiftMode;
    if (parsed.data.shiftSlots !== undefined) data.shiftSlots = parsed.data.shiftSlots;
    if (parsed.data.availabilityDeadlineDay !== undefined) data.availabilityDeadlineDay = parsed.data.availabilityDeadlineDay;
    if (parsed.data.planReleaseDay !== undefined) data.planReleaseDay = parsed.data.planReleaseDay;
    if (parsed.data.planReleaseTime !== undefined) data.planReleaseTime = parsed.data.planReleaseTime;

    const config = await prisma.shiftConfig.upsert({
      where: { restaurantId: restaurant.id },
      update: data,
      create: { restaurantId: restaurant.id, ...data },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Update shift config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
