import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, paymentMethodsTable } from "@workspace/db";
import {
  ListPaymentMethodsResponse,
  CreatePaymentMethodBody,
  CreatePaymentMethodResponse,
  DeletePaymentMethodParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/payment-methods", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(paymentMethodsTable).where(eq(paymentMethodsTable.customerId, req.customer!.id));
  res.json(ListPaymentMethodsResponse.parse(rows));
});

router.post("/payment-methods", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePaymentMethodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { cardNumber, ...rest } = parsed.data;
  const [row] = await db
    .insert(paymentMethodsTable)
    .values({ ...rest, customerId: req.customer!.id, last4: cardNumber.slice(-4) })
    .returning();
  res.status(201).json(CreatePaymentMethodResponse.parse(row));
});

router.delete("/payment-methods/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeletePaymentMethodParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(paymentMethodsTable)
    .where(and(eq(paymentMethodsTable.id, params.data.id), eq(paymentMethodsTable.customerId, req.customer!.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Payment method not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
