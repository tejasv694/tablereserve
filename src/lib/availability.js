import { addMinutes, startOfDay, format } from "date-fns";

const SLOT_DURATION = 120; // 2 hours in minutes
const BUFFER = 25; // 25-minute turnover buffer
const TOTAL_BLOCK = SLOT_DURATION + BUFFER; // 145 minutes

/**
 * Checks whether a specific table is available at the requested start time.
 *
 * A table is NOT available if any CONFIRMED booking exists where:
 *   - booking.startTime < requestedStartTime + 2h25m  (the new booking would start before the old one is fully cleared)
 *   - booking.availableFrom > requestedStartTime       (the old booking hasn't cleared yet when new one starts)
 *
 * @param {string} tableId
 * @param {Date} requestedStartTime
 * @param {import("@prisma/client").PrismaClient} prismaClient
 * @returns {Promise<boolean>}
 */
export async function isSlotAvailable(tableId, requestedStartTime, prismaClient) {
  const requestedEnd = addMinutes(requestedStartTime, TOTAL_BLOCK);

  const conflicting = await prismaClient.booking.findFirst({
    where: {
      tableId,
      status: "CONFIRMED",
      deletedAt: null,
      startTime: { lt: requestedEnd },
      availableFrom: { gt: requestedStartTime },
    },
  });

  return !conflicting;
}

/**
 * Returns an array of available time slot strings (e.g. ["18:00", "18:30"])
 * for a given restaurant, date, and party size.
 *
 * Steps:
 * 1. Get all active tables where capacity >= partySize
 * 2. Get restaurant operating hours for the given day
 * 3. Generate slots every 30 min within operating hours
 * 4. Filter out unavailable slots using isSlotAvailable
 * 5. Return de-duplicated sorted list of available time strings
 *
 * @param {string} restaurantId
 * @param {Date} date - The date to check (day only, times generated from operating hours)
 * @param {number} partySize
 * @param {import("@prisma/client").PrismaClient} prismaClient
 * @returns {Promise<string[]>}
 */
export async function getAvailableSlots(restaurantId, date, partySize, prismaClient) {
  // 1. Get restaurant config
  const restaurant = await prismaClient.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new Error(`Restaurant not found: ${restaurantId}`);
  }

  // 2. Get tables that fit the party size
  const tables = await prismaClient.table.findMany({
    where: {
      restaurantId,
      isActive: true,
      isOnline: true,
      capacity: { gte: partySize },
    },
  });

  if (tables.length === 0) {
    return [];
  }

  // 3. Determine operating hours for this day
  const dayOfWeek = format(date, "EEEE").toLowerCase(); // e.g. "monday"
  const hours = restaurant.operatingHours?.[dayOfWeek];

  if (!hours || !hours.open || !hours.close) {
    return []; // Restaurant closed on this day
  }

  // 4. Generate time slots within operating hours
  const dayStart = startOfDay(date);
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);

  const openTime = addMinutes(dayStart, openH * 60 + openM);
  // Last slot must allow the full 2-hour duration to fit before closing
  const lastSlotTime = addMinutes(dayStart, closeH * 60 + closeM - SLOT_DURATION);

  const interval = restaurant.slotIntervalMinutes || 30;
  const slots = [];
  let current = openTime;

  while (current <= lastSlotTime) {
    slots.push(new Date(current));
    current = addMinutes(current, interval);
  }

  if (slots.length === 0) {
    return [];
  }

  // 5. For each slot, check if at least one table is available
  const availableSet = new Set();

  for (const slotTime of slots) {
    for (const table of tables) {
      const available = await isSlotAvailable(table.id, slotTime, prismaClient);
      if (available) {
        availableSet.add(format(slotTime, "HH:mm"));
        break; // At least one table is free — slot is available, move to next slot
      }
    }
  }

  // 6. Return sorted unique time strings
  return Array.from(availableSet).sort();
}
