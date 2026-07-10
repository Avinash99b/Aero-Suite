import { Router, type IRouter } from "express";
import { and, eq, gte, sql, type SQL } from "drizzle-orm";
import { db, flightsTable, airlinesTable, seatsTable, bookingsTable } from "@workspace/db";
import {
  ListFlightsQueryParams,
  ListFlightsResponse,
  CreateFlightBody,
  CreateFlightResponse,
  GetFlightParams,
  GetFlightResponse,
  UpdateFlightParams,
  UpdateFlightBody,
  UpdateFlightResponse,
  DeleteFlightParams,
  GetFlightSeatMapParams,
  GetFlightSeatMapResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";
import { serializeFlight } from "../lib/serializers";

const router: IRouter = Router();

const CABIN_LAYOUT: { cabinClass: string; rows: number; letters: string[] }[] = [
  { cabinClass: "business", rows: 4, letters: ["A", "C", "D", "F"] },
  { cabinClass: "economy", rows: 20, letters: ["A", "B", "C", "D", "E", "F"] },
];

async function generateSeatsForFlight(flightId: number, totalSeats: number) {
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
  if (seats.length > 0) {
    await db.insert(seatsTable).values(seats);
  }
}

async function withAvailability(flights: (typeof flightsTable.$inferSelect & { airlineName: string })[]) {
  return Promise.all(
    flights.map(async (f) => {
      const [avail] = await db
        .select({ count: sql<number>`count(*)` })
        .from(seatsTable)
        .where(and(eq(seatsTable.flightId, f.id), eq(seatsTable.status, "available")));
      return serializeFlight({ ...f, availableSeats: Number(avail?.count ?? 0) });
    }),
  );
}

router.get("/flights", async (req, res): Promise<void> => {
  const query = ListFlightsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { origin, destination, date, cabinClass, status, airlineId, minSeats } = query.data;

  const conditions: SQL[] = [];
  if (origin) conditions.push(sql`${flightsTable.departure} ilike ${`%${origin}%`}`);
  if (destination) conditions.push(sql`${flightsTable.arrival} ilike ${`%${destination}%`}`);
  if (date) conditions.push(sql`${flightsTable.departureTime}::date = ${date}::date`);
  if (status) conditions.push(eq(flightsTable.status, status));
  if (airlineId) conditions.push(eq(flightsTable.airlineId, airlineId));

  const rows = await db
    .select({
      id: flightsTable.id,
      airlineId: flightsTable.airlineId,
      flightNumber: flightsTable.flightNumber,
      departure: flightsTable.departure,
      arrival: flightsTable.arrival,
      departureTime: flightsTable.departureTime,
      arrivalTime: flightsTable.arrivalTime,
      status: flightsTable.status,
      aircraft: flightsTable.aircraft,
      totalSeats: flightsTable.totalSeats,
      basePrice: flightsTable.basePrice,
      createdAt: flightsTable.createdAt,
      airlineName: airlinesTable.name,
    })
    .from(flightsTable)
    .innerJoin(airlinesTable, eq(airlinesTable.id, flightsTable.airlineId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(flightsTable.departureTime);

  let serialized = await withAvailability(rows);

  if (cabinClass) {
    const withCabin = await Promise.all(
      rows.map(async (f) => {
        const [avail] = await db
          .select({ count: sql<number>`count(*)` })
          .from(seatsTable)
          .where(and(eq(seatsTable.flightId, f.id), eq(seatsTable.status, "available"), eq(seatsTable.cabinClass, cabinClass)));
        return Number(avail?.count ?? 0);
      }),
    );
    serialized = serialized.filter((_, i) => withCabin[i] > 0);
  }

  if (minSeats) {
    serialized = serialized.filter((f) => f.availableSeats >= minSeats);
  }

  res.json(ListFlightsResponse.parse(serialized));
});

router.post("/flights", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateFlightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { flightNumber, ...rest } = parsed.data;
  const [flight] = await db
    .insert(flightsTable)
    .values({
      ...rest,
      flightNumber: flightNumber ?? `SR${Math.floor(1000 + Math.random() * 9000)}`,
      departureTime: new Date(rest.departureTime),
      arrivalTime: new Date(rest.arrivalTime),
      basePrice: String(rest.basePrice),
    })
    .returning();

  await generateSeatsForFlight(flight.id, flight.totalSeats);

  const [airline] = await db.select().from(airlinesTable).where(eq(airlinesTable.id, flight.airlineId));
  const [avail] = await db
    .select({ count: sql<number>`count(*)` })
    .from(seatsTable)
    .where(and(eq(seatsTable.flightId, flight.id), eq(seatsTable.status, "available")));

  res
    .status(201)
    .json(
      CreateFlightResponse.parse(
        serializeFlight({ ...flight, airlineName: airline?.name ?? "", availableSeats: Number(avail?.count ?? 0) }),
      ),
    );
});

router.get("/flights/:id", async (req, res): Promise<void> => {
  const params = GetFlightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [flight] = await db
    .select({
      id: flightsTable.id,
      airlineId: flightsTable.airlineId,
      flightNumber: flightsTable.flightNumber,
      departure: flightsTable.departure,
      arrival: flightsTable.arrival,
      departureTime: flightsTable.departureTime,
      arrivalTime: flightsTable.arrivalTime,
      status: flightsTable.status,
      aircraft: flightsTable.aircraft,
      totalSeats: flightsTable.totalSeats,
      basePrice: flightsTable.basePrice,
      createdAt: flightsTable.createdAt,
      airlineName: airlinesTable.name,
    })
    .from(flightsTable)
    .innerJoin(airlinesTable, eq(airlinesTable.id, flightsTable.airlineId))
    .where(eq(flightsTable.id, params.data.id));

  if (!flight) {
    res.status(404).json({ error: "Flight not found" });
    return;
  }

  const [avail] = await db
    .select({ count: sql<number>`count(*)` })
    .from(seatsTable)
    .where(and(eq(seatsTable.flightId, flight.id), eq(seatsTable.status, "available")));

  res.json(GetFlightResponse.parse(serializeFlight({ ...flight, availableSeats: Number(avail?.count ?? 0) })));
});

router.patch("/flights/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateFlightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFlightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { departureTime, arrivalTime, basePrice, ...rest } = parsed.data;
  const values: Record<string, unknown> = { ...rest };
  if (departureTime) values.departureTime = new Date(departureTime);
  if (arrivalTime) values.arrivalTime = new Date(arrivalTime);
  if (basePrice !== undefined) values.basePrice = String(basePrice);

  const [flight] = await db.update(flightsTable).set(values).where(eq(flightsTable.id, params.data.id)).returning();
  if (!flight) {
    res.status(404).json({ error: "Flight not found" });
    return;
  }

  const [airline] = await db.select().from(airlinesTable).where(eq(airlinesTable.id, flight.airlineId));
  const [avail] = await db
    .select({ count: sql<number>`count(*)` })
    .from(seatsTable)
    .where(and(eq(seatsTable.flightId, flight.id), eq(seatsTable.status, "available")));

  res.json(
    UpdateFlightResponse.parse(
      serializeFlight({ ...flight, airlineName: airline?.name ?? "", availableSeats: Number(avail?.count ?? 0) }),
    ),
  );
});

router.delete("/flights/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteFlightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [flight] = await db.delete(flightsTable).where(eq(flightsTable.id, params.data.id)).returning();
  if (!flight) {
    res.status(404).json({ error: "Flight not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/flights/:id/seats", async (req, res): Promise<void> => {
  const params = GetFlightSeatMapParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const seats = await db
    .select()
    .from(seatsTable)
    .where(eq(seatsTable.flightId, params.data.id))
    .orderBy(seatsTable.seatNumber);
  res.json(GetFlightSeatMapResponse.parse(seats));
});

export default router;
