import type { Airline, Booking, Customer, Flight } from "@workspace/db";

export function serializeAirline(a: Airline) {
  return {
    id: a.id,
    name: a.name,
    country: a.country,
    logoUrl: a.logoUrl,
    createdAt: a.createdAt.toISOString(),
  };
}

export function serializeFlight(f: Flight & { airlineName: string; availableSeats: number }) {
  const durationMinutes = Math.round(
    (f.arrivalTime.getTime() - f.departureTime.getTime()) / 60000,
  );
  return {
    id: f.id,
    airlineId: f.airlineId,
    airlineName: f.airlineName,
    flightNumber: f.flightNumber,
    departure: f.departure,
    arrival: f.arrival,
    departureTime: f.departureTime.toISOString(),
    arrivalTime: f.arrivalTime.toISOString(),
    status: f.status,
    aircraft: f.aircraft,
    totalSeats: f.totalSeats,
    availableSeats: f.availableSeats,
    basePrice: Number(f.basePrice),
    durationMinutes,
  };
}

export function serializeCustomer(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    role: c.role,
    avatarUrl: c.avatarUrl,
    darkModePref: c.darkModePref,
    notifyEmail: c.notifyEmail,
    notifySms: c.notifySms,
    createdAt: c.createdAt.toISOString(),
  };
}

export function serializeBooking(
  b: Booking,
  customerName: string,
  flight: ReturnType<typeof serializeFlight>,
) {
  return {
    id: b.id,
    customerId: b.customerId,
    customerName,
    flightId: b.flightId,
    bookingDate: b.bookingDate.toISOString(),
    seatNumber: b.seatNumber,
    cabinClass: b.cabinClass,
    status: b.status,
    price: Number(b.price),
    bookingReference: b.bookingReference,
    passengerName: b.passengerName,
    passengerEmail: b.passengerEmail,
    passengerPhone: b.passengerPhone,
    flight,
  };
}
