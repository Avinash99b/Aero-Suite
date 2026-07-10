import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Search, ArrowRight, Plane, Filter, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useListFlights } from "@workspace/api-client-react";

export default function SearchFlights() {
  const [location, setLocation] = useLocation();
  
  // Parse search params
  const searchParams = new URLSearchParams(window.location.search);
  const initialOrigin = searchParams.get("origin") || "";
  const initialDest = searchParams.get("destination") || "";
  const initialDateStr = searchParams.get("date");
  const initialCabin = searchParams.get("cabinClass") || "economy";

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDest);
  const [date, setDate] = useState<Date | undefined>(initialDateStr ? new Date(initialDateStr) : undefined);
  const [cabinClass, setCabinClass] = useState(initialCabin);
  const [minSeats, setMinSeats] = useState(1);

  // Active query parameters (what was actually submitted)
  const [queryParams, setQueryParams] = useState({
    origin: initialOrigin,
    destination: initialDest,
    date: initialDateStr || "",
    cabinClass: initialCabin,
  });

  const { data: flights, isLoading } = useListFlights(
    { 
      ...queryParams, 
      status: "scheduled", 
      minSeats 
    }, 
    { 
      query: { 
        enabled: true,
        queryKey: ["flights", queryParams, minSeats] 
      } 
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = date ? format(date, "yyyy-MM-dd") : "";
    setQueryParams({
      origin,
      destination,
      date: dateStr,
      cabinClass
    });
    
    // Update URL without triggering full reload
    const params = new URLSearchParams();
    if (origin) params.append("origin", origin);
    if (destination) params.append("destination", destination);
    if (dateStr) params.append("date", dateStr);
    if (cabinClass) params.append("cabinClass", cabinClass);
    setLocation(`/app/search?${params.toString()}`);
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-muted/20 min-h-screen">
        
        {/* Sticky Search Header */}
        <div className="bg-card border-b border-border shadow-sm sticky top-0 z-10 pt-4 pb-4 px-6 md:px-12 md:top-0">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-4">Search Flights</h1>
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 items-end">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Origin" 
                    className="pl-9 h-11" 
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Destination" 
                    className="pl-9 h-11"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "MMM dd, yyyy") : <span>Date</span>}
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
                <div>
                  <Select value={cabinClass} onValueChange={setCabinClass}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Cabin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="premium_economy">Premium Economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    min={1} 
                    max={9} 
                    className="pl-9 h-11"
                    value={minSeats}
                    onChange={(e) => setMinSeats(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <Button type="submit" className="h-11 px-8 w-full lg:w-auto">
                <Search className="mr-2 h-4 w-4" /> Update
              </Button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 py-8 px-6 md:px-12 max-w-7xl mx-auto w-full">
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card h-32 rounded-xl border border-border animate-pulse p-6">
                   <div className="h-4 bg-muted w-1/4 mb-4 rounded"></div>
                   <div className="flex justify-between">
                     <div className="h-8 bg-muted w-1/5 rounded"></div>
                     <div className="h-2 bg-muted w-1/3 rounded mt-3"></div>
                     <div className="h-8 bg-muted w-1/5 rounded"></div>
                   </div>
                </div>
              ))}
            </div>
          ) : flights && flights.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-foreground">{flights.length} flights found</h2>
                <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
              </div>
              <AnimatePresence>
                {flights.map((flight, i) => (
                  <motion.div
                    key={flight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow group border-border/60">
                      <CardContent className="p-0 flex flex-col md:flex-row">
                        {/* Flight Info */}
                        <div className="p-6 flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                            <Plane className="h-4 w-4" />
                            <span className="font-medium text-foreground">{flight.airlineName}</span>
                            <span>•</span>
                            <span>{flight.flightNumber || 'FL'}</span>
                            <span>•</span>
                            <span className="capitalize">{flight.aircraft}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-3xl font-serif font-semibold text-foreground">{format(new Date(flight.departureTime), "HH:mm")}</p>
                              <p className="text-lg text-muted-foreground font-light">{flight.departure}</p>
                            </div>
                            
                            <div className="flex-1 px-8 flex flex-col items-center relative">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 bg-background px-2 rounded-full border border-border">
                                <Clock className="h-3 w-3" />
                                {formatDuration(flight.durationMinutes)}
                              </div>
                              <div className="h-[2px] w-full bg-border absolute top-1/2 mt-1"></div>
                              <ArrowRight className="h-5 w-5 text-muted-foreground bg-card z-10 px-1 absolute top-1/2 -mt-1" />
                            </div>
                            
                            <div className="text-right">
                              <p className="text-3xl font-serif font-semibold text-foreground">{format(new Date(flight.arrivalTime), "HH:mm")}</p>
                              <p className="text-lg text-muted-foreground font-light">{flight.arrival}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Price & Action */}
                        <div className="bg-primary/5 p-6 md:w-64 flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-border/40">
                          <div className="text-left md:text-right">
                            <p className="text-sm text-muted-foreground mb-1">from</p>
                            <p className="text-3xl font-bold text-primary">${flight.basePrice}</p>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">{cabinClass}</p>
                          </div>
                          <Button 
                            className="w-auto md:w-full" 
                            size="lg"
                            onClick={() => setLocation(`/app/flights/${flight.id}?cabinClass=${cabinClass}`)}
                          >
                            Select
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
             <div className="bg-card border border-border rounded-xl p-12 text-center h-[50vh] flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-serif font-medium text-foreground mb-2">No flights found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any flights matching your criteria. Try adjusting your dates, origin, or destination.
                </p>
              </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
