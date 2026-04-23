import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ─── GET: List staff members ───

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

    const staff = await prisma.staffMember.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        contractType: true,
        monthlyHoursTarget: true,
        isActive: true,
        availabilityToken: true,
        createdAt: true,
      },
    });

    // Calculate hours worked this month for each staff member
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        staffMemberId: { in: staff.map((s) => s.id) },
        date: { gte: startOfMonth, lte: endOfMonth },
        status: { not: "CANCELLED" },
      },
      select: { staffMemberId: true, hours: true },
    });

    const hoursMap = {};
    for (const a of assignments) {
      hoursMap[a.staffMemberId] = (hoursMap[a.staffMemberId] || 0) + a.hours;
    }

    const enriched = staff.map((s) => ({
      ...s,
      hoursThisMonth: Math.round((hoursMap[s.id] || 0) * 10) / 10,
    }));

    return NextResponse.json({ staff: enriched });
  } catch (error) {
    console.error("List staff error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Add a new staff member ───

const createStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).default("STAFF"),
  department: z.enum(["KITCHEN", "FRONT", "DELIVERY", "MANAGER"]).default("FRONT"),
  contractType: z.enum(["FULL_TIME", "PART_TIME", "MINI_JOB"]).default("PART_TIME"),
  monthlyHoursTarget: z.coerce.number().int().min(1).max(300).default(80),
  password: z.string().min(6).optional(),
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and MANAGER can add staff
    if (!["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createStaffSchema.safeParse(body);
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

    const { name, email, phone, role, department, contractType, monthlyHoursTarget, password } = parsed.data;

    // Check email uniqueness
    const existing = await prisma.staffMember.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A staff member with this email already exists" }, { status: 409 });
    }

    // Generate password if not provided
    const tempPassword = password || crypto.randomBytes(6).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Generate unique availability token
    const availabilityToken = crypto.randomBytes(16).toString("hex");

    const staff = await prisma.staffMember.create({
      data: {
        restaurantId: restaurant.id,
        name,
        email,
        phone: phone || null,
        passwordHash,
        role,
        department,
        contractType,
        monthlyHoursTarget,
        availabilityToken,
      },
    });

    return NextResponse.json(
      {
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          department: staff.department,
        },
        temporaryPassword: tempPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
