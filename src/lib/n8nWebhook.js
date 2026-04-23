/**
 * Fire-and-forget webhook calls to n8n.
 * Never blocks the main request — silently catches errors.
 *
 * Environment variables:
 *   N8N_WEBHOOK_BASE_URL — e.g. https://n8n.yourdomain.com/webhook
 */

const BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || "";

/**
 * Send an event to n8n via webhook.
 * @param {string} event - Event path, appended to base URL (e.g. "booking-created")
 * @param {object} payload - JSON payload
 */
export function fireWebhook(event, payload) {
  if (!BASE_URL) {
    console.log(`[n8n webhook] SKIP: N8N_WEBHOOK_BASE_URL not set`);
    return;
  }

  const url = `${BASE_URL}/${event}`;
  console.log(`[n8n webhook] Firing to: ${url}`);

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
  })
    .then((res) => {
      console.log(`[n8n webhook] ${event}: ${res.status} ${res.statusText}`);
    })
    .catch((err) => {
      console.error(`[n8n webhook] ${event} FAILED:`, err.message);
    });
}

// ─── Booking Events ───

export function webhookBookingCreated({ booking, restaurant }) {
  fireWebhook("booking-created", {
    event: "booking.created",
    booking: {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone || null,
      startTime: booking.startTime,
      endTime: booking.endTime,
      partySize: booking.partySize,
      status: booking.status,
      table: booking.table,
      specialRequests: booking.specialRequests || null,
      marketingConsent: booking.marketingConsent || false,
    },
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
    },
  });
}

export function webhookBookingStatusChanged({ booking, restaurant, oldStatus, newStatus }) {
  fireWebhook("booking-status-changed", {
    event: "booking.status_changed",
    booking: {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      startTime: booking.startTime,
      partySize: booking.partySize,
      oldStatus,
      newStatus,
    },
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      email: restaurant.email,
    },
  });
}

// ─── Shift Events ───

export function webhookShiftPlanReady({ shiftPlan, restaurant, assignments }) {
  fireWebhook("shift-plan-ready", {
    event: "shift.plan_ready",
    shiftPlan: {
      id: shiftPlan.id,
      weekStartDate: shiftPlan.weekStartDate,
      status: shiftPlan.status,
    },
    assignments,
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      email: restaurant.email,
    },
  });
}

export function webhookShiftShortage({ shiftPlan, restaurant, shortageDetails }) {
  fireWebhook("shift-shortage", {
    event: "shift.shortage",
    shiftPlan: {
      id: shiftPlan.id,
      weekStartDate: shiftPlan.weekStartDate,
    },
    shortageDetails,
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      email: restaurant.email,
    },
  });
}

export function webhookAvailabilityReminder({ staff, restaurant, weekStartDate }) {
  fireWebhook("availability-reminder", {
    event: "shift.availability_reminder",
    staff: staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      availabilityToken: s.availabilityToken,
    })),
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
    },
    weekStartDate,
  });
}
