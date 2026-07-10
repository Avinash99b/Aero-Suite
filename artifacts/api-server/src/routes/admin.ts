import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRevenueAnalyticsResponse,
  GetOccupancyAnalyticsResponse,
  GetTopCustomersResponse,
  GetTopFlightsResponse,
  GetAirlineComparisonResponse,
  GetActivityFeedResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.use(requireAuth, requireAdmin);

router.get("/admin/dashboard/summary", async (_req, res): Promise<void> => {
  const [row] = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM customers) AS total_customers,
      (SELECT count(*) FROM flights) AS total_flights,
      (SELECT count(*) FROM bookings) AS total_bookings,
      (SELECT coalesce(sum(price), 0) FROM bookings WHERE status = 'confirmed') AS total_revenue,
      (SELECT count(*) FROM flights WHERE departure_time > now() AND status not in ('cancelled')) AS upcoming_flights,
      (SELECT count(*) FROM flights WHERE status = 'delayed') AS delayed_flights,
      (SELECT count(*) FROM flights WHERE status = 'cancelled') AS cancelled_flights,
      (SELECT count(*) FROM bookings WHERE status = 'confirmed') AS confirmed_bookings
  `).then((r) => r.rows as Record<string, string>[]);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalCustomers: Number(row.total_customers),
      totalFlights: Number(row.total_flights),
      totalBookings: Number(row.total_bookings),
      totalRevenue: Number(row.total_revenue),
      upcomingFlights: Number(row.upcoming_flights),
      delayedFlights: Number(row.delayed_flights),
      cancelledFlights: Number(row.cancelled_flights),
      confirmedBookings: Number(row.confirmed_bookings),
    }),
  );
});

router.get("/admin/analytics/revenue", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT to_char(booking_date, 'YYYY-MM') AS period,
           sum(price) AS revenue,
           count(*) AS bookings
    FROM bookings
    WHERE status = 'confirmed'
    GROUP BY period
    ORDER BY period
  `);
  const rows = (result.rows as Record<string, string>[]).map((r) => ({
    period: r.period,
    revenue: Number(r.revenue),
    bookings: Number(r.bookings),
  }));
  res.json(GetRevenueAnalyticsResponse.parse(rows));
});

router.get("/admin/analytics/occupancy", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT f.id AS flight_id, f.departure, f.arrival, f.total_seats,
           count(b.id) FILTER (WHERE b.status = 'confirmed') AS booked_seats
    FROM flights f
    LEFT JOIN bookings b ON b.flight_id = f.id
    GROUP BY f.id, f.departure, f.arrival, f.total_seats
    ORDER BY f.id
    LIMIT 30
  `);
  const rows = (result.rows as Record<string, string>[]).map((r) => ({
    flightId: Number(r.flight_id),
    departure: r.departure,
    arrival: r.arrival,
    totalSeats: Number(r.total_seats),
    bookedSeats: Number(r.booked_seats),
    occupancyRate: Number(r.total_seats) > 0 ? Number(r.booked_seats) / Number(r.total_seats) : 0,
  }));
  res.json(GetOccupancyAnalyticsResponse.parse(rows));
});

router.get("/admin/analytics/top-customers", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT c.id AS customer_id, c.name AS customer_name,
           count(b.id) AS total_bookings, coalesce(sum(b.price), 0) AS total_spent
    FROM customers c
    JOIN bookings b ON b.customer_id = c.id AND b.status = 'confirmed'
    GROUP BY c.id, c.name
    ORDER BY total_spent DESC
    LIMIT 10
  `);
  const rows = (result.rows as Record<string, string>[]).map((r) => ({
    customerId: Number(r.customer_id),
    customerName: r.customer_name,
    totalBookings: Number(r.total_bookings),
    totalSpent: Number(r.total_spent),
  }));
  res.json(GetTopCustomersResponse.parse(rows));
});

router.get("/admin/analytics/top-flights", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT f.id AS flight_id, f.departure, f.arrival, count(b.id) AS total_bookings
    FROM flights f
    JOIN bookings b ON b.flight_id = f.id AND b.status = 'confirmed'
    GROUP BY f.id, f.departure, f.arrival
    ORDER BY total_bookings DESC
    LIMIT 10
  `);
  const rows = (result.rows as Record<string, string>[]).map((r) => ({
    flightId: Number(r.flight_id),
    departure: r.departure,
    arrival: r.arrival,
    totalBookings: Number(r.total_bookings),
  }));
  res.json(GetTopFlightsResponse.parse(rows));
});

router.get("/admin/analytics/airlines", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT a.id AS airline_id, a.name AS airline_name,
           count(DISTINCT f.id) AS total_flights,
           count(b.id) FILTER (WHERE b.status = 'confirmed') AS total_bookings,
           coalesce(sum(b.price) FILTER (WHERE b.status = 'confirmed'), 0) AS total_revenue,
           coalesce(
             count(*) FILTER (WHERE f.status not in ('delayed', 'cancelled'))::float /
             greatest(count(f.id), 1), 1
           ) AS on_time_rate
    FROM airlines a
    LEFT JOIN flights f ON f.airline_id = a.id
    LEFT JOIN bookings b ON b.flight_id = f.id
    GROUP BY a.id, a.name
    ORDER BY total_revenue DESC
  `);
  const rows = (result.rows as Record<string, string>[]).map((r) => ({
    airlineId: Number(r.airline_id),
    airlineName: r.airline_name,
    totalFlights: Number(r.total_flights),
    totalBookings: Number(r.total_bookings),
    totalRevenue: Number(r.total_revenue),
    onTimeRate: Number(r.on_time_rate),
  }));
  res.json(GetAirlineComparisonResponse.parse(rows));
});

router.get("/admin/activity", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT id, 'booking' AS type,
           format('%s booked seat %s (%s)', passenger_name, seat_number, booking_reference) AS message,
           created_at
    FROM bookings
    ORDER BY created_at DESC
    LIMIT 20
  `);
  const rows = (result.rows as Record<string, string>[]).map((r) => ({
    id: Number(r.id),
    type: r.type,
    message: r.message,
    createdAt: new Date(r.created_at).toISOString(),
  }));
  res.json(GetActivityFeedResponse.parse(rows));
});

export default router;
