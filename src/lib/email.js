import { Resend } from "resend";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "bookings@yourplatform.com";

/**
 * Sends a booking confirmation email to the customer.
 *
 * @param {object} params
 * @param {object} params.booking - Booking with decrypted PII (customerName, customerEmail, startTime, partySize, id)
 * @param {object} params.restaurant - Restaurant record (name, timezone, locale)
 */
export async function sendBookingConfirmation({ booking, restaurant }) {
  const locale = restaurant.locale || "de";
  const isGerman = locale === "de";
  const dateLocale = isGerman ? de : enUS;

  const dateFormatted = format(new Date(booking.startTime), "EEEE, d MMMM yyyy", {
    locale: dateLocale,
  });
  const timeFormatted = format(new Date(booking.startTime), "HH:mm", {
    locale: dateLocale,
  });

  const subject = isGerman
    ? `Ihre Reservierung bei ${restaurant.name} ist bestätigt ✓`
    : `Your booking at ${restaurant.name} is confirmed ✓`;

  const gdprNote = isGerman
    ? "Ihre Daten werden 30 Tage nach Ihrem Besuch automatisch gelöscht."
    : "Your data will be automatically deleted 30 days after your visit.";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 24px 0;">
    <div style="font-size: 48px;">✓</div>
    <h1 style="font-size: 24px; margin: 8px 0;">
      ${isGerman ? "Reservierung bestätigt" : "Booking Confirmed"}
    </h1>
  </div>

  <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 16px 0;">
    <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
      ${isGerman ? "Restaurant" : "Restaurant"}
    </p>
    <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600;">
      ${restaurant.name}
    </p>

    <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
      ${isGerman ? "Datum" : "Date"}
    </p>
    <p style="margin: 0 0 16px; font-size: 16px;">
      ${dateFormatted}
    </p>

    <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
      ${isGerman ? "Uhrzeit" : "Time"}
    </p>
    <p style="margin: 0 0 16px; font-size: 16px;">
      ${timeFormatted} ${isGerman ? "Uhr" : ""}
    </p>

    <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
      ${isGerman ? "Personen" : "Party size"}
    </p>
    <p style="margin: 0 0 16px; font-size: 16px;">
      ${booking.partySize} ${isGerman ? "Personen" : "guests"}
    </p>

    <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
      ${isGerman ? "Dauer" : "Duration"}
    </p>
    <p style="margin: 0 0 16px; font-size: 16px;">
      2 ${isGerman ? "Stunden" : "hours"}
    </p>

    <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
      ${isGerman ? "Buchungsreferenz" : "Booking Reference"}
    </p>
    <p style="margin: 0; font-size: 16px; font-family: monospace;">
      ${booking.id}
    </p>
  </div>

  <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">
    ${isGerman
      ? "Um zu stornieren, antworten Sie auf diese E-Mail oder rufen Sie das Restaurant an."
      : "To cancel, reply to this email or call the restaurant."}
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

  <p style="font-size: 12px; color: #9ca3af; margin: 0;">
    ${gdprNote}
  </p>
</body>
</html>`.trim();

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: booking.customerEmail,
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    // Don't throw — email failure should not block the booking
    return null;
  }
}

/**
 * Sends a booking cancellation email to the customer.
 *
 * @param {object} params
 * @param {object} params.booking - Booking with decrypted PII
 * @param {object} params.restaurant - Restaurant record
 */
export async function sendBookingCancellation({ booking, restaurant }) {
  const locale = restaurant.locale || "de";
  const isGerman = locale === "de";
  const dateLocale = isGerman ? de : enUS;

  const dateFormatted = format(new Date(booking.startTime), "EEEE, d MMMM yyyy", {
    locale: dateLocale,
  });
  const timeFormatted = format(new Date(booking.startTime), "HH:mm", {
    locale: dateLocale,
  });

  const subject = isGerman
    ? `Ihre Reservierung bei ${restaurant.name} wurde storniert`
    : `Your booking at ${restaurant.name} has been cancelled`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 24px 0;">
    <div style="font-size: 48px;">✕</div>
    <h1 style="font-size: 24px; margin: 8px 0;">
      ${isGerman ? "Reservierung storniert" : "Booking Cancelled"}
    </h1>
  </div>

  <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin: 16px 0;">
    <p style="margin: 0 0 8px; font-size: 16px;">
      ${isGerman
        ? `Ihre Reservierung bei <strong>${restaurant.name}</strong> wurde storniert.`
        : `Your booking at <strong>${restaurant.name}</strong> has been cancelled.`}
    </p>
    <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
      ${dateFormatted} — ${timeFormatted} ${isGerman ? "Uhr" : ""}
    </p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      ${booking.partySize} ${isGerman ? "Personen" : "guests"}
    </p>
  </div>

  <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">
    ${isGerman
      ? "Bei Fragen wenden Sie sich bitte direkt an das Restaurant."
      : "If you have any questions, please contact the restaurant directly."}
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

  <p style="font-size: 12px; color: #9ca3af; margin: 0;">
    ${isGerman
      ? "Ihre Daten werden 30 Tage nach dem ursprünglichen Reservierungsdatum automatisch gelöscht."
      : "Your data will be automatically deleted 30 days after the original booking date."}
  </p>
</body>
</html>`.trim();

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: booking.customerEmail,
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    return null;
  }
}
