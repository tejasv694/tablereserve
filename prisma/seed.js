import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "mario-ristorante" },
    update: {},
    create: {
      name: "Mario's Ristorante",
      slug: "mario-ristorante",
      email: "mario@example.com",
      phone: "+49 123 456 7890",
      address: "Hauptstraße 1, 10115 Berlin",
      timezone: "Europe/Berlin",
      locale: "de",
      currency: "EUR",
      slotDurationMinutes: 120,
      bufferMinutes: 25,
      slotIntervalMinutes: 30,
      maxPartySize: 12,
      advanceBookingDays: 60,
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

  console.log(`  Restaurant: ${restaurant.name} (${restaurant.id})`);

  // 2. Create tables
  const tableConfigs = [
    { label: "Table 1", capacity: 2, minCapacity: 1, section: "Indoor" },
    { label: "Table 2", capacity: 4, minCapacity: 2, section: "Indoor" },
    { label: "Table 3", capacity: 4, minCapacity: 2, section: "Indoor" },
    { label: "Table 4", capacity: 6, minCapacity: 3, section: "Indoor" },
    { label: "Terrace 1", capacity: 4, minCapacity: 2, section: "Terrace" },
    { label: "Terrace 2", capacity: 6, minCapacity: 2, section: "Terrace" },
  ];

  for (const t of tableConfigs) {
    const existing = await prisma.table.findFirst({
      where: { restaurantId: restaurant.id, label: t.label },
    });
    if (!existing) {
      await prisma.table.create({
        data: { ...t, restaurantId: restaurant.id },
      });
      console.log(`  Table: ${t.label}`);
    } else {
      console.log(`  Table: ${t.label} (already exists)`);
    }
  }

  // 3. Create staff user
  const staffEmail = "admin@mario.com";
  const staffPassword = "password123";
  const passwordHash = await bcrypt.hash(staffPassword, 12);

  await prisma.staffMember.upsert({
    where: { email: staffEmail },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: "Mario Admin",
      email: staffEmail,
      passwordHash,
      role: "OWNER",
      department: "MANAGER",
      contractType: "FULL_TIME",
      monthlyHoursTarget: 150,
      phone: "+49 170 111 0001",
      availabilityToken: "token_mario_admin",
    },
  });

  console.log(`  Staff user: ${staffEmail} / ${staffPassword}`);

  // 4. Create additional staff members for shift planning
  const staffList = [
    { name: "Luca Bianchi",    email: "luca@mario.com",    department: "KITCHEN",  role: "STAFF", contractType: "FULL_TIME",  hours: 150, phone: "+49 170 111 0002" },
    { name: "Sofia Rossi",     email: "sofia@mario.com",   department: "KITCHEN",  role: "STAFF", contractType: "PART_TIME",  hours: 80,  phone: "+49 170 111 0003" },
    { name: "Marco Verdi",     email: "marco@mario.com",   department: "KITCHEN",  role: "STAFF", contractType: "PART_TIME",  hours: 80,  phone: "+49 170 111 0004" },
    { name: "Giulia Conti",    email: "giulia@mario.com",  department: "FRONT",    role: "STAFF", contractType: "FULL_TIME",  hours: 150, phone: "+49 170 111 0005" },
    { name: "Alessandro Neri", email: "ale@mario.com",     department: "FRONT",    role: "STAFF", contractType: "FULL_TIME",  hours: 150, phone: "+49 170 111 0006" },
    { name: "Francesca Galli", email: "fran@mario.com",    department: "FRONT",    role: "STAFF", contractType: "PART_TIME",  hours: 80,  phone: "+49 170 111 0007" },
    { name: "Elena Marino",    email: "elena@mario.com",   department: "FRONT",    role: "STAFF", contractType: "PART_TIME",  hours: 80,  phone: "+49 170 111 0008" },
    { name: "Davide Costa",    email: "davide@mario.com",  department: "DELIVERY", role: "STAFF", contractType: "PART_TIME",  hours: 80,  phone: "+49 170 111 0009" },
    { name: "Paolo Rizzo",     email: "paolo@mario.com",   department: "DELIVERY", role: "STAFF", contractType: "MINI_JOB",   hours: 40,  phone: "+49 170 111 0010" },
    { name: "Anna Ferrari",    email: "anna@mario.com",    department: "MANAGER",  role: "MANAGER", contractType: "FULL_TIME", hours: 150, phone: "+49 170 111 0011" },
    { name: "Roberto Colombo", email: "roberto@mario.com", department: "FRONT",    role: "STAFF", contractType: "MINI_JOB",   hours: 40,  phone: "+49 170 111 0012" },
  ];

  const staffMembers = [];
  for (const s of staffList) {
    const hash = await bcrypt.hash("staff123", 12);
    const token = `token_${s.email.split("@")[0]}`;
    const member = await prisma.staffMember.upsert({
      where: { email: s.email },
      update: {},
      create: {
        restaurantId: restaurant.id,
        name: s.name,
        email: s.email,
        passwordHash: hash,
        role: s.role,
        department: s.department,
        contractType: s.contractType,
        monthlyHoursTarget: s.hours,
        phone: s.phone,
        availabilityToken: token,
      },
    });
    staffMembers.push(member);
    console.log(`  Staff: ${s.name} (${s.department})`);
  }

  // 5. Create Shift Config
  await prisma.shiftConfig.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      minStaffPerRole: { KITCHEN: 3, FRONT: 4, DELIVERY: 2, MANAGER: 1 },
      minTotalStaff: 10,
      shiftMode: "CONSTANT",
      shiftSlots: [
        { name: "Morning", start: "10:00", end: "16:00" },
        { name: "Evening", start: "16:00", end: "23:00" },
      ],
      availabilityDeadlineDay: "WEDNESDAY",
      planReleaseDay: "THURSDAY",
      planReleaseTime: "00:05",
    },
  });
  console.log("  Shift config created");

  // 6. Create mock availability for next week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  // Each staff member has slightly different availability (realistic mock)
  const availabilityMock = [
    { email: "luca@mario.com",    days: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"], pref: "Morning" },
    { email: "sofia@mario.com",   days: ["MONDAY","WEDNESDAY","FRIDAY","SATURDAY","SUNDAY"],              pref: "Evening" },
    { email: "marco@mario.com",   days: ["TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"],          pref: "Morning" },
    { email: "giulia@mario.com",  days: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"], pref: "Any" },
    { email: "ale@mario.com",     days: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"], pref: "Evening" },
    { email: "fran@mario.com",    days: ["MONDAY","TUESDAY","THURSDAY","FRIDAY","SATURDAY"],             pref: "Morning" },
    { email: "elena@mario.com",   days: ["WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"],           pref: "Evening" },
    { email: "davide@mario.com",  days: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"],            pref: "Any" },
    { email: "paolo@mario.com",   days: ["FRIDAY","SATURDAY","SUNDAY"],                                   pref: "Evening" },
    { email: "anna@mario.com",    days: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"], pref: "Any" },
    { email: "roberto@mario.com", days: ["THURSDAY","FRIDAY","SATURDAY","SUNDAY"],                       pref: "Evening" },
  ];

  // Simulate staggered submission times (first-come-first-serve)
  let submitOffset = 0;
  for (const av of availabilityMock) {
    const member = staffMembers.find((s) => s.email === av.email);
    if (!member) continue;

    const submittedAt = new Date(now);
    submittedAt.setHours(submittedAt.getHours() - (availabilityMock.length - submitOffset));

    await prisma.staffAvailability.upsert({
      where: {
        staffMemberId_weekStartDate: {
          staffMemberId: member.id,
          weekStartDate: nextMonday,
        },
      },
      update: { availableDays: av.days, preferredShift: av.pref, submittedAt },
      create: {
        staffMemberId: member.id,
        weekStartDate: nextMonday,
        availableDays: av.days,
        preferredShift: av.pref,
        submittedAt,
      },
    });
    submitOffset++;
    console.log(`  Availability: ${av.email} → ${av.days.length} days`);
  }

  // 7. Generate a mock shift plan for next week
  // Delete existing plan for this week first
  const existingPlan = await prisma.shiftPlan.findUnique({
    where: {
      restaurantId_weekStartDate: {
        restaurantId: restaurant.id,
        weekStartDate: nextMonday,
      },
    },
  });
  if (existingPlan) {
    await prisma.shiftAssignment.deleteMany({ where: { shiftPlanId: existingPlan.id } });
    await prisma.shiftPlan.delete({ where: { id: existingPlan.id } });
  }

  const shiftPlan = await prisma.shiftPlan.create({
    data: {
      restaurantId: restaurant.id,
      weekStartDate: nextMonday,
      status: "RELEASED",
      releasedAt: new Date(),
    },
  });

  // Build assignments — realistic schedule
  const schedule = [
    // MONDAY
    { day: 0, shift: "Morning", start: "10:00", end: "16:00", email: "luca@mario.com",   role: "KITCHEN" },
    { day: 0, shift: "Morning", start: "10:00", end: "16:00", email: "sofia@mario.com",  role: "KITCHEN" },
    { day: 0, shift: "Evening", start: "16:00", end: "23:00", email: "marco@mario.com",  role: "KITCHEN" },
    { day: 0, shift: "Morning", start: "10:00", end: "16:00", email: "giulia@mario.com", role: "FRONT" },
    { day: 0, shift: "Morning", start: "10:00", end: "16:00", email: "fran@mario.com",   role: "FRONT" },
    { day: 0, shift: "Evening", start: "16:00", end: "23:00", email: "ale@mario.com",    role: "FRONT" },
    { day: 0, shift: "Evening", start: "16:00", end: "23:00", email: "elena@mario.com",  role: "FRONT" },
    { day: 0, shift: "Morning", start: "10:00", end: "16:00", email: "davide@mario.com", role: "DELIVERY" },
    { day: 0, shift: "Evening", start: "16:00", end: "23:00", email: "paolo@mario.com",  role: "DELIVERY" },
    { day: 0, shift: "Morning", start: "10:00", end: "16:00", email: "anna@mario.com",   role: "MANAGER" },
    // TUESDAY
    { day: 1, shift: "Morning", start: "10:00", end: "16:00", email: "luca@mario.com",   role: "KITCHEN" },
    { day: 1, shift: "Evening", start: "16:00", end: "23:00", email: "marco@mario.com",  role: "KITCHEN" },
    { day: 1, shift: "Evening", start: "16:00", end: "23:00", email: "sofia@mario.com",  role: "KITCHEN" },
    { day: 1, shift: "Morning", start: "10:00", end: "16:00", email: "giulia@mario.com", role: "FRONT" },
    { day: 1, shift: "Morning", start: "10:00", end: "16:00", email: "fran@mario.com",   role: "FRONT" },
    { day: 1, shift: "Evening", start: "16:00", end: "23:00", email: "ale@mario.com",    role: "FRONT" },
    { day: 1, shift: "Evening", start: "16:00", end: "23:00", email: "elena@mario.com",  role: "FRONT" },
    { day: 1, shift: "Morning", start: "10:00", end: "16:00", email: "davide@mario.com", role: "DELIVERY" },
    { day: 1, shift: "Evening", start: "16:00", end: "23:00", email: "paolo@mario.com",  role: "DELIVERY" },
    { day: 1, shift: "Morning", start: "10:00", end: "16:00", email: "anna@mario.com",   role: "MANAGER" },
    // WEDNESDAY
    { day: 2, shift: "Morning", start: "10:00", end: "16:00", email: "luca@mario.com",   role: "KITCHEN" },
    { day: 2, shift: "Morning", start: "10:00", end: "16:00", email: "sofia@mario.com",  role: "KITCHEN" },
    { day: 2, shift: "Evening", start: "16:00", end: "23:00", email: "marco@mario.com",  role: "KITCHEN" },
    { day: 2, shift: "Morning", start: "10:00", end: "16:00", email: "giulia@mario.com", role: "FRONT" },
    { day: 2, shift: "Evening", start: "16:00", end: "23:00", email: "ale@mario.com",    role: "FRONT" },
    { day: 2, shift: "Evening", start: "16:00", end: "23:00", email: "elena@mario.com",  role: "FRONT" },
    { day: 2, shift: "Evening", start: "16:00", end: "23:00", email: "roberto@mario.com",role: "FRONT" },
    { day: 2, shift: "Morning", start: "10:00", end: "16:00", email: "davide@mario.com", role: "DELIVERY" },
    { day: 2, shift: "Evening", start: "16:00", end: "23:00", email: "paolo@mario.com",  role: "DELIVERY" },
    { day: 2, shift: "Morning", start: "10:00", end: "16:00", email: "anna@mario.com",   role: "MANAGER" },
    // THURSDAY
    { day: 3, shift: "Morning", start: "10:00", end: "16:00", email: "luca@mario.com",   role: "KITCHEN" },
    { day: 3, shift: "Evening", start: "16:00", end: "23:00", email: "marco@mario.com",  role: "KITCHEN" },
    { day: 3, shift: "Evening", start: "16:00", end: "23:00", email: "sofia@mario.com",  role: "KITCHEN" },
    { day: 3, shift: "Morning", start: "10:00", end: "16:00", email: "giulia@mario.com", role: "FRONT" },
    { day: 3, shift: "Morning", start: "10:00", end: "16:00", email: "fran@mario.com",   role: "FRONT" },
    { day: 3, shift: "Evening", start: "16:00", end: "23:00", email: "ale@mario.com",    role: "FRONT" },
    { day: 3, shift: "Evening", start: "16:00", end: "23:00", email: "roberto@mario.com",role: "FRONT" },
    { day: 3, shift: "Morning", start: "10:00", end: "16:00", email: "davide@mario.com", role: "DELIVERY" },
    { day: 3, shift: "Evening", start: "16:00", end: "23:00", email: "paolo@mario.com",  role: "DELIVERY" },
    { day: 3, shift: "Morning", start: "10:00", end: "16:00", email: "anna@mario.com",   role: "MANAGER" },
    // FRIDAY
    { day: 4, shift: "Morning", start: "10:00", end: "16:00", email: "luca@mario.com",   role: "KITCHEN" },
    { day: 4, shift: "Morning", start: "10:00", end: "16:00", email: "sofia@mario.com",  role: "KITCHEN" },
    { day: 4, shift: "Evening", start: "16:00", end: "23:00", email: "marco@mario.com",  role: "KITCHEN" },
    { day: 4, shift: "Morning", start: "10:00", end: "16:00", email: "giulia@mario.com", role: "FRONT" },
    { day: 4, shift: "Morning", start: "10:00", end: "16:00", email: "fran@mario.com",   role: "FRONT" },
    { day: 4, shift: "Evening", start: "16:00", end: "23:00", email: "ale@mario.com",    role: "FRONT" },
    { day: 4, shift: "Evening", start: "16:00", end: "23:00", email: "elena@mario.com",  role: "FRONT" },
    { day: 4, shift: "Morning", start: "10:00", end: "16:00", email: "davide@mario.com", role: "DELIVERY" },
    { day: 4, shift: "Evening", start: "16:00", end: "23:00", email: "paolo@mario.com",  role: "DELIVERY" },
    { day: 4, shift: "Morning", start: "10:00", end: "16:00", email: "anna@mario.com",   role: "MANAGER" },
    // SATURDAY (busiest day)
    { day: 5, shift: "Morning", start: "10:00", end: "16:00", email: "luca@mario.com",   role: "KITCHEN" },
    { day: 5, shift: "Morning", start: "10:00", end: "16:00", email: "sofia@mario.com",  role: "KITCHEN" },
    { day: 5, shift: "Evening", start: "16:00", end: "23:00", email: "marco@mario.com",  role: "KITCHEN" },
    { day: 5, shift: "Morning", start: "10:00", end: "16:00", email: "giulia@mario.com", role: "FRONT" },
    { day: 5, shift: "Morning", start: "10:00", end: "16:00", email: "fran@mario.com",   role: "FRONT" },
    { day: 5, shift: "Evening", start: "16:00", end: "23:00", email: "ale@mario.com",    role: "FRONT" },
    { day: 5, shift: "Evening", start: "16:00", end: "23:00", email: "elena@mario.com",  role: "FRONT" },
    { day: 5, shift: "Evening", start: "16:00", end: "23:00", email: "roberto@mario.com",role: "FRONT" },
    { day: 5, shift: "Morning", start: "10:00", end: "16:00", email: "davide@mario.com", role: "DELIVERY" },
    { day: 5, shift: "Evening", start: "16:00", end: "23:00", email: "paolo@mario.com",  role: "DELIVERY" },
    { day: 5, shift: "Morning", start: "10:00", end: "16:00", email: "anna@mario.com",   role: "MANAGER" },
    // SUNDAY (lighter)
    { day: 6, shift: "Morning", start: "10:00", end: "16:00", email: "sofia@mario.com",  role: "KITCHEN" },
    { day: 6, shift: "Evening", start: "16:00", end: "21:00", email: "marco@mario.com",  role: "KITCHEN" },
    { day: 6, shift: "Morning", start: "10:00", end: "16:00", email: "giulia@mario.com", role: "FRONT" },
    { day: 6, shift: "Evening", start: "16:00", end: "21:00", email: "elena@mario.com",  role: "FRONT" },
    { day: 6, shift: "Evening", start: "16:00", end: "21:00", email: "roberto@mario.com",role: "FRONT" },
    { day: 6, shift: "Morning", start: "10:00", end: "16:00", email: "paolo@mario.com",  role: "DELIVERY" },
    { day: 6, shift: "Morning", start: "10:00", end: "16:00", email: "anna@mario.com",   role: "MANAGER" },
  ];

  for (const entry of schedule) {
    const member = staffMembers.find((s) => s.email === entry.email);
    if (!member) continue;

    const date = new Date(nextMonday);
    date.setDate(date.getDate() + entry.day);

    const [sh, sm] = entry.start.split(":").map(Number);
    const [eh, em] = entry.end.split(":").map(Number);
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;

    await prisma.shiftAssignment.create({
      data: {
        shiftPlanId: shiftPlan.id,
        staffMemberId: member.id,
        date,
        shiftName: entry.shift,
        shiftStart: entry.start,
        shiftEnd: entry.end,
        role: entry.role,
        hours,
        status: "SCHEDULED",
      },
    });
  }

  console.log(`  Shift plan created: ${schedule.length} assignments for next week`);
  console.log(`  Week: ${nextMonday.toISOString().split("T")[0]}`);

  // 8. Also create a shift plan for THIS week (so it shows on the calendar today)
  const thisMonday = new Date(now);
  const todayDow = now.getDay(); // 0=Sun
  const daysBack = todayDow === 0 ? 6 : todayDow - 1;
  thisMonday.setDate(now.getDate() - daysBack);
  thisMonday.setHours(0, 0, 0, 0);

  const existingThisWeek = await prisma.shiftPlan.findUnique({
    where: {
      restaurantId_weekStartDate: {
        restaurantId: restaurant.id,
        weekStartDate: thisMonday,
      },
    },
  });
  if (existingThisWeek) {
    await prisma.shiftAssignment.deleteMany({ where: { shiftPlanId: existingThisWeek.id } });
    await prisma.shiftPlan.delete({ where: { id: existingThisWeek.id } });
  }

  const thisWeekPlan = await prisma.shiftPlan.create({
    data: {
      restaurantId: restaurant.id,
      weekStartDate: thisMonday,
      status: "RELEASED",
      releasedAt: new Date(thisMonday.getTime() - 3 * 24 * 60 * 60 * 1000), // released last Thursday
    },
  });

  // Reuse the same schedule template but with thisMonday as the base date
  for (const entry of schedule) {
    const member = staffMembers.find((s) => s.email === entry.email);
    if (!member) continue;

    const date = new Date(thisMonday);
    date.setDate(date.getDate() + entry.day);

    const [sh, sm] = entry.start.split(":").map(Number);
    const [eh, em] = entry.end.split(":").map(Number);
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;

    await prisma.shiftAssignment.create({
      data: {
        shiftPlanId: thisWeekPlan.id,
        staffMemberId: member.id,
        date,
        shiftName: entry.shift,
        shiftStart: entry.start,
        shiftEnd: entry.end,
        role: entry.role,
        hours,
        status: "SCHEDULED",
      },
    });
  }

  console.log(`  This-week plan created: ${schedule.length} assignments`);
  console.log(`  Week: ${thisMonday.toISOString().split("T")[0]}`);
  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
