import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";
import { decrypt } from "@/lib/encrypt";
import { webhookBookingStatusChanged } from "@/lib/n8nWebhook";

// All routes require NextAuth session
async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

// ─── GET: Fetch single booking ───

export async function GET(request, { params }) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "slug query parameter is required" },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient(slug);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        table: { select: { label: true, section: true, capacity: true } },
      },
    });

    if (!booking || booking.deletedAt) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...booking,
      customerName: decrypt(booking.customerName),
      customerEmail: decrypt(booking.customerEmail),
      customerPhone: booking.customerPhone
        ? decrypt(booking.customerPhone)
        : null,
    });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update booking status or details ───

const updateBookingSchema = z.object({
  status: z
    .enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", "PENDING", "SEATED"])
    .optional(),
  staffNotes: z.string().optional(),
  waiter: z.string().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "slug query parameter is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient(slug);

    // Check booking exists
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const updateData = {};
    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
    }
    if (parsed.data.staffNotes !== undefined) {
      updateData.staffNotes = parsed.data.staffNotes;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        table: { select: { label: true, section: true } },
      },
    });

    // Fire n8n webhook if status changed
    if (parsed.data.status && parsed.data.status !== existing.status) {
      const restaurant = await getRestaurant(slug);
      webhookBookingStatusChanged({
        booking: {
          id: updated.id,
          customerName: decrypt(updated.customerName),
          customerEmail: decrypt(updated.customerEmail),
          startTime: updated.startTime,
          partySize: updated.partySize,
        },
        restaurant,
        oldStatus: existing.status,
        newStatus: parsed.data.status,
      });
    }

    return NextResponse.json({
      ...updated,
      customerName: decrypt(updated.customerName),
      customerEmail: decrypt(updated.customerEmail),
      customerPhone: updated.customerPhone
        ? decrypt(updated.customerPhone)
        : null,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft delete booking (set deletedAt) ───

export async function DELETE(request, { params }) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "slug query parameter is required" },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient(slug);

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    await prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Booking deleted", id });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
