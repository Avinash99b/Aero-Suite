import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, wishlistTable, flightsTable, airlinesTable, seatsTable } from "@workspace/db";
import {
  ListWishlistResponse,
  CreateWishlistItemBody,
  CreateWishlistItemResponse,
  DeleteWishlistItemParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { serializeFlight } from "../lib/serializers";

const router: IRouter = Router();

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: wishlistTable.id,
      flight: flightsTable,
      airlineName: airlinesTable.name,
    })
    .from(wishlistTable)
    .innerJoin(flightsTable, eq(flightsTable.id, wishlistTable.flightId))
    .innerJoin(airlinesTable, eq(airlinesTable.id, flightsTable.airlineId))
    .where(eq(wishlistTable.customerId, req.customer!.id));

  const serialized = await Promise.all(
    rows.map(async (r) => {
      const [avail] = await db
        .select({ count: eq(seatsTable.status, "available") })
        .from(seatsTable)
        .where(eq(seatsTable.flightId, r.flight.id));
      return {
        id: r.id,
        customerId: req.customer!.id,
        flight: serializeFlight({ ...r.flight, airlineName: r.airlineName, availableSeats: 0 }),
      };
    }),
  );

  res.json(ListWishlistResponse.parse(serialized));
});

router.post("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateWishlistItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [flight] = await db
    .select({ flight: flightsTable, airlineName: airlinesTable.name })
    .from(flightsTable)
    .innerJoin(airlinesTable, eq(airlinesTable.id, flightsTable.airlineId))
    .where(eq(flightsTable.id, parsed.data.flightId));
  if (!flight) {
    res.status(404).json({ error: "Flight not found" });
    return;
  }

  const [row] = await db
    .insert(wishlistTable)
    .values({ customerId: req.customer!.id, flightId: parsed.data.flightId })
    .returning();

  res.status(201).json(
    CreateWishlistItemResponse.parse({
      id: row.id,
      customerId: req.customer!.id,
      flight: serializeFlight({ ...flight.flight, airlineName: flight.airlineName, availableSeats: 0 }),
    }),
  );
});

router.delete("/wishlist/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteWishlistItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(wishlistTable)
    .where(and(eq(wishlistTable.id, params.data.id), eq(wishlistTable.customerId, req.customer!.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Wishlist item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
