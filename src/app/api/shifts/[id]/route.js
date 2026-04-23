import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";
import { webhookShiftPlanReady } from "@/lib/n8nWebhook";

// ─── PATCH: Release plan, override assignments, or update status ───

const updatePlanSchema = z.object({
  action: z.enum(["release", "override_assignment", "cancel_assignment"]),
  // For override_assignment:
  assignmentId: z.string().optional(),
  staffMemberId: z.string().optional(),
  shiftName: z.string().optional(),
  shiftStart: z.string().optional(),
  shiftEnd: z.string().optional(),
  date: z.string().optional(),
  role: z.enum(["KITCHEN", "FRONT", "DELIVERY", "MANAGER"]).optional(),
  hours: z.number().optional(),
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
    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const slug = session.user.restaurantSlug;
    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);

    const plan = await prisma.shiftPlan.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            staff: { select: { id: true, name: true, email: true, phone: true, department: true } },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Shift plan not found" }, { status: 404 });
    }

    const { action } = parsed.data;

    if (action === "release") {
      // Release the plan — mark as RELEASED and fire webhook
      const updated = await prisma.shiftPlan.update({
        where: { id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
        },
        include: {
          assignments: {
            include: {
              staff: { select: { id: true, name: true, email: true, phone: true, department: true } },
            },
            orderBy: [{ date: "asc" }, { shiftStart: "asc" }],
          },
        },
      });

      // Fire n8n webhook to send shift plan emails to all staff
      webhookShiftPlanReady({
        shiftPlan: updated,
        restaurant,
        assignments: updated.assignments.map((a) => ({
          staffName: a.staff.name,
          staffEmail: a.staff.email,
          staffPhone: a.staff.phone,
          date: a.date,
          shiftName: a.shiftName,
          shiftStart: a.shiftStart,
          shiftEnd: a.shiftEnd,
          role: a.role,
        })),
      });

      return NextResponse.json({ plan: updated });
    }

    if (action === "override_assignment") {
      // Owner manually adds/changes an assignment
      const { staffMemberId, shiftName, shiftStart, shiftEnd, date, role, hours } = parsed.data;

      if (!staffMemberId || !shiftName || !shiftStart || !shiftEnd || !date || !role) {
        return NextResponse.json({ error: "Missing required fields for override" }, { status: 400 });
      }

      const assignment = await prisma.shiftAssignment.create({
        data: {
          shiftPlanId: id,
          staffMemberId,
          date: new Date(date),
          shiftName,
          shiftStart,
          shiftEnd,
          role,
          hours: hours || 8,
          isOverride: true,
        },
        include: {
          staff: { select: { id: true, name: true, department: true } },
        },
      });

      // Update plan status to OVERRIDDEN
      await prisma.shiftPlan.update({
        where: { id },
        data: { status: "OVERRIDDEN" },
      });

      return NextResponse.json({ assignment });
    }

    if (action === "cancel_assignment") {
      const { assignmentId } = parsed.data;
      if (!assignmentId) {
        return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
      }

      await prisma.shiftAssignment.update({
        where: { id: assignmentId },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({ message: "Assignment cancelled" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Update shift plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
