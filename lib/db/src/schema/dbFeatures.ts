import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Populated by real Postgres triggers (see lib/db/sql/triggers.sql) that fire
// on Bookings/Flights DML. This table is the audit trail the "Database
// Features" admin UI reads to prove the triggers actually executed inside
// Postgres, not in application code.
export const triggerLogsTable = pgTable("trigger_logs", {
  id: serial("id").primaryKey(),
  triggerName: text("trigger_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type TriggerLog = typeof triggerLogsTable.$inferSelect;

// Records every invocation of the Postgres stored procedures/functions
// (add_new_booking, cancel_booking, get_booking_history) so the admin UI can
// show an execution history alongside live output.
export const procedureExecutionsTable = pgTable("procedure_executions", {
  id: serial("id").primaryKey(),
  procedureName: text("procedure_name").notNull(),
  success: boolean("success").notNull(),
  output: text("output").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type ProcedureExecution = typeof procedureExecutionsTable.$inferSelect;
