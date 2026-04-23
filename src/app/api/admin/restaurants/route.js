import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/getAdminSession";
import masterPrisma from "@/lib/masterDb";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const plan = searchParams.get("plan") || "";

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { ownerEmail: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [restaurants, total, active, trial, suspended] = await Promise.all([
      masterPrisma.restaurantAccount.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      masterPrisma.restaurantAccount.count(),
      masterPrisma.restaurantAccount.count({ where: { status: "ACTIVE" } }),
      masterPrisma.restaurantAccount.count({ where: { plan: "TRIAL" } }),
      masterPrisma.restaurantAccount.count({ where: { status: "SUSPENDED" } }),
    ]);

    return NextResponse.json({
      restaurants,
      stats: { total, active, trial, suspended },
    });
  } catch (error) {
    console.error("List restaurants error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerEmail: z.string().email("Valid email required"),
  plan: z.enum(["TRIAL", "BASIC", "PRO"]).default("TRIAL"),
});

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, ownerName, ownerEmail, plan } = parsed.data;

    // Check slug uniqueness
    const existing = await masterPrisma.restaurantAccount.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A restaurant with this slug already exists" },
        { status: 409 }
      );
    }

    // Database name from slug
    const dbName = `db_${slug.replace(/-/g, "_")}`;
    const dbUser = process.env.DB_USER || "bookinguser";
    const dbPassword = process.env.DB_PASSWORD || "yourpassword";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || "5432";
    const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

    // 1. Create the actual PostgreSQL database
    const adminPrisma = new PrismaClient({
      datasources: {
        db: { url: `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres` },
      },
    });

    try {
      await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
    } catch (dbErr) {
      // Database may already exist
      if (!dbErr.message?.includes("already exists")) {
        throw dbErr;
      }
    } finally {
      await adminPrisma.$disconnect();
    }

    // 2. Run Prisma schema migration on the new database
    const tenantPrisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    // Push the tenant schema to the new database
    const { execSync } = await import("child_process");
    execSync(
      `npx prisma db push --schema=prisma/schema.prisma --skip-generate`,
      {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "pipe",
      }
    );

    // 3. Create the restaurant record in the new tenant DB
    const restaurant = await tenantPrisma.restaurant.create({
      data: {
        name,
        slug,
        email: ownerEmail,
        timezone: "Europe/Berlin",
        locale: "de",
        operatingHours: {
          monday: { open: "12:00", close: "22:00" },
          tuesday: { open: "12:00", close: "22:00" },
          wednesday: { open: "12:00", close: "22:00" },
          thursday: { open: "12:00", close: "22:00" },
          friday: { open: "12:00", close: "23:00" },
          saturday: { open: "12:00", close: "23:00" },
          sunday: { open: "12:00", close: "21:00" },
        },
      },
    });

    // 4. Create initial staff member with temporary password
    const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 char random
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await tenantPrisma.staffMember.create({
      data: {
        restaurantId: restaurant.id,
        name: ownerName,
        email: ownerEmail,
        passwordHash,
        role: "OWNER",
      },
    });

    await tenantPrisma.$disconnect();

    // 5. Create entry in master database
    const account = await masterPrisma.restaurantAccount.create({
      data: {
        name,
        slug,
        ownerName,
        ownerEmail,
        plan,
        databaseUrl,
      },
    });

    return NextResponse.json(
      {
        account,
        credentials: {
          slug,
          email: ownerEmail,
          temporaryPassword: tempPassword,
          loginUrl: `/dashboard/login`,
          note: "Send these credentials to the restaurant owner. They should change their password after first login.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create restaurant error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
