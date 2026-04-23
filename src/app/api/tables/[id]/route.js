import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrismaClient } from "@/lib/tenant";

const updateTableSchema = z.object({
  label: z.string().min(1).optional(),
  capacity: z.coerce.number().int().min(1).max(50).optional(),
  minCapacity: z.coerce.number().int().min(1).optional(),
  section: z.string().optional(),
  isActive: z.boolean().optional(),
  isOnline: z.boolean().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateTableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient(slug);
    const table = await prisma.table.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("Update table error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const prisma = getPrismaClient(slug);
    await prisma.table.delete({ where: { id } });

    return NextResponse.json({ message: "Table deleted", id });
  } catch (error) {
    console.error("Delete table error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
