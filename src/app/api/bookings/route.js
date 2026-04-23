import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";
import { isSlotAvailable } from "@/lib/availability";
import { encrypt, decrypt } from "@/lib/encrypt";
import { addMinutes, parseISO, startOfDay, endOfDay } from "date-fns";
import { webhookBookingCreated } from "@/lib/n8nWebhook";

// ─── POST: Create a new booking (public, no auth) ───

const createBookingSchema = z.object({
  slug: z.string().min(1),
  tableId: z.string().min(1),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  partySize: z.coerce.number().int().min(1).max(20),
  startTime: z.string().datetime({ message: "startTime must be a valid ISO datetime" }),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "GDPR consent is required" }),
  }),
  specialRequests: z.string().optional(),
  marketingConsent: z.boolean().optional().default(false),
  source: z.enum(["ONLINE", "PHONE", "WALKIN"]).optional().default("ONLINE"),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      slug,
      tableId,
      customerName,
      customerEmail,
      customerPhone,
      partySize,
      startTime: startTimeStr,
      gdprConsent,
      specialRequests,
      marketingConsent,
      source,
    } = parsed.data;

    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const startTime = new Date(startTimeStr);
    const slotDuration = restaurant.slotDurationMinutes || 120;
    const buffer = restaurant.bufferMinutes || 25;
    const endTime = addMinutes(startTime, slotDuration);
    const availableFrom = addMinutes(startTime, slotDuration + buffer);

    // Use a Prisma transaction to atomically check + create (prevent double-booking)
    const booking = await prisma.$transaction(async (tx) => {
      // Auto-assign table if tableId is "auto"
      let assignedTableId = tableId;
      if (tableId === "auto") {
        const tables = await tx.table.findMany({
          where: {
            restaurantId: restaurant.id,
            isActive: true,
            isOnline: true,
            capacity: { gte: partySize },
          },
          orderBy: { capacity: "asc" },
        });

        let foundTable = null;
        for (const table of tables) {
          const available = await isSlotAvailable(table.id, startTime, tx);
          if (available) {
            foundTable = table;
            break;
          }
        }

        if (!foundTable) {
          throw new Error("SLOT_TAKEN");
        }
        assignedTableId = foundTable.id;
      } else {
        const available = await isSlotAvailable(tableId, startTime, tx);
        if (!available) {
          throw new Error("SLOT_TAKEN");
        }
      }

      return tx.booking.create({
        data: {
          restaurantId: restaurant.id,
          tableId: assignedTableId,
          customerName: encrypt(customerName),
          customerEmail: encrypt(customerEmail),
          customerPhone: customerPhone ? encrypt(customerPhone) : null,
          partySize,
          startTime,
          endTime,
          availableFrom,
          status: "PENDING",
          gdprConsent,
          consentAt: new Date(),
          specialRequests: specialRequests || null,
          marketingConsent: marketingConsent || false,
          source,
        },
        include: {
          table: { select: { label: true, section: true } },
        },
      });
    });

    // Fire n8n webhook — n8n handles all emails (confirmation to customer + notification to owner)
    webhookBookingCreated({
      booking: {
        id: booking.id,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        startTime: booking.startTime,
        endTime: booking.endTime,
        partySize: booking.partySize,
        status: booking.status,
        table: booking.table,
        specialRequests: specialRequests || null,
        marketingConsent: marketingConsent || false,
      },
      restaurant,
    });

    return NextResponse.json(
      {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        partySize: booking.partySize,
        status: booking.status,
        table: booking.table,
        restaurantName: restaurant.name,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please choose another." },
        { status: 409 }
      );
    }
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── GET: List bookings (requires NextAuth session) ───

const listQuerySchema = z.object({
  slug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["CONFIRMED", "SEATED", "CANCELLED", "COMPLETED", "NO_SHOW", "PENDING"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      slug: searchParams.get("slug"),
      date: searchParams.get("date") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slug, date, status, page, limit } = parsed.data;
    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const where = {
      restaurantId: restaurant.id,
      deletedAt: null,
    };

    if (date) {
      const dayDate = parseISO(date);
      where.startTime = {
        gte: startOfDay(dayDate),
        lte: endOfDay(dayDate),
      };
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          table: { select: { label: true, section: true } },
        },
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // Decrypt PII fields before returning
    const decrypted = bookings.map((b) => ({
      ...b,
      customerName: decrypt(b.customerName),
      customerEmail: decrypt(b.customerEmail),
      customerPhone: b.customerPhone ? decrypt(b.customerPhone) : null,
    }));

    return NextResponse.json({
      bookings: decrypted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
