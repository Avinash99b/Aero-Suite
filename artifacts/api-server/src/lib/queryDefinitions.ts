import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

export interface QueryDefinition {
  id: string;
  label: string;
  description: string;
  category: string;
  sql: string;
}

export const QUERY_DEFINITIONS: QueryDefinition[] = [
  {
    id: "flights-most-bookings",
    label: "Flights with the most bookings",
    description:
      "Nested aggregate query ranking every flight by its total confirmed booking count.",
    category: "Aggregate",
    sql: `SELECT f.id, f.flight_number, f.departure, f.arrival,
       (SELECT COUNT(*) FROM bookings b WHERE b.flight_id = f.id AND b.status = 'confirmed') AS total_bookings
FROM flights f
ORDER BY total_bookings DESC
LIMIT 10;`,
  },
  {
    id: "customers-over-5-bookings",
    label: "Customers with more than 5 bookings",
    description:
      "Groups bookings by customer and filters with HAVING to find frequent flyers.",
    category: "Aggregate",
    sql: `SELECT c.id, c.name, c.email, COUNT(b.id) AS total_bookings
FROM customers c
JOIN bookings b ON b.customer_id = c.id
GROUP BY c.id, c.name, c.email
HAVING COUNT(b.id) > 5
ORDER BY total_bookings DESC;`,
  },
  {
    id: "flights-cancelled-last-7-days",
    label: "Flights cancelled in the last 7 days",
    description: "Filters flights by status and a rolling 7-day window on creation time.",
    category: "Filter",
    sql: `SELECT f.id, f.flight_number, f.departure, f.arrival, f.departure_time, f.status
FROM flights f
WHERE f.status = 'cancelled'
  AND f.departure_time >= now() - interval '7 days'
ORDER BY f.departure_time DESC;`,
  },
  {
    id: "booking-details-join",
    label: "Booking details (customer + flight + airline join)",
    description:
      "Four-way join reconstructing a full booking receipt from normalized tables.",
    category: "Join",
    sql: `SELECT b.id AS booking_id, b.booking_reference, c.name AS customer_name, c.email,
       al.name AS airline_name, f.flight_number, f.departure, f.arrival,
       f.departure_time, b.seat_number, b.cabin_class, b.status, b.price
FROM bookings b
JOIN customers c ON c.id = b.customer_id
JOIN flights f ON f.id = b.flight_id
JOIN airlines al ON al.id = f.airline_id
ORDER BY b.booking_date DESC
LIMIT 25;`,
  },
  {
    id: "upcoming-flights-by-airline",
    label: "Upcoming flights grouped by airline",
    description: "Nested subquery counting future flights per airline.",
    category: "Nested",
    sql: `SELECT a.id, a.name, a.country,
       (SELECT COUNT(*) FROM flights f WHERE f.airline_id = a.id AND f.departure_time > now()) AS upcoming_flights
FROM airlines a
ORDER BY upcoming_flights DESC;`,
  },
  {
    id: "flights-booked-by-customer-email",
    label: "Flights booked by a specific customer email",
    description:
      "Correlated join filtering bookings down to a single customer identified by email.",
    category: "Join",
    sql: `SELECT c.email, f.flight_number, f.departure, f.arrival, f.departure_time, b.seat_number, b.status
FROM bookings b
JOIN customers c ON c.id = b.customer_id
JOIN flights f ON f.id = b.flight_id
WHERE c.email = (SELECT email FROM customers ORDER BY id LIMIT 1)
ORDER BY f.departure_time;`,
  },
];

export async function runQueryDefinition(id: string) {
  const def = QUERY_DEFINITIONS.find((q) => q.id === id);
  if (!def) return null;

  const result = await db.execute(sql.raw(def.sql.replace(/;\s*$/, "")));
  const rows = result.rows as Record<string, unknown>[];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return { rows, columns };
}
