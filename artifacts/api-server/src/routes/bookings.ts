import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  bookingsTable,
  flightsTable,
  airlinesTable,
  customersTable,
  seatsTable,
} from "@workspace/db";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  CreateBookingResponse,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
  CancelBookingParams,
  CancelBookingResponse,
  GetBookingTicketParams,
  GetBookingTicketResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";
import { serializeBooking, serializeFlight } from "../lib/serializers";
import { executeAddNewBooking, executeCancelBooking } from "../lib/procedures";

const router: IRouter = Router();

async function loadBookingWithJoins(bookingId: number) {
  const [row] = await db
    .select({
      booking: bookingsTable,
      flight: flightsTable,
      airlineName: airlinesTable.name,
      customerName: customersTable.name,
    })
    .from(bookingsTable)
    .innerJoin(flightsTable, eq(flightsTable.id, bookingsTable.flightId))
    .innerJoin(airlinesTable, eq(airlinesTable.id, flightsTable.airlineId))
    .innerJoin(customersTable, eq(customersTable.id, bookingsTable.customerId))
    .where(eq(bookingsTable.id, bookingId));
  return row;
}

router.get("/bookings", requireAuth, async (req, res): Promise<void> => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { status, search, all } = query.data;
  const isAdmin = req.customer!.role === "admin";

  const conditions = [];
  if (!(all && isAdmin)) {
    conditions.push(eq(bookingsTable.customerId, req.customer!.id));
  }
  if (status) conditions.push(eq(bookingsTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(bookingsTable.bookingReference, `%${search}%`),
        ilike(bookingsTable.passengerName, `%${search}%`),
        ilike(bookingsTable.passengerEmail, `%${search}%`),
      ),
    );
  }

  const rows = await db
    .select({
      booking: bookingsTable,
      flight: flightsTable,
      airlineName: airlinesTable.name,
      customerName: customersTable.name,
    })
    .from(bookingsTable)
    .innerJoin(flightsTable, eq(flightsTable.id, bookingsTable.flightId))
    .innerJoin(airlinesTable, eq(airlinesTable.id, flightsTable.airlineId))
    .innerJoin(customersTable, eq(customersTable.id, bookingsTable.customerId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.bookingDate));

  const serialized = rows.map((r) =>
    serializeBooking(
      r.booking,
      r.customerName,
      serializeFlight({ ...r.flight, airlineName: r.airlineName, availableSeats: 0 }),
    ),
  );
  res.json(ListBookingsResponse.parse(serialized));
});

router.post("/bookings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { flightId, seatNumber, cabinClass, passengerName, passengerEmail, passengerPhone } = parsed.data;

  const [seat] = await db
    .select()
    .from(seatsTable)
    .where(and(eq(seatsTable.flightId, flightId), eq(seatsTable.seatNumber, seatNumber)));
  if (!seat || seat.status !== "available") {
    res.status(409).json({ error: "Seat is not available" });
    return;
  }

  const execution = await executeAddNewBooking({
    customerId: req.customer!.id,
    flightId,
    seatNumber,
    cabinClass,
    passengerName,
    passengerEmail,
    passengerPhone,
  });

  if (!execution.success) {
    res.status(409).json({ error: execution.output });
    return;
  }

  const match = execution.output.match(/booking #(\d+)/i);
  const bookingId = match ? Number(match[1]) : null;
  if (!bookingId) {
    res.status(500).json({ error: "Booking created but id could not be resolved" });
    return;
  }

  const row = await loadBookingWithJoins(bookingId);
  if (!row) {
    res.status(500).json({ error: "Booking created but could not be loaded" });
    return;
  }

  res
    .status(201)
    .json(
      CreateBookingResponse.parse(
        serializeBooking(row.booking, row.customerName, serializeFlight({ ...row.flight, airlineName: row.airlineName, availableSeats: 0 })),
      ),
    );
});

router.get("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const row = await loadBookingWithJoins(params.data.id);
  if (!row) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (row.booking.customerId !== req.customer!.id && req.customer!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(
    GetBookingResponse.parse(
      serializeBooking(row.booking, row.customerName, serializeFlight({ ...row.flight, airlineName: row.airlineName, availableSeats: 0 })),
    ),
  );
});

router.patch("/bookings/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  const row = await loadBookingWithJoins(updated.id);
  res.json(
    UpdateBookingResponse.parse(
      serializeBooking(row!.booking, row!.customerName, serializeFlight({ ...row!.flight, airlineName: row!.airlineName, availableSeats: 0 })),
    ),
  );
});

router.post("/bookings/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const params = CancelBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const existing = await loadBookingWithJoins(params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (existing.booking.customerId !== req.customer!.id && req.customer!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const execution = await executeCancelBooking({ bookingId: params.data.id });
  if (!execution.success) {
    res.status(400).json({ error: execution.output });
    return;
  }

  const row = await loadBookingWithJoins(params.data.id);
  res.json(
    CancelBookingResponse.parse(
      serializeBooking(row!.booking, row!.customerName, serializeFlight({ ...row!.flight, airlineName: row!.airlineName, availableSeats: 0 })),
    ),
  );
});

router.get("/bookings/:id/ticket", requireAuth, async (req, res): Promise<void> => {
  const params = GetBookingTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const row = await loadBookingWithJoins(params.data.id);
  if (!row) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (row.booking.customerId !== req.customer!.id && req.customer!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const flight = serializeFlight({ ...row.flight, airlineName: row.airlineName, availableSeats: 0 });
  const qrPayload = JSON.stringify({
    ref: row.booking.bookingReference,
    flight: flight.flightNumber,
    seat: row.booking.seatNumber,
    passenger: row.booking.passengerName,
  });

  res.json(
    GetBookingTicketResponse.parse({
      bookingId: row.booking.id,
      bookingReference: row.booking.bookingReference,
      passengerName: row.booking.passengerName,
      flight,
      seatNumber: row.booking.seatNumber,
      cabinClass: row.booking.cabinClass,
      qrPayload,
      status: row.booking.status,
    }),
  );
});

export default router;
