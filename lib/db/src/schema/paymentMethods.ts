import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const paymentMethodsTable = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  cardBrand: text("card_brand").notNull(),
  last4: text("last4").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  cardholderName: text("cardholder_name").notNull(),
});

export const insertPaymentMethodSchema = createInsertSchema(
  paymentMethodsTable,
).omit({ id: true, customerId: true, last4: true });
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethodsTable.$inferSelect;
