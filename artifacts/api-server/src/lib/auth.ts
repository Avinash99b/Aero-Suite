import type { NextFunction, Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, customersTable, type Customer } from "@workspace/db";
import { logger } from "./logger";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      customer?: Customer;
    }
  }
}

/**
 * Requires a signed-in Clerk session and just-in-time provisions a matching
 * row in the local `customers` table (bridging Clerk identity to our schema).
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.clerkUserId, userId));

    if (existing) {
      req.customer = existing;
      next();
      return;
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const email =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      `${userId}@unknown.local`;
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      email.split("@")[0];

    const [created] = await db
      .insert(customersTable)
      .values({
        clerkUserId: userId,
        name,
        email,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber ?? "",
        avatarUrl: clerkUser.imageUrl ?? null,
        role: "customer",
      })
      .onConflictDoNothing({ target: customersTable.email })
      .returning();

    if (created) {
      req.customer = created;
      next();
      return;
    }

    // Race: another request created the row first (or email collided) — fetch it.
    const [row] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.clerkUserId, userId));

    if (!row) {
      const [byEmail] = await db
        .select()
        .from(customersTable)
        .where(eq(customersTable.email, email));
      if (!byEmail) {
        res.status(500).json({ error: "Failed to provision customer" });
        return;
      }
      req.customer = byEmail;
      next();
      return;
    }

    req.customer = row;
    next();
  } catch (err) {
    logger.error({ err }, "Failed to resolve authenticated customer");
    res.status(500).json({ error: "Failed to resolve authenticated customer" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.customer) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.customer.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
