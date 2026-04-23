// CSV export + data deletion logic

import { decrypt } from "./encrypt.js";
import { format, subDays } from "date-fns";
import fs from "fs";
import path from "path";

/**
 * Finds all bookings older than 30 days, exports PII to CSV, then hard deletes them.
 *
 * @param {string} restaurantId
 * @param {import("@prisma/client").PrismaClient} prismaClient
 * @returns {Promise<{ exported: number, deleted: number, file: string|null }>}
 */
export async function exportAndDeleteOldBookings(restaurantId, prismaClient) {
  const cutoff = subDays(new Date(), 30);

  const bookings = await prismaClient.booking.findMany({
    where: {
      restaurantId,
      startTime: { lt: cutoff },
      deletedAt: null,
    },
    include: {
      table: { select: { label: true } },
    },
  });

  if (bookings.length === 0) {
    return { exported: 0, deleted: 0, file: null };
  }

  // Decrypt PII and build CSV rows
  const header =
    "id,tableLabel,partySize,startTime,endTime,customerName,customerEmail,customerPhone,status,specialRequests,source,createdAt";

  const rows = bookings.map((b) => {
    const name = decrypt(b.customerName) || "";
    const email = decrypt(b.customerEmail) || "";
    const phone = b.customerPhone ? decrypt(b.customerPhone) : "";

    // Escape CSV fields
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    return [
      esc(b.id),
      esc(b.table?.label || ""),
      b.partySize,
      esc(format(new Date(b.startTime), "yyyy-MM-dd HH:mm")),
      esc(format(new Date(b.endTime), "yyyy-MM-dd HH:mm")),
      esc(name),
      esc(email),
      esc(phone),
      esc(b.status),
      esc(b.specialRequests || ""),
      esc(b.source),
      esc(format(new Date(b.createdAt), "yyyy-MM-dd HH:mm")),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  // Save CSV to /exports/{restaurantId}/{YYYY-MM}.csv
  const monthStr = format(new Date(), "yyyy-MM");
  const exportDir = path.join(process.cwd(), "exports", restaurantId);
  fs.mkdirSync(exportDir, { recursive: true });

  const filePath = path.join(exportDir, `${monthStr}.csv`);

  // Append if file already exists (multiple runs in same month)
  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, "\n" + rows.join("\n"), "utf-8");
  } else {
    fs.writeFileSync(filePath, csv, "utf-8");
  }

  // Hard delete the exported bookings
  const ids = bookings.map((b) => b.id);
  await prismaClient.booking.deleteMany({
    where: { id: { in: ids } },
  });

  return {
    exported: bookings.length,
    deleted: ids.length,
    file: filePath,
  };
}
