-- Real Postgres stored procedures (as functions, callable via SELECT)
-- equivalent to the 3 required procedures. Idempotent: safe to re-run.

-- add_new_booking(customer_id, flight_id, seat_number, cabin_class, price,
--                  passenger_name, passenger_email, passenger_phone)
-- Inserts a booking, relying on trg_check_seat_availability to enforce the
-- seat-availability rule, and returns the new booking id + reference.
CREATE OR REPLACE FUNCTION add_new_booking(
  p_customer_id INTEGER,
  p_flight_id INTEGER,
  p_seat_number TEXT,
  p_cabin_class TEXT,
  p_price NUMERIC,
  p_passenger_name TEXT,
  p_passenger_email TEXT,
  p_passenger_phone TEXT
) RETURNS TABLE(booking_id INTEGER, booking_reference TEXT) AS $$
DECLARE
  v_id INTEGER;
  v_ref TEXT;
BEGIN
  v_ref := 'SR' || to_char(now(), 'YYMMDD') || lpad(floor(random() * 10000)::text, 4, '0');

  INSERT INTO bookings (
    customer_id, flight_id, seat_number, cabin_class, status, price,
    booking_reference, passenger_name, passenger_email, passenger_phone
  ) VALUES (
    p_customer_id, p_flight_id, p_seat_number, p_cabin_class, 'confirmed', p_price,
    v_ref, p_passenger_name, p_passenger_email, p_passenger_phone
  ) RETURNING id INTO v_id;

  UPDATE seats SET status = 'booked'
    WHERE flight_id = p_flight_id AND seat_number = p_seat_number;

  RETURN QUERY SELECT v_id, v_ref;
END;
$$ LANGUAGE plpgsql;

-- get_booking_history(customer_id) — returns every booking for a customer
-- joined with flight details, most recent first.
CREATE OR REPLACE FUNCTION get_booking_history(p_customer_id INTEGER)
RETURNS TABLE(
  booking_id INTEGER,
  booking_reference TEXT,
  status TEXT,
  seat_number TEXT,
  cabin_class TEXT,
  price NUMERIC,
  departure TEXT,
  arrival TEXT,
  departure_time TIMESTAMP,
  booking_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.booking_reference, b.status, b.seat_number, b.cabin_class, b.price,
         f.departure, f.arrival, f.departure_time, b.booking_date
  FROM bookings b
  JOIN flights f ON f.id = b.flight_id
  WHERE b.customer_id = p_customer_id
  ORDER BY b.booking_date DESC;
END;
$$ LANGUAGE plpgsql;

-- cancel_booking(booking_id) — cancels a booking, frees the seat, and
-- returns the updated status text (trg_notify_booking_status_change fires
-- the status-change trigger automatically).
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id INTEGER)
RETURNS TABLE(booking_id INTEGER, status TEXT) AS $$
DECLARE
  v_flight_id INTEGER;
  v_seat TEXT;
BEGIN
  SELECT flight_id, seat_number INTO v_flight_id, v_seat FROM bookings WHERE id = p_booking_id;

  IF v_flight_id IS NULL THEN
    RAISE EXCEPTION 'Booking % not found', p_booking_id;
  END IF;

  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE seats SET status = 'available' WHERE flight_id = v_flight_id AND seat_number = v_seat;

  RETURN QUERY SELECT p_booking_id, 'cancelled'::TEXT;
END;
$$ LANGUAGE plpgsql;
