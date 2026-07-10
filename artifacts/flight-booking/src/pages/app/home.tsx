import { useState } from "react";
import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Search, ArrowRight, Plane, Calendar as CalendarIcon2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useGetMe, useGetCustomerBookings, useListWishlist } from "@workspace/api-client-react";

export default function AppHome() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const { data: bookings } = useGetCustomerBookings(user?.id ?? 0, { query: { enabled: !!user?.id } });
  const { data: wishlist } = useListWishlist();

  const upcomingBookings = bookings?.filter(b => b.status === "confirmed" && new Date(b.flight.departureTime) > new Date()) || [];

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<Date>();
  const [cabinClass, setCabinClass] = useState("economy");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.append("origin", origin);
    if (destination) params.append("destination", destination);
    if (date) params.append("date", format(date, "yyyy-MM-dd"));
    if (cabinClass) params.append("cabinClass", cabinClass);
    setLocation(`/app/search?${params.toString()}`);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Hero Section */}
        <section className="relative pt-12 pb-24 px-6 md:px-12 bg-primary overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80" 
              alt="Clouds" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/50 to-primary/95" />
          </div>
          
          <div className="relative z-10 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-4">
                Where to next, {user?.name?.split(' ')[0] || 'Traveler'}?
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl">
                Discover the world's most premium destinations. Your next extraordinary journey awaits.
              </p>
            </motion.div>

            {/* Search Widget */}
            <motion.Card 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Departure City or Airport" 
                          className="pl-9 h-12 bg-background border-border" 
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Destination" 
                          className="pl-9 h-12 bg-background border-border"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal h-12 bg-background border-border hover:bg-background/80",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "MMM dd, yyyy") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</label>
                      <Select value={cabinClass} onValueChange={setCabinClass}>
                        <SelectTrigger className="h-12 bg-background border-border">
                          <SelectValue placeholder="Cabin Class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="economy">Economy</SelectItem>
                          <SelectItem value="premium_economy">Premium Economy</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="first">First Class</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button type="submit" size="lg" className="h-12 px-8 w-full md:w-auto mt-4 md:mt-0 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Search className="mr-2 h-5 w-5" />
                    Search
                  </Button>
                </form>
              </CardContent>
            </motion.Card>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-12">
          
          {/* Upcoming Trips */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon2 className="h-6 w-6 text-primary" />
                Upcoming Journeys
              </h2>
              {upcomingBookings.length > 0 && (
                <Link href="/app/bookings" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            
            {upcomingBookings.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingBookings.slice(0, 3).map((booking, i) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow group border-border/60">
                      <div className="bg-primary/5 p-4 border-b border-border/40 flex justify-between items-center">
                        <span className="text-xs font-semibold tracking-wider uppercase text-primary">
                          {format(new Date(booking.flight.departureTime), "MMM dd, yyyy")}
                        </span>
                        <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {booking.bookingReference}
                        </span>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-center">
                            <p className="text-3xl font-light font-serif text-foreground">{booking.flight.departure}</p>
                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(booking.flight.departureTime), "HH:mm")}</p>
                          </div>
                          <div className="flex-1 px-4 flex items-center justify-center relative">
                            <div className="h-[2px] w-full bg-border absolute"></div>
                            <Plane className="h-5 w-5 text-primary bg-card z-10 px-1 transform rotate-90" />
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-light font-serif text-foreground">{booking.flight.arrival}</p>
                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(booking.flight.arrivalTime), "HH:mm")}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-6">
                          <div>
                            <p className="text-sm font-medium text-foreground">{booking.passengerName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{booking.cabinClass} • Seat {booking.seatNumber}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/app/bookings`}>Manage</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No upcoming flights</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Your itinerary is clear. It's the perfect time to start planning your next great adventure.
                </p>
                <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Find a Flight
                </Button>
              </div>
            )}
          </motion.div>

          {/* Wishlist Teaser */}
          {wishlist && wishlist.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-semibold text-foreground flex items-center gap-2">
                  <Heart className="h-6 w-6 text-accent" />
                  Saved to Wishlist
                </h2>
                <Link href="/app/wishlist" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {wishlist.slice(0, 3).map((item) => (
                  <Link key={item.id} href={`/app/flights/${item.flight.id}`}>
                    <Card className="hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-muted-foreground">{item.flight.airlineName}</span>
                          <span className="text-lg font-semibold text-foreground">${item.flight.basePrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-xl font-serif">
                          <span>{item.flight.departure}</span>
                          <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
                          <span>{item.flight.arrival}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                          {format(new Date(item.flight.departureTime), "MMM dd, yyyy")}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

        </section>
      </div>
    </AppLayout>
  );
}

// Importing here just for the component
import { Heart } from "lucide-react";
