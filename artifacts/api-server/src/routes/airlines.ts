import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, airlinesTable, flightsTable, bookingsTable } from "@workspace/db";
import {
  ListAirlinesResponse,
  CreateAirlineBody,
  CreateAirlineResponse,
  GetAirlineParams,
  GetAirlineResponse,
  UpdateAirlineParams,
  UpdateAirlineBody,
  UpdateAirlineResponse,
  DeleteAirlineParams,
  GetAirlineStatsParams,
  GetAirlineStatsResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";
import { serializeAirline } from "../lib/serializers";

const router: IRouter = Router();

router.get("/airlines", async (_req, res): Promise<void> => {
  const airlines = await db.select().from(airlinesTable).orderBy(airlinesTable.name);
  res.json(ListAirlinesResponse.parse(airlines.map(serializeAirline)));
});

router.post("/airlines", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAirlineBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [airline] = await db.insert(airlinesTable).values(parsed.data).returning();
  res.status(201).json(CreateAirlineResponse.parse(serializeAirline(airline)));
});

router.get("/airlines/:id", async (req, res): Promise<void> => {
  const params = GetAirlineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [airline] = await db.select().from(airlinesTable).where(eq(airlinesTable.id, params.data.id));
  if (!airline) {
    res.status(404).json({ error: "Airline not found" });
    return;
  }
  res.json(GetAirlineResponse.parse(serializeAirline(airline)));
});

router.patch("/airlines/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAirlineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAirlineBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [airline] = await db
    .update(airlinesTable)
    .set(parsed.data)
    .where(eq(airlinesTable.id, params.data.id))
    .returning();
  if (!airline) {
    res.status(404).json({ error: "Airline not found" });
    return;
  }
  res.json(UpdateAirlineResponse.parse(serializeAirline(airline)));
});

router.delete("/airlines/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteAirlineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [airline] = await db.delete(airlinesTable).where(eq(airlinesTable.id, params.data.id)).returning();
  if (!airline) {
    res.status(404).json({ error: "Airline not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/airlines/:id/stats", async (req, res): Promise<void> => {
  const params = GetAirlineStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const airlineId = params.data.id;

  const [fleet] = await db
    .select({ count: sql<number>`count(*)` })
    .from(flightsTable)
    .where(eq(flightsTable.airlineId, airlineId));
  const [active] = await db
    .select({ count: sql<number>`count(*)` })
    .from(flightsTable)
    .where(sql`${flightsTable.airlineId} = ${airlineId} and ${flightsTable.departureTime} > now()`);
  const [bookingStats] = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<string>`coalesce(sum(${bookingsTable.price}), 0)`,
    })
    .from(bookingsTable)
    .innerJoin(flightsTable, eq(flightsTable.id, bookingsTable.flightId))
    .where(sql`${flightsTable.airlineId} = ${airlineId} and ${bookingsTable.status} = 'confirmed'`);

  res.json(
    GetAirlineStatsResponse.parse({
      airlineId,
      fleetSize: Number(fleet?.count ?? 0),
      activeFlights: Number(active?.count ?? 0),
      totalBookings: Number(bookingStats?.count ?? 0),
      totalRevenue: Number(bookingStats?.revenue ?? 0),
    }),
  );
});

export default router;
