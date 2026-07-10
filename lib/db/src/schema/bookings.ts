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
import { customersTable } from "./customers";
import { flightsTable } from "./flights";

export const bookingStatuses = ["confirmed", "cancelled", "completed"] as const;

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  flightId: integer("flight_id")
    .notNull()
    .references(() => flightsTable.id, { onDelete: "cascade" }),
  bookingDate: timestamp("booking_date").notNull().defaultNow(),
  seatNumber: text("seat_number").notNull(),
  cabinClass: text("cabin_class").notNull().default("economy"),
  status: text("status").notNull().default("confirmed"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  bookingReference: text("booking_reference").notNull().unique(),
  passengerName: text("passenger_name").notNull(),
  passengerEmail: text("passenger_email").notNull(),
  passengerPhone: text("passenger_phone").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
  bookingDate: true,
  bookingReference: true,
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
