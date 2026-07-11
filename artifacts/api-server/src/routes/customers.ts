import { Router, type IRouter } from "express";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, customersTable, bookingsTable, flightsTable, airlinesTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  ListCustomersResponse,
  GetCustomerParams,
  GetCustomerResponse,
  UpdateCustomerParams,
  UpdateCustomerBody,
  UpdateCustomerResponse,
  DeleteCustomerParams,
  GetCustomerBookingsParams,
  GetCustomerBookingsResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";
import { serializeBooking, serializeCustomer, serializeFlight } from "../lib/serializers";

const router: IRouter = Router();

router.get("/customers", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const query = ListCustomersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { search } = query.data;
  const rows = await db
    .select()
    .from(customersTable)
    .where(search ? or(ilike(customersTable.name, `%${search}%`), ilike(customersTable.email, `%${search}%`)) : undefined)
    .orderBy(desc(customersTable.createdAt));
  res.json(ListCustomersResponse.parse(rows.map(serializeCustomer)));
});

router.get("/customers/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(GetCustomerResponse.parse(serializeCustomer(customer)));
});

router.patch("/customers/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [customer] = await db
    .update(customersTable)
    .set(parsed.data)
    .where(eq(customersTable.id, params.data.id))
    .returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(UpdateCustomerResponse.parse(serializeCustomer(customer)));
});

router.delete("/customers/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [customer] = await db.delete(customersTable).where(eq(customersTable.id, params.data.id)).returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/customers/:id/bookings", requireAuth, async (req, res): Promise<void> => {
  const params = GetCustomerBookingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const isAdmin = req.customer!.role === "admin";
  if (!isAdmin && req.customer!.id !== params.data.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const rows = await db
    .select({
      booking: bookingsTable,
      flight: flightsTable,
      airlineName: airlinesTable.name,
    })
    .from(bookingsTable)
    .innerJoin(flightsTable, eq(flightsTable.id, bookingsTable.flightId))
    .innerJoin(airlinesTable, eq(airlinesTable.id, flightsTable.airlineId))
    .where(eq(bookingsTable.customerId, params.data.id))
    .orderBy(desc(bookingsTable.bookingDate));

  const serialized = rows.map((r) =>
    serializeBooking(
      r.booking,
      customer.name,
      serializeFlight({ ...r.flight, airlineName: r.airlineName, availableSeats: 0 }),
    ),
  );

  res.json(GetCustomerBookingsResponse.parse(serialized));
});

export default router;
