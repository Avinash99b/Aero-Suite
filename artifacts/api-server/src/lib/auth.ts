import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
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

const JWT_SECRET = process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const COOKIE_NAME = "auth_token";

export function signToken(customerId: number): string {
  return jwt.sign({ sub: customerId }, JWT_SECRET, { expiresIn: "7d" });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token =
    req.cookies?.[COOKIE_NAME] ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  const customerId = Number(payload.sub);
  if (!customerId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId));

    if (!customer) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.customer = customer;
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
