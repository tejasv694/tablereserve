// Seed the master database with a platform admin user
// Usage: node prisma/master-seed.js

import { PrismaClient } from "../src/generated/master-prisma/index.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding master database...");

  const adminEmail = "admin@platform.com";
  const adminPassword = "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.platformAdmin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Platform Admin",
      passwordHash,
    },
  });

  console.log(`  Admin user: ${adminEmail} / ${adminPassword}`);

  // Also register the existing mario-ristorante if not already present
  const dbUser = process.env.DB_USER || "bookinguser";
  const dbPassword = process.env.DB_PASSWORD || "yourpassword";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "5432";

  await prisma.restaurantAccount.upsert({
    where: { slug: "mario-ristorante" },
    update: {},
    create: {
      name: "Mario's Ristorante",
      slug: "mario-ristorante",
      ownerEmail: "admin@mario.com",
      ownerName: "Mario Admin",
      plan: "PRO",
      status: "ACTIVE",
      databaseUrl: `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/db_mario_ristorante`,
    },
  });

  console.log("  Registered mario-ristorante in master DB");
  console.log("\nMaster seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
