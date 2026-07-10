import {
  db,
  pool,
  airlinesTable,
  flightsTable,
  seatsTable,
  customersTable,
  bookingsTable,
  savedPassengersTable,
  paymentMethodsTable,
  wishlistTable,
  notificationsTable,
} from "@workspace/db";
import { logger } from "../lib/logger";

const CABIN_LAYOUT: { cabinClass: string; rows: number; letters: string[] }[] = [
  { cabinClass: "business", rows: 4, letters: ["A", "C", "D", "F"] },
  { cabinClass: "economy", rows: 20, letters: ["A", "B", "C", "D", "E", "F"] },
];

async function generateSeats(flightId: number, totalSeats: number) {
  const seats: { flightId: number; seatNumber: string; cabinClass: string }[] = [];
  let remaining = totalSeats;
  let rowStart = 1;
  for (const cabin of CABIN_LAYOUT) {
    for (let r = 0; r < cabin.rows && remaining > 0; r++) {
      const row = rowStart + r;
      for (const letter of cabin.letters) {
        if (remaining <= 0) break;
        seats.push({ flightId, seatNumber: `${row}${letter}`, cabinClass: cabin.cabinClass });
        remaining--;
      }
    }
    rowStart += cabin.rows;
  }
  if (seats.length > 0) await db.insert(seatsTable).values(seats);
}

async function main() {
  const existing = await db.select({ id: flightsTable.id }).from(flightsTable).limit(1);
  if (existing.length > 0) {
    logger.info("Seed data already present, skipping");
    return;
  }

  logger.info("Seeding airlines...");
  const airlines = await db
    .insert(airlinesTable)
    .values([
      { name: "Meridian Airways", country: "United Arab Emirates" },
      { name: "Aurora Skyline", country: "United States" },
      { name: "Zephyr Global", country: "Singapore" },
      { name: "Nordwing Airlines", country: "Norway" },
      { name: "Solstice Air", country: "Japan" },
    ])
    .returning();

  const routes = [
    ["Dubai (DXB)", "London (LHR)"],
    ["New York (JFK)", "Paris (CDG)"],
    ["Singapore (SIN)", "Tokyo (HND)"],
    ["Oslo (OSL)", "Reykjavik (KEF)"],
    ["Tokyo (HND)", "Sydney (SYD)"],
    ["Dubai (DXB)", "New York (JFK)"],
    ["London (LHR)", "Singapore (SIN)"],
    ["Paris (CDG)", "Dubai (DXB)"],
    ["San Francisco (SFO)", "Tokyo (HND)"],
    ["New York (JFK)", "Dubai (DXB)"],
    ["Singapore (SIN)", "London (LHR)"],
    ["Sydney (SYD)", "Singapore (SIN)"],
  ];

  const aircraft = ["Airbus A380", "Boeing 787-9", "Airbus A350-900", "Boeing 777-300ER", "Airbus A320neo"];
  const statuses = ["scheduled", "scheduled", "scheduled", "boarding", "delayed", "cancelled", "arrived"];

  logger.info("Seeding flights + seats...");
  const flights = [];
  const now = new Date("2026-07-10T00:00:00Z");
  for (let i = 0; i < 40; i++) {
    const airline = airlines[i % airlines.length];
    const [from, to] = routes[i % routes.length];
    const dayOffset = Math.floor(i / 3) - 5;
    const departureTime = new Date(now.getTime() + dayOffset * 86400000 + (i % 24) * 3600000);
    const durationHours = 3 + (i % 12);
    const arrivalTime = new Date(departureTime.getTime() + durationHours * 3600000);
    const totalSeats = 24 + (i % 4) * 20;
    const status = dayOffset < 0 ? (i % 5 === 0 ? "cancelled" : "arrived") : statuses[i % statuses.length];

    const [flight] = await db
      .insert(flightsTable)
      .values({
        airlineId: airline.id,
        flightNumber: `${airline.name.slice(0, 2).toUpperCase()}${100 + i}`,
        departure: from,
        arrival: to,
        departureTime,
        arrivalTime,
        status,
        aircraft: aircraft[i % aircraft.length],
        totalSeats,
        basePrice: String(180 + (i % 10) * 65),
      })
      .returning();
    flights.push(flight);
    await generateSeats(flight.id, totalSeats);
  }

  logger.info("Seeding customers...");
  const customerNames = [
    ["Amara Okafor", "amara.okafor@example.com"],
    ["Liam Chen", "liam.chen@example.com"],
    ["Sofia Bianchi", "sofia.bianchi@example.com"],
    ["Noah Kim", "noah.kim@example.com"],
    ["Elena Petrova", "elena.petrova@example.com"],
    ["Rahul Mehta", "rahul.mehta@example.com"],
    ["Ingrid Larsen", "ingrid.larsen@example.com"],
    ["Yusuf Demir", "yusuf.demir@example.com"],
  ];
  const customers = [];
  for (const [name, email] of customerNames) {
    const [c] = await db
      .insert(customersTable)
      .values({
        clerkUserId: `seed_${email}`,
        name,
        email,
        phone: "+1-555-0100",
        role: "customer",
      })
      .returning();
    customers.push(c);
  }

  logger.info("Seeding bookings, passengers, payment methods, wishlist, notifications...");
  const { eq, and } = await import("drizzle-orm");

  for (const customer of customers) {
    const bookingsForCustomer = 3 + (customer.id % 6);
    const usedFlights = new Set<number>();

    for (let j = 0; j < bookingsForCustomer; j++) {
      const flight = flights[(customer.id * 7 + j * 11) % flights.length];
      if (usedFlights.has(flight.id)) continue;
      usedFlights.add(flight.id);

      const availableSeats = await db
        .select()
        .from(seatsTable)
        .where(and(eq(seatsTable.flightId, flight.id), eq(seatsTable.status, "available")));
      if (availableSeats.length === 0) continue;

      const seat = availableSeats[j % availableSeats.length];
      const status = j === 0 && flight.status === "cancelled" ? "cancelled" : j % 5 === 0 ? "cancelled" : "confirmed";
      const ref = `SR${(250000 + customer.id * 97 + j * 13).toString().padStart(6, "0")}`;

      await db.insert(bookingsTable).values({
        customerId: customer.id,
        flightId: flight.id,
        seatNumber: seat.seatNumber,
        cabinClass: seat.cabinClass,
        status,
        price: flight.basePrice,
        bookingReference: ref,
        passengerName: customer.name,
        passengerEmail: customer.email,
        passengerPhone: customer.phone,
      });

      await db
        .update(seatsTable)
        .set({ status: status === "confirmed" ? "booked" : "available" })
        .where(eq(seatsTable.id, seat.id));

      await db.insert(notificationsTable).values({
        customerId: customer.id,
        title: status === "cancelled" ? "Booking cancelled" : "Booking confirmed",
        message: `Your booking ${ref} for ${flight.departure} to ${flight.arrival} is ${status}.`,
        isRead: j % 2 === 0,
      });
    }

    await db.insert(savedPassengersTable).values({
      customerId: customer.id,
      fullName: customer.name,
      email: customer.email,
      phone: customer.phone,
      passportNumber: `P${(10000000 + customer.id).toString()}`,
      dateOfBirth: "1990-01-01",
    });

    await db.insert(paymentMethodsTable).values({
      customerId: customer.id,
      cardBrand: customer.id % 2 === 0 ? "Visa" : "Mastercard",
      last4: (1000 + customer.id * 111).toString().slice(-4),
      expiryMonth: 8,
      expiryYear: 2029,
      cardholderName: customer.name,
    });

    const wishlistFlight = flights[(customer.id * 13) % flights.length];
    await db.insert(wishlistTable).values({ customerId: customer.id, flightId: wishlistFlight.id });
  }

  // Promote the first seeded customer to admin so there's always a way in.
  await db.update(customersTable).set({ role: "admin" }).where(eq(customersTable.id, customers[0].id));
  logger.info({ adminEmail: customers[0].email }, "Promoted seed customer to admin");

  logger.info("Done seeding.");
}

main()
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
