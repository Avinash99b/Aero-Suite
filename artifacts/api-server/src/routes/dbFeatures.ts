import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, triggerLogsTable, procedureExecutionsTable } from "@workspace/db";
import {
  ListTriggerLogsResponse,
  ListProceduresResponse,
  ExecuteProcedureParams,
  ExecuteProcedureBody,
  ExecuteProcedureResponse,
  ListProcedureExecutionsResponse,
  GetDailyFlightScheduleViewResponse,
  GetConfirmedBookingsViewResponse,
  GetOccupancySummaryViewResponse,
  ListQueryDefinitionsResponse,
  ExecuteQueryParams,
  ExecuteQueryResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";
import { PROCEDURE_DEFINITIONS, executeAddNewBooking, executeGetBookingHistory, executeCancelBooking } from "../lib/procedures";
import { QUERY_DEFINITIONS, runQueryDefinition } from "../lib/queryDefinitions";

const router: IRouter = Router();

router.use(requireAuth, requireAdmin);

router.get("/db/triggers/logs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(triggerLogsTable).orderBy(desc(triggerLogsTable.createdAt)).limit(100);
  res.json(ListTriggerLogsResponse.parse(rows));
});

router.get("/db/procedures", async (_req, res): Promise<void> => {
  res.json(ListProceduresResponse.parse(PROCEDURE_DEFINITIONS));
});

router.post("/db/procedures/:name/execute", async (req, res): Promise<void> => {
  const params = ExecuteProcedureParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ExecuteProcedureBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { name } = params.data;
  let row;
  if (name === "add_new_booking") {
    const { customerId, flightId, seatNumber, cabinClass, status } = body.data;
    if (!customerId || !flightId || !seatNumber) {
      res.status(400).json({ error: "customerId, flightId, seatNumber are required" });
      return;
    }
    row = await executeAddNewBooking({
      customerId,
      flightId,
      seatNumber,
      cabinClass: cabinClass ?? "economy",
      passengerName: "Manual Execution",
      passengerEmail: "manual@skyreserve.app",
      passengerPhone: "0000000000",
    });
    void status;
  } else if (name === "get_booking_history") {
    if (!body.data.customerId) {
      res.status(400).json({ error: "customerId is required" });
      return;
    }
    row = await executeGetBookingHistory({ customerId: body.data.customerId });
  } else if (name === "cancel_booking") {
    if (!body.data.bookingId) {
      res.status(400).json({ error: "bookingId is required" });
      return;
    }
    row = await executeCancelBooking({ bookingId: body.data.bookingId });
  } else {
    res.status(404).json({ error: "Unknown procedure" });
    return;
  }

  res.json(ExecuteProcedureResponse.parse(row));
});

router.get("/db/procedures/executions", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(procedureExecutionsTable)
    .orderBy(desc(procedureExecutionsTable.createdAt))
    .limit(50);
  res.json(ListProcedureExecutionsResponse.parse(rows));
});

router.get("/db/views/daily-schedule", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`SELECT * FROM daily_flight_schedule`);
  const rows = (result.rows as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    airlineId: 0,
    airlineName: r.airline_name,
    flightNumber: r.flight_number,
    departure: r.departure,
    arrival: r.arrival,
    departureTime: new Date(r.departure_time as string).toISOString(),
    arrivalTime: new Date(r.arrival_time as string).toISOString(),
    status: r.status,
    aircraft: r.aircraft,
    totalSeats: 0,
    availableSeats: 0,
    basePrice: 0,
    durationMinutes: 0,
  }));
  res.json(GetDailyFlightScheduleViewResponse.parse(rows));
});

router.get("/db/views/confirmed-bookings", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`SELECT * FROM confirmed_bookings_by_customer LIMIT 200`);
  const rows = (result.rows as Record<string, unknown>[]).map((r) => ({
    customerId: Number(r.customer_id),
    customerName: r.customer_name,
    email: r.email,
    bookingId: Number(r.booking_id),
    departure: r.departure,
    arrival: r.arrival,
    seatNumber: r.seat_number,
    bookingDate: new Date(r.booking_date as string).toISOString(),
  }));
  res.json(GetConfirmedBookingsViewResponse.parse(rows));
});

router.get("/db/views/occupancy-summary", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`SELECT * FROM flight_occupancy_summary`);
  const rows = (result.rows as Record<string, unknown>[]).map((r) => ({
    flightId: Number(r.flight_id),
    airlineName: r.airline_name,
    departure: r.departure,
    arrival: r.arrival,
    confirmedBookings: Number(r.confirmed_bookings),
  }));
  res.json(GetOccupancySummaryViewResponse.parse(rows));
});

router.get("/db/queries", async (_req, res): Promise<void> => {
  res.json(ListQueryDefinitionsResponse.parse(QUERY_DEFINITIONS));
});

router.post("/db/queries/:id/execute", async (req, res): Promise<void> => {
  const params = ExecuteQueryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await runQueryDefinition(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Query not found" });
    return;
  }
  res.json(
    ExecuteQueryResponse.parse({
      id: params.data.id,
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rows.length,
      executedAt: new Date().toISOString(),
    }),
  );
});

export default router;
