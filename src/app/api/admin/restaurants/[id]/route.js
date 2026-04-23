import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/getAdminSession";
import masterPrisma from "@/lib/masterDb";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const account = await masterPrisma.restaurantAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get basic stats from the tenant database
    let stats = { totalBookingsThisMonth: 0, totalTables: 0, totalStaff: 0 };
    try {
      const tenantPrisma = new PrismaClient({
        datasources: { db: { url: account.databaseUrl } },
      });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const restaurant = await tenantPrisma.restaurant.findUnique({
        where: { slug: account.slug },
      });

      if (restaurant) {
        const [bookings, tables, staff] = await Promise.all([
          tenantPrisma.booking.count({
            where: {
              restaurantId: restaurant.id,
              createdAt: { gte: startOfMonth },
            },
          }),
          tenantPrisma.table.count({
            where: { restaurantId: restaurant.id },
          }),
          tenantPrisma.staffMember.count({
            where: { restaurantId: restaurant.id },
          }),
        ]);

        stats = {
          totalBookingsThisMonth: bookings,
          totalTables: tables,
          totalStaff: staff,
        };
      }

      await tenantPrisma.$disconnect();
    } catch (err) {
      console.error("Stats fetch error:", err);
    }

    return NextResponse.json({ account, stats });
  } catch (error) {
    console.error("Get restaurant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const account = await masterPrisma.restaurantAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── Suspend / Reactivate ──
    if (action === "suspend") {
      const updated = await masterPrisma.restaurantAccount.update({
        where: { id },
        data: { status: "SUSPENDED" },
      });
      return NextResponse.json({ account: updated, message: "Restaurant suspended" });
    }

    if (action === "reactivate") {
      const updated = await masterPrisma.restaurantAccount.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
      return NextResponse.json({ account: updated, message: "Restaurant reactivated" });
    }

    // ── Reset staff password ──
    if (action === "reset-password") {
      const tenantPrisma = new PrismaClient({
        datasources: { db: { url: account.databaseUrl } },
      });

      const newPassword = crypto.randomBytes(6).toString("hex");
      const passwordHash = await bcrypt.hash(newPassword, 12);

      const owner = await tenantPrisma.staffMember.findFirst({
        where: { email: account.ownerEmail },
      });

      if (owner) {
        await tenantPrisma.staffMember.update({
          where: { id: owner.id },
          data: { passwordHash },
        });
      }

      await tenantPrisma.$disconnect();

      return NextResponse.json({
        message: "Password reset successfully",
        credentials: {
          email: account.ownerEmail,
          newPassword,
        },
      });
    }

    // ── Update plan ──
    if (body.plan) {
      const updated = await masterPrisma.restaurantAccount.update({
        where: { id },
        data: { plan: body.plan },
      });
      return NextResponse.json({ account: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update restaurant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const account = await masterPrisma.restaurantAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Drop the tenant database
    const dbName = `db_${account.slug.replace(/-/g, "_")}`;
    const dbUser = process.env.DB_USER || "bookinguser";
    const dbPassword = process.env.DB_PASSWORD || "yourpassword";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || "5432";

    const adminPrisma = new PrismaClient({
      datasources: {
        db: { url: `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres` },
      },
    });

    try {
      // Terminate connections first
      await adminPrisma.$executeRawUnsafe(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid()`
      );
      await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}"`);
    } catch (err) {
      console.error("Drop DB error:", err);
    } finally {
      await adminPrisma.$disconnect();
    }

    // Remove from master database
    await masterPrisma.restaurantAccount.delete({ where: { id } });

    return NextResponse.json({ message: "Restaurant deleted", id });
  } catch (error) {
    console.error("Delete restaurant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
