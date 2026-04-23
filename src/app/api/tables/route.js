import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient, getRestaurant } from "@/lib/tenant";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: [{ section: "asc" }, { label: "asc" }],
    });

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("List tables error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createTableSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  capacity: z.coerce.number().int().min(1).max(50),
  minCapacity: z.coerce.number().int().min(1).optional().default(1),
  section: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isOnline: z.boolean().optional().default(true),
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slug, label, capacity, minCapacity, section, isActive, isOnline } = parsed.data;
    const prisma = getPrismaClient(slug);
    const restaurant = await getRestaurant(slug);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const table = await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        label,
        capacity,
        minCapacity,
        section: section || null,
        isActive,
        isOnline,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error("Create table error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
