import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { airlinesTable } from "./airlines";

export const flightStatuses = [
  "scheduled",
  "boarding",
  "departed",
  "delayed",
  "cancelled",
  "arrived",
] as const;

export const flightsTable = pgTable("flights", {
  id: serial("id").primaryKey(),
  airlineId: integer("airline_id")
    .notNull()
    .references(() => airlinesTable.id, { onDelete: "cascade" }),
  flightNumber: text("flight_number").notNull(),
  departure: text("departure").notNull(),
  arrival: text("arrival").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  status: text("status").notNull().default("scheduled"),
  aircraft: text("aircraft").notNull(),
  totalSeats: integer("total_seats").notNull(),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFlightSchema = createInsertSchema(flightsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type Flight = typeof flightsTable.$inferSelect;
