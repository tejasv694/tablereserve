// Monthly GDPR data export + hard delete (called by cron or manually)
// Crontab example — run monthly on the 1st at 2am:
// 0 2 1 * * curl -X POST https://yoursite.com/api/cron/cleanup -H "x-cron-secret: YOUR_SECRET" -H "Content-Type: application/json" -d '{"restaurantId":"xxx"}'

import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/tenant";
import { exportAndDeleteOldBookings } from "@/lib/gdpr";

export async function POST(request) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get("x-cron-secret");
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantId, slug } = body;

    if (!restaurantId || !slug) {
      return NextResponse.json(
        { error: "restaurantId and slug are required" },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient(slug);
    const result = await exportAndDeleteOldBookings(restaurantId, prisma);

    return NextResponse.json({
      message: "GDPR cleanup completed",
      ...result,
    });
  } catch (error) {
    console.error("GDPR cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
