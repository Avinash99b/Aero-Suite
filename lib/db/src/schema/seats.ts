import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { flightsTable } from "./flights";

export const cabinClasses = ["economy", "premium_economy", "business", "first"] as const;
export const seatStatuses = ["available", "held", "booked"] as const;

export const seatsTable = pgTable("seats", {
  id: serial("id").primaryKey(),
  flightId: integer("flight_id")
    .notNull()
    .references(() => flightsTable.id, { onDelete: "cascade" }),
  seatNumber: text("seat_number").notNull(),
  cabinClass: text("cabin_class").notNull().default("economy"),
  status: text("status").notNull().default("available"),
});

export const insertSeatSchema = createInsertSchema(seatsTable).omit({
  id: true,
});
export type InsertSeat = z.infer<typeof insertSeatSchema>;
export type Seat = typeof seatsTable.$inferSelect;
