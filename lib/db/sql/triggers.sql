-- Real Postgres triggers implementing the 3 required behaviours from the
-- source schema (seat-availability check, booking status change notice,
-- flight schedule change log). Idempotent: safe to re-run.

-- 1. Seat availability check — reject a new/confirmed booking on a seat that
--    is already confirmed on the same flight.
CREATE OR REPLACE FUNCTION check_seat_availability() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND EXISTS (
    SELECT 1 FROM bookings
    WHERE flight_id = NEW.flight_id
      AND seat_number = NEW.seat_number
      AND status = 'confirmed'
      AND id <> COALESCE(NEW.id, -1)
  ) THEN
    RAISE EXCEPTION 'Seat % on flight % is already booked', NEW.seat_number, NEW.flight_id
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_seat_availability ON bookings;
CREATE TRIGGER trg_check_seat_availability
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_seat_availability();

-- 2. Notify on booking status change — logs every status transition so the
--    admin UI can show a live trigger feed, and creates a customer notification.
CREATE OR REPLACE FUNCTION notify_booking_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO trigger_logs (trigger_name, message)
    VALUES (
      'notify_booking_status_change',
      format('Booking #%s status changed from %s to %s', NEW.id, OLD.status, NEW.status)
    );
    INSERT INTO notifications (customer_id, title, message)
    VALUES (
      NEW.customer_id,
      'Booking status updated',
      format('Your booking %s is now %s.', NEW.booking_reference, NEW.status)
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO trigger_logs (trigger_name, message)
    VALUES (
      'notify_booking_status_change',
      format('Booking #%s created with status %s', NEW.id, NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_booking_status_change ON bookings;
CREATE TRIGGER trg_notify_booking_status_change
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_booking_status_change();

-- 3. Log flight schedule changes — records any change to departure/arrival
--    time or status on a flight.
CREATE OR REPLACE FUNCTION log_flight_schedule_change() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.departure_time IS DISTINCT FROM OLD.departure_time
     OR NEW.arrival_time IS DISTINCT FROM OLD.arrival_time
     OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO trigger_logs (trigger_name, message)
    VALUES (
      'log_flight_schedule_change',
      format(
        'Flight #%s (%s -> %s) schedule changed: status %s -> %s, departure %s -> %s',
        NEW.id, NEW.departure, NEW.arrival, OLD.status, NEW.status,
        OLD.departure_time, NEW.departure_time
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_flight_schedule_change ON flights;
CREATE TRIGGER trg_log_flight_schedule_change
  AFTER UPDATE ON flights
  FOR EACH ROW EXECUTE FUNCTION log_flight_schedule_change();
