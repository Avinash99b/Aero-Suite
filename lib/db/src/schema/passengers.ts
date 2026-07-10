import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const savedPassengersTable = pgTable("saved_passengers", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  passportNumber: text("passport_number"),
  dateOfBirth: text("date_of_birth"),
});

export const insertSavedPassengerSchema = createInsertSchema(
  savedPassengersTable,
).omit({ id: true, customerId: true });
export type InsertSavedPassenger = z.infer<typeof insertSavedPassengerSchema>;
export type SavedPassenger = typeof savedPassengersTable.$inferSelect;
