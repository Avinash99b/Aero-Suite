-- Real Postgres views equivalent to the 3 required views. Idempotent.

CREATE OR REPLACE VIEW daily_flight_schedule AS
SELECT f.id, f.flight_number, a.name AS airline_name, f.departure, f.arrival,
       f.departure_time, f.arrival_time, f.status, f.aircraft
FROM flights f
JOIN airlines a ON a.id = f.airline_id
ORDER BY f.departure_time;

CREATE OR REPLACE VIEW confirmed_bookings_by_customer AS
SELECT c.id AS customer_id, c.name AS customer_name, c.email, b.id AS booking_id,
       f.departure, f.arrival, b.seat_number, b.booking_date
FROM bookings b
JOIN customers c ON c.id = b.customer_id
JOIN flights f ON f.id = b.flight_id
WHERE b.status = 'confirmed'
ORDER BY b.booking_date DESC;

CREATE OR REPLACE VIEW flight_occupancy_summary AS
SELECT f.id AS flight_id, a.name AS airline_name, f.departure, f.arrival, f.total_seats,
       COUNT(b.id) FILTER (WHERE b.status = 'confirmed') AS confirmed_bookings
FROM flights f
JOIN airlines a ON a.id = f.airline_id
LEFT JOIN bookings b ON b.flight_id = f.id
GROUP BY f.id, a.name, f.departure, f.arrival, f.total_seats
ORDER BY f.id;
