import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useListBookings } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function AdminBookings() {
  const { data: bookings, isLoading } = useListBookings({ all: true });

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Global Bookings</h1>
          <p className="text-muted-foreground">View all reservations across the platform.</p>
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Flight</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : bookings?.length ? (
                  bookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono font-medium">{booking.bookingReference}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{booking.customerName}</div>
                        <div className="text-xs text-muted-foreground">Passenger: {booking.passengerName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{booking.flight.departure} → {booking.flight.arrival}</div>
                        <div className="text-xs text-muted-foreground">{booking.flight.airlineName} {booking.flight.flightNumber}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(booking.bookingDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${booking.price}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No bookings found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
