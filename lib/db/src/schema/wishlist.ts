import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";
import { flightsTable } from "./flights";

export const wishlistTable = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  flightId: integer("flight_id")
    .notNull()
    .references(() => flightsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WishlistRow = typeof wishlistTable.$inferSelect;
