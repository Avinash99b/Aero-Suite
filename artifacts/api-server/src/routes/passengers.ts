import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, savedPassengersTable } from "@workspace/db";
import {
  ListPassengersResponse,
  CreatePassengerBody,
  CreatePassengerResponse,
  UpdatePassengerParams,
  UpdatePassengerBody,
  UpdatePassengerResponse,
  DeletePassengerParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/passengers", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(savedPassengersTable).where(eq(savedPassengersTable.customerId, req.customer!.id));
  res.json(ListPassengersResponse.parse(rows));
});

router.post("/passengers", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePassengerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(savedPassengersTable)
    .values({ ...parsed.data, customerId: req.customer!.id })
    .returning();
  res.status(201).json(CreatePassengerResponse.parse(row));
});

router.patch("/passengers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdatePassengerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePassengerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(savedPassengersTable)
    .set(parsed.data)
    .where(and(eq(savedPassengersTable.id, params.data.id), eq(savedPassengersTable.customerId, req.customer!.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Passenger not found" });
    return;
  }
  res.json(UpdatePassengerResponse.parse(row));
});

router.delete("/passengers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeletePassengerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(savedPassengersTable)
    .where(and(eq(savedPassengersTable.id, params.data.id), eq(savedPassengersTable.customerId, req.customer!.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Passenger not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
