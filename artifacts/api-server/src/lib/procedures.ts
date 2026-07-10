import { sql } from "drizzle-orm";
import { db, procedureExecutionsTable } from "@workspace/db";

export interface ProcedureDefinition {
  name: string;
  label: string;
  description: string;
  params: string[];
}

export const PROCEDURE_DEFINITIONS: ProcedureDefinition[] = [
  {
    name: "add_new_booking",
    label: "add_new_booking",
    description:
      "Inserts a new confirmed booking for a customer/flight/seat and marks the seat as booked.",
    params: ["customerId", "flightId", "seatNumber", "cabinClass", "passengerName", "passengerEmail", "passengerPhone"],
  },
  {
    name: "get_booking_history",
    label: "get_booking_history",
    description: "Returns every booking for a customer joined with flight details.",
    params: ["customerId"],
  },
  {
    name: "cancel_booking",
    label: "cancel_booking",
    description: "Cancels a booking, frees its seat, and fires the status-change trigger.",
    params: ["bookingId"],
  },
];

async function recordExecution(procedureName: string, success: boolean, output: string) {
  const [row] = await db
    .insert(procedureExecutionsTable)
    .values({ procedureName, success, output })
    .returning();
  return row;
}

export async function executeAddNewBooking(input: {
  customerId: number;
  flightId: number;
  seatNumber: string;
  cabinClass: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
}) {
  try {
    const [flight] = await db.execute(
      sql`SELECT base_price FROM flights WHERE id = ${input.flightId}`,
    ).then((r) => r.rows as { base_price: string }[]);
    if (!flight) throw new Error(`Flight ${input.flightId} not found`);

    const result = await db.execute(
      sql`SELECT * FROM add_new_booking(${input.customerId}, ${input.flightId}, ${input.seatNumber}, ${input.cabinClass}, ${flight.base_price}, ${input.passengerName}, ${input.passengerEmail}, ${input.passengerPhone})`,
    );
    const row = result.rows[0] as { booking_id: number; booking_reference: string };
    const output = `Created booking #${row.booking_id} with reference ${row.booking_reference}`;
    return await recordExecution("add_new_booking", true, output);
  } catch (err) {
    const output = err instanceof Error ? err.message : "Unknown error";
    return await recordExecution("add_new_booking", false, output);
  }
}

export async function executeGetBookingHistory(input: { customerId: number }) {
  try {
    const result = await db.execute(
      sql`SELECT * FROM get_booking_history(${input.customerId})`,
    );
    const output = `Found ${result.rows.length} booking(s): ${JSON.stringify(result.rows)}`;
    return await recordExecution("get_booking_history", true, output);
  } catch (err) {
    const output = err instanceof Error ? err.message : "Unknown error";
    return await recordExecution("get_booking_history", false, output);
  }
}

export async function executeCancelBooking(input: { bookingId: number }) {
  try {
    const result = await db.execute(
      sql`SELECT * FROM cancel_booking(${input.bookingId})`,
    );
    const row = result.rows[0] as { booking_id: number; status: string };
    const output = `Booking #${row.booking_id} is now ${row.status}`;
    return await recordExecution("cancel_booking", true, output);
  } catch (err) {
    const output = err instanceof Error ? err.message : "Unknown error";
    return await recordExecution("cancel_booking", false, output);
  }
}
