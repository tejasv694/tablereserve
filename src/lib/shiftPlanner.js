/**
 * Shift Auto-Planner
 *
 * Generates a weekly shift plan based on:
 * - Staff availability (first-come-first-serve by submittedAt)
 * - Role/department requirements from ShiftConfig
 * - Contract hours (don't exceed monthly target)
 * - Shift mode: CONSTANT (same times, different days) or SHUFFLE (rotate times)
 * - Same-day constraint: One shift per person per day
 * - Consecutive days limit: Max 5 days in a row
 */

import { addDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

/**
 * Calculate hours between two HH:mm strings.
 */
function calcHours(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/**
 * Generate a shift plan for a given week.
 *
 * @param {object} params
 * @param {object} params.config - ShiftConfig record
 * @param {Array}  params.staff - StaffMember records (active only)
 * @param {Array}  params.availabilities - StaffAvailability records for this week, sorted by submittedAt ASC
 * @param {Date}   params.weekStartDate - Monday of the target week
 * @param {Array}  params.existingAssignmentsThisMonth - All ShiftAssignment records for the current month (to track hours)
 * @returns {{ assignments: Array, shortages: Array }}
 */
export function generateShiftPlan({
  config,
  staff,
  availabilities,
  weekStartDate,
  existingAssignmentsThisMonth = [],
}) {
  const minStaffPerRole = typeof config.minStaffPerRole === "string"
    ? JSON.parse(config.minStaffPerRole)
    : config.minStaffPerRole;

  const shiftSlots = typeof config.shiftSlots === "string"
    ? JSON.parse(config.shiftSlots)
    : config.shiftSlots;

  // Build a map of staffId → availability for this week
  const availMap = new Map();
  for (const av of availabilities) {
    availMap.set(av.staffMemberId, {
      days: typeof av.availableDays === "string" ? JSON.parse(av.availableDays) : av.availableDays,
      preferredShift: av.preferredShift || "Any",
      submittedAt: av.submittedAt,
    });
  }

  // Build a map of staffId → hours already assigned this month
  const hoursThisMonth = new Map();
  for (const a of existingAssignmentsThisMonth) {
    const current = hoursThisMonth.get(a.staffMemberId) || 0;
    hoursThisMonth.set(a.staffMemberId, current + a.hours);
  }

  // Build staff lookup
  const staffById = new Map();
  for (const s of staff) {
    staffById.set(s.id, s);
  }

  const assignments = [];
  const shortages = [];

  // Track: staffId → array of dates they've been assigned (for same-day & consecutive checks)
  const assignedDatesByStaff = new Map();

  // For each day of the week
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayName = DAYS[dayIdx];
    const date = addDays(weekStartDate, dayIdx);

    // Track who got assigned TODAY (prevents morning + evening for same person)
    const assignedToday = new Set();

    // For each role/department
    for (const [role, needed] of Object.entries(minStaffPerRole)) {
      let assigned = 0;

      // Get eligible staff for this role, sorted by availability submission time (first-come-first-serve)
      const eligibleStaff = staff
        .filter((s) => {
          // Must match department
          if (s.department !== role) return false;
          // Must be active
          if (!s.isActive) return false;
          // Must have submitted availability for this week
          const av = availMap.get(s.id);
          if (!av) return false;
          // Must be available on this day
          if (!av.days.includes(dayName)) return false;
          // ❌ SKIP: Already assigned a shift today (morning/afternoon/evening)
          if (assignedToday.has(s.id)) return false;
          // ❌ SKIP: Would exceed 5 consecutive days
          const staffAssignedDates = assignedDatesByStaff.get(s.id) || [];
          const consecutiveCount = countConsecutiveDays(staffAssignedDates, date);
          if (consecutiveCount >= 5) return false;
          return true;
        })
        .sort((a, b) => {
          // First-come-first-serve: sort by submittedAt ascending
          const avA = availMap.get(a.id);
          const avB = availMap.get(b.id);
          return new Date(avA.submittedAt) - new Date(avB.submittedAt);
        });

      // Pick a shift slot for this assignment
      for (const person of eligibleStaff) {
        if (assigned >= needed) break;

        // Check if adding this shift would exceed monthly hours
        const currentHours = hoursThisMonth.get(person.id) || 0;

        // Pick the best shift slot
        let bestSlot = null;
        const av = availMap.get(person.id);

        if (config.shiftMode === "CONSTANT") {
          // In constant mode, try to match preferred shift
          bestSlot = shiftSlots.find((s) => {
            if (av.preferredShift && av.preferredShift !== "Any") {
              return s.name.toLowerCase() === av.preferredShift.toLowerCase();
            }
            return true;
          }) || shiftSlots[0];
        } else {
          // SHUFFLE mode: rotate — simple round-robin based on day index
          bestSlot = shiftSlots[dayIdx % shiftSlots.length];
        }

        if (!bestSlot) continue;

        const shiftHours = calcHours(bestSlot.start, bestSlot.end);

        // Check monthly hours limit
        if (currentHours + shiftHours > person.monthlyHoursTarget * 1.1) {
          // Allow 10% overflow tolerance but skip if too much
          continue;
        }

        assignments.push({
          staffMemberId: person.id,
          date,
          shiftName: bestSlot.name,
          shiftStart: bestSlot.start,
          shiftEnd: bestSlot.end,
          role,
          hours: shiftHours,
          status: "SCHEDULED",
          isOverride: false,
        });

        // Update running hours count
        hoursThisMonth.set(person.id, currentHours + shiftHours);
        assigned++;

        // Track for same-day and consecutive days checks
        assignedToday.add(person.id);
        const currentDates = assignedDatesByStaff.get(person.id) || [];
        currentDates.push(date);
        assignedDatesByStaff.set(person.id, currentDates);
      }

      // If we couldn't fill all slots for this role on this day, record shortage
      if (assigned < needed) {
        shortages.push({
          day: dayName,
          date: date.toISOString(),
          role,
          needed,
          assigned,
          deficit: needed - assigned,
        });
      }
    }
  }

  return { assignments, shortages };
}

/**
 * Count how many consecutive days immediately before the target date
 * the staff member has been assigned. Used to enforce max 5 days in a row.
 */
function countConsecutiveDays(assignedDates, targetDate) {
  if (!assignedDates || assignedDates.length === 0) return 0;

  // Sort dates ascending
  const sorted = [...assignedDates].sort((a, b) => a - b);

  let count = 0;
  // Check backwards from target date
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const date = sorted[i];
    const daysDiff = Math.round((targetDate - date) / oneDay);

    if (daysDiff === count + 1) {
      count++;
    } else if (daysDiff > count + 1) {
      // Gap found, stop counting
      break;
    }
  }

  return count;
}
