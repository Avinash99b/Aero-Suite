import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const airlinesTable = pgTable("airlines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAirlineSchema = createInsertSchema(airlinesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAirline = z.infer<typeof insertAirlineSchema>;
export type Airline = typeof airlinesTable.$inferSelect;
