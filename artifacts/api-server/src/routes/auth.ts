import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from "../lib/auth";
import { serializeCustomer } from "../lib/serializers";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, phone } = req.body ?? {};

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(eq(customersTable.email, email.toLowerCase().trim()));

    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [customer] = await db
      .insert(customersTable)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone?.trim() ?? "",
        role: "customer",
      })
      .returning();

    const token = signToken(customer.id);
    setAuthCookie(res, token);

    res.status(201).json(serializeCustomer(customer));
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.email, email.toLowerCase().trim()));

    if (!customer) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken(customer.id);
    setAuthCookie(res, token);

    res.json(serializeCustomer(customer));
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (_req, res): void => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, (req, res): void => {
  res.json(serializeCustomer(req.customer!));
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body ?? {};

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.email, email.toLowerCase().trim()));

    if (!customer) {
      res.json({ success: true, message: "If that email exists, a reset link has been sent." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(customersTable)
      .set({ resetToken: token, resetTokenExpiresAt: expiresAt })
      .where(eq(customersTable.id, customer.id));

    logger.info(
      { customerId: customer.id, token },
      "Password reset token generated (deliver via email in production)",
    );

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
      ...(process.env.NODE_ENV !== "production" ? { resetToken: token } : {}),
    });
  } catch (err) {
    logger.error({ err }, "Forgot password error");
    res.status(500).json({ error: "Could not process request" });
  }
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body ?? {};

  if (!token || !password) {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.resetToken, token));

    if (!customer) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    if (!customer.resetTokenExpiresAt || customer.resetTokenExpiresAt < new Date()) {
      res.status(400).json({ error: "Reset token has expired" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db
      .update(customersTable)
      .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
      .where(eq(customersTable.id, customer.id));

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    logger.error({ err }, "Reset password error");
    res.status(500).json({ error: "Could not reset password" });
  }
});

router.patch("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new passwords are required" });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  try {
    const valid = await bcrypt.compare(currentPassword, req.customer!.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(customersTable)
      .set({ passwordHash })
      .where(eq(customersTable.id, req.customer!.id));

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Change password error");
    res.status(500).json({ error: "Could not change password" });
  }
});

export default router;
