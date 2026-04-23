import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";
import crypto from "crypto";

// ─── PATCH: Update a staff member ───

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
  department: z.enum(["KITCHEN", "FRONT", "DELIVERY", "MANAGER"]).optional(),
  contractType: z.enum(["FULL_TIME", "PART_TIME", "MINI_JOB"]).optional(),
  monthlyHoursTarget: z.coerce.number().int().min(1).max(300).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const slug = session.user.restaurantSlug;
    const prisma = getPrismaClient(slug);

    const existing = await prisma.staffMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const updated = await prisma.staffMember.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, department: true, contractType: true,
        monthlyHoursTarget: true, isActive: true,
      },
    });

    return NextResponse.json({ staff: updated });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: Remove a staff member ───

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can delete staff" }, { status: 403 });
    }

    const { id } = await params;
    const slug = session.user.restaurantSlug;
    const prisma = getPrismaClient(slug);

    // Don't allow deleting yourself
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.staffMember.delete({ where: { id } });
    return NextResponse.json({ message: "Staff member deleted", id });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
