import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import { UpdateMeBody, GetMeResponse, UpdateMeResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { serializeCustomer } from "../lib/serializers";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  res.json(GetMeResponse.parse(serializeCustomer(req.customer!)));
});

router.patch("/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(customersTable)
    .set(parsed.data)
    .where(eq(customersTable.id, req.customer!.id))
    .returning();

  res.json(UpdateMeResponse.parse(serializeCustomer(updated)));
});

export default router;
