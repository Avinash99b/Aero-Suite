import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Plane, Search, MoreVertical, MapPin, Calendar, Clock, Download, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGetMe, useGetCustomerBookings, useCancelBooking, getGetCustomerBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Bookings() {
  const { data: user } = useGetMe();
  const { data: bookings, isLoading } = useGetCustomerBookings(user?.id ?? 0, { query: { enabled: !!user?.id } });
  const cancelBooking = useCancelBooking();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<number | null>(null);

  const handleCancel = async () => {
    if (!selectedBookingToCancel) return;
    try {
      await cancelBooking.mutateAsync({ id: selectedBookingToCancel });
      toast({ title: "Booking Cancelled", description: "Your flight has been cancelled successfully." });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: getGetCustomerBookingsQueryKey(user.id) });
      }
      setSelectedBookingToCancel(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filteredBookings = bookings?.filter(b => 
    b.flight.departure.toLowerCase().includes(search.toLowerCase()) ||
    b.flight.arrival.toLowerCase().includes(search.toLowerCase()) ||
    b.bookingReference.toLowerCase().includes(search.toLowerCase()) ||
    b.passengerName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const upcoming = filteredBookings.filter(b => b.status === "confirmed" && new Date(b.flight.departureTime) > new Date());
  const past = filteredBookings.filter(b => b.status === "confirmed" && new Date(b.flight.departureTime) <= new Date());
  const cancelled = filteredBookings.filter(b => b.status === "cancelled");

  const BookingCard = ({ booking }: { booking: any }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row">
          {/* Left - Flight Summary */}
          <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border/40 relative overflow-hidden">
            {/* Airline Logo Placeholder */}
            <div className="absolute -left-10 -bottom-10 opacity-5">
               <Plane className="w-48 h-48" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Badge variant={booking.status === 'cancelled' ? 'destructive' : booking.status === 'confirmed' ? 'default' : 'secondary'} className="mb-2">
                    {booking.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground font-medium">{booking.flight.airlineName} • {booking.flight.flightNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Booking Ref</p>
                  <p className="font-mono font-bold text-lg text-primary">{booking.bookingReference}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-4xl font-serif font-light text-foreground">{booking.flight.departure}</p>
                  <p className="text-sm text-muted-foreground mt-1">{format(new Date(booking.flight.departureTime), "HH:mm")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(booking.flight.departureTime), "MMM dd, yyyy")}</p>
                </div>
                
                <div className="flex-1 flex flex-col items-center px-4 hidden md:flex">
                   <p className="text-xs text-muted-foreground mb-2"><Clock className="inline h-3 w-3 mr-1" /> {Math.floor(booking.flight.durationMinutes / 60)}h {booking.flight.durationMinutes % 60}m</p>
                   <div className="w-full border-t border-dashed border-border relative">
                     <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary bg-card px-0.5" />
                   </div>
                </div>

                <div className="text-center md:text-right">
                  <p className="text-4xl font-serif font-light text-foreground">{booking.flight.arrival}</p>
                  <p className="text-sm text-muted-foreground mt-1">{format(new Date(booking.flight.arrivalTime), "HH:mm")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(booking.flight.arrivalTime), "MMM dd, yyyy")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Passenger & Actions */}
          <div className="p-6 md:w-72 bg-secondary/10 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Passenger</p>
                <p className="font-medium text-foreground">{booking.passengerName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Class</p>
                  <p className="font-medium text-foreground capitalize">{booking.cabinClass}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Seat</p>
                  <p className="font-medium text-primary text-xl">{booking.seatNumber}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center md:block space-y-0 md:space-y-2">
              <p className="text-xl font-bold text-foreground block md:mb-4">${booking.price}</p>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="w-full" disabled={booking.status === 'cancelled'}>
                  <Download className="h-4 w-4 mr-2" /> E-Ticket
                </Button>
                
                {booking.status === 'confirmed' && new Date(booking.flight.departureTime) > new Date() && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 border border-border"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Change Seat</DropdownMenuItem>
                      <DropdownMenuItem>Add Baggage</DropdownMenuItem>
                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <XCircle className="h-4 w-4 mr-2" /> Cancel Flight
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancel Booking</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to cancel your flight to {booking.flight.arrival}? This action cannot be undone. Refund policies apply.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedBookingToCancel(null)}>Keep Flight</Button>
                            <Button variant="destructive" onClick={() => { setSelectedBookingToCancel(booking.id); handleCancel(); }} disabled={cancelBooking.isPending}>
                              {cancelBooking.isPending ? "Cancelling..." : "Confirm Cancellation"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">My Journeys</h1>
            <p className="text-muted-foreground mt-1">Manage your upcoming flights and view past travel history.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search bookings..." 
              className="pl-9 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-card animate-pulse rounded-xl border border-border" />)}
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-6 bg-card border border-border p-1 h-12 w-full md:w-auto overflow-x-auto justify-start">
              <TabsTrigger value="upcoming" className="px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past" className="px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Past ({past.length})</TabsTrigger>
              <TabsTrigger value="cancelled" className="px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Cancelled ({cancelled.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4 outline-none">
              {upcoming.length > 0 ? (
                upcoming.map(booking => <BookingCard key={booking.id} booking={booking} />)
              ) : (
                <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground">No upcoming flights</h3>
                  <p className="text-muted-foreground">You don't have any upcoming journeys booked.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="space-y-4 outline-none">
              {past.length > 0 ? (
                past.map(booking => <BookingCard key={booking.id} booking={booking} />)
              ) : (
                <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">No past flights found.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4 outline-none">
              {cancelled.length > 0 ? (
                cancelled.map(booking => <BookingCard key={booking.id} booking={booking} />)
              ) : (
                <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">No cancelled flights found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
