import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  ArrowLeft,
  Clock,
  Plane,
  User,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetFlight,
  useGetFlightSeatMap,
  useCreateBooking,
  useGetMe,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Step = "seats" | "passenger" | "payment" | "confirmation";

type Seat = {
  id: number;
  seatNumber: string;
  status: "available" | "occupied" | "reserved";
  cabinClass: "first" | "business" | "premium_economy" | "economy";
};

export default function FlightDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const preferredCabin = searchParams.get("cabinClass") || "economy";

  const flightId = parseInt(id || "0", 10);

  const { data: user } = useGetMe();
  const { data: flight, isLoading: isLoadingFlight } = useGetFlight(flightId);
  const { data: seats } = useGetFlightSeatMap(flightId, {
    query: { enabled: !!flightId },
  });

  const createBooking = useCreateBooking();

  const [step, setStep] = useState<Step>("seats");
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [passengerInfo, setPassengerInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [bookingResult, setBookingResult] = useState<any>(null);

  const rows = useMemo(() => {
    if (!seats?.length) return [] as Seat[][];

    const grouped = new Map<number, Seat[]>();

    for (const seat of seats as Seat[]) {
      const rowNum = Number(seat.seatNumber.match(/^([0-9]+)/)?.[1] ?? 0);
      if (!grouped.has(rowNum)) grouped.set(rowNum, []);
      grouped.get(rowNum)!.push(seat);
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, rowSeats]) =>
        [...rowSeats].sort((a, b) =>
          a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true })
        )
      );
  }, [seats]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== "available") return;
    setSelectedSeat(seat.seatNumber);
  };

  const handleBook = async () => {
    if (!flight || !selectedSeat) return;

    try {
      const seatObj = (seats as Seat[] | undefined)?.find(
        (s) => s.seatNumber === selectedSeat
      );

      const booking = await createBooking.mutateAsync({
        data: {
          flightId: flight.id,
          seatNumber: selectedSeat,
          cabinClass: seatObj?.cabinClass || preferredCabin,
          passengerName: passengerInfo.name,
          passengerEmail: passengerInfo.email,
          passengerPhone: passengerInfo.phone,
        },
      });

      setBookingResult(booking);
      setStep("confirmation");
    } catch (err: any) {
      toast({
        title: "Booking Failed",
        description: err?.message || "There was an error processing your booking.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

  const selectedSeatObj = (seats as Seat[] | undefined)?.find(
    (s) => s.seatNumber === selectedSeat
  );
  const cabinMultiplier =
    selectedSeatObj?.cabinClass === "first"
      ? 3
      : selectedSeatObj?.cabinClass === "business"
      ? 2
      : selectedSeatObj?.cabinClass === "premium_economy"
      ? 1.5
      : 1;
  const price = flight ? flight.basePrice * cabinMultiplier : 0;

  const renderSeat = (seat?: Seat, key?: string) => {
    if (!seat) {
      return <div key={key} className="h-12 w-10" />;
    }

    const isSelected = selectedSeat === seat.seatNumber;
    const isAvail = seat.status === "available";
    const isFirst = seat.cabinClass === "first";
    const isBiz = seat.cabinClass === "business";

    return (
      <button
        key={seat.id}
        disabled={!isAvail}
        onClick={() => handleSeatClick(seat)}
        className={cn(
          "h-12 w-10 rounded-t-md rounded-b-sm border-2 transition-all flex items-center justify-center text-xs font-semibold relative overflow-hidden",
          !isAvail
            ? "bg-muted border-border opacity-50 cursor-not-allowed"
            : isSelected
            ? "bg-primary border-primary text-primary-foreground shadow-md scale-110 z-10"
            : isFirst
            ? "bg-purple-50 border-purple-200 text-purple-700 hover:border-purple-500"
            : isBiz
            ? "bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-500"
            : "bg-card border-border text-muted-foreground hover:border-primary"
        )}
      >
        {isSelected && <span className="absolute inset-0 bg-primary/20 animate-pulse" />}
        <span className="relative z-10">{seat.seatNumber}</span>
      </button>
    );
  };

  if (isLoadingFlight) {
    return (
      <AppLayout>
        <div className="p-8 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!flight) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">Flight not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-muted/20 min-h-screen pb-20">
        <div className="bg-primary text-primary-foreground pt-8 pb-16 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-sm font-medium hover:underline mb-6 text-primary-foreground/80"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to search
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2">
                  {flight.departure} to {flight.arrival}
                </h1>
                <div className="flex items-center gap-3 text-primary-foreground/80 flex-wrap">
                  <Plane className="h-5 w-5" />
                  <span className="font-medium text-lg">{flight.airlineName}</span>
                  <span>•</span>
                  <span>{flight.flightNumber || "FL"}</span>
                  <span>•</span>
                  <span>{format(new Date(flight.departureTime), "EEEE, MMM dd, yyyy")}</span>
                </div>
              </div>
              <div className="bg-primary-foreground/10 px-6 py-4 rounded-xl backdrop-blur-md border border-primary-foreground/20 text-center">
                <p className="text-sm uppercase tracking-wider text-primary-foreground/70 mb-1">
                  Total Duration
                </p>
                <p className="text-2xl font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" /> {formatDuration(flight.durationMinutes)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-8 relative z-10 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            {step !== "confirmation" && (
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex justify-between relative overflow-hidden">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border -z-0" />
                {[
                  { id: "seats", label: "Seat Selection" },
                  { id: "passenger", label: "Passenger Info" },
                  { id: "payment", label: "Confirmation" },
                ].map((s, i) => {
                  const isActive = step === s.id;
                  const isPast = ["seats", "passenger", "payment"].indexOf(step) > i;
                  return (
                    <div key={s.id} className="relative z-10 flex flex-col items-center bg-card px-2">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : isPast
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border bg-card text-muted-foreground"
                        )}
                      >
                        {isPast ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium mt-2",
                          isActive || isPast ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === "seats" && (
                <motion.div
                  key="seats"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-lg border-border">
                    <CardHeader>
                      <CardTitle className="font-serif text-2xl">Select your seat</CardTitle>
                      <CardDescription>Click a seat to reserve it for your journey.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <div className="w-full max-w-3xl bg-background border-2 border-border rounded-[3rem] rounded-b-md p-4 sm:p-6 md:p-8 relative shadow-inner overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-muted/30 rounded-b-full border-b border-border opacity-50" />

                        <div className="flex flex-wrap justify-center gap-4 mb-8 text-xs font-medium">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-purple-500/20 border border-purple-500 rounded" />
                            First
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500/20 border border-blue-500 rounded" />
                            Business
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-card border border-border rounded" />
                            Economy
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-muted border border-border opacity-50 rounded" />
                            Occupied
                          </div>
                        </div>

                        <div className="w-full overflow-x-auto pb-2">
                          <div className="min-w-fit space-y-4 mx-auto">
                            {rows.map((row) => {
                              const rowNum = row[0]?.seatNumber.match(/^([0-9]+)/)?.[1] ?? "";
                              const map = Object.fromEntries(
                                row.map((s) => [s.seatNumber.slice(-1), s])
                              ) as Record<string, Seat>;

                              return (
                                <div
                                  key={rowNum}
                                  className="grid grid-cols-[repeat(3,2.5rem)_1.75rem_repeat(3,2.5rem)] gap-2 items-center justify-center"
                                >
                                  {renderSeat(map["A"], `${rowNum}-A`) as any}
                                  {renderSeat(map["B"], `${rowNum}-B`) as any}
                                  {renderSeat(map["C"], `${rowNum}-C`) as any}

                                  <div className="text-center text-[10px] text-muted-foreground font-medium select-none">
                                    {rowNum}
                                  </div>

                                  {renderSeat(map["D"], `${rowNum}-D`) as any}
                                  {renderSeat(map["E"], `${rowNum}-E`) as any}
                                  {renderSeat(map["F"], `${rowNum}-F`) as any}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end w-full">
                        <Button
                          size="lg"
                          disabled={!selectedSeat}
                          onClick={() => setStep("passenger")}
                          className="w-full md:w-auto"
                        >
                          Continue to Passenger Info <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === "passenger" && (
                <motion.div
                  key="passenger"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-lg border-border">
                    <CardHeader>
                      <CardTitle className="font-serif text-2xl">Passenger Details</CardTitle>
                      <CardDescription>Enter the details for the person traveling.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Legal Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="As it appears on ID"
                              className="pl-9"
                              value={passengerInfo.name}
                              onChange={(e) =>
                                setPassengerInfo({ ...passengerInfo, name: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              placeholder="For ticket delivery"
                              value={passengerInfo.email}
                              onChange={(e) =>
                                setPassengerInfo({ ...passengerInfo, email: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                              type="tel"
                              placeholder="For flight updates"
                              value={passengerInfo.phone}
                              onChange={(e) =>
                                setPassengerInfo({ ...passengerInfo, phone: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between w-full pt-4">
                        <Button variant="ghost" onClick={() => setStep("seats")}>Back</Button>
                        <Button
                          size="lg"
                          disabled={!passengerInfo.name || !passengerInfo.email}
                          onClick={() => setStep("payment")}
                        >
                          Continue to Confirmation <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-lg border-border">
                    <CardHeader>
                      <CardTitle className="font-serif text-2xl">Confirm Booking</CardTitle>
                      <CardDescription>
                        No card details are needed here. Confirm the reservation to continue.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="rounded-xl border border-dashed border-border p-6 bg-muted/20 text-center space-y-2">
                        <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
                        <p className="font-medium">Payment step bypassed</p>
                        <p className="text-sm text-muted-foreground">
                          This flow now completes the booking directly and shows the success screen.
                        </p>
                      </div>

                      <div className="flex justify-between w-full pt-4">
                        <Button variant="ghost" onClick={() => setStep("passenger")}>Back</Button>
                        <Button
                          size="lg"
                          className="bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={handleBook}
                          disabled={createBooking.isPending}
                        >
                          {createBooking.isPending ? "Processing..." : `Confirm & Book $${Math.round(price * 1.15)}`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === "confirmation" && bookingResult && (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="bg-card shadow-2xl rounded-2xl overflow-hidden border border-border flex flex-col items-center">
                    <div className="bg-primary w-full py-12 px-6 flex flex-col items-center text-primary-foreground relative overflow-hidden">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                        className="h-20 w-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg z-10"
                      >
                        <CheckCircle2 className="h-10 w-10" />
                      </motion.div>
                      <h2 className="font-serif text-3xl font-bold mb-2 relative z-10 text-center">
                        Booking Confirmed!
                      </h2>
                      <p className="text-primary-foreground/80 text-center max-w-md relative z-10">
                        Your flight to {flight.arrival} is booked. A confirmation email has been sent to {passengerInfo.email}.
                      </p>
                    </div>

                    <div className="w-full max-w-md -mt-8 relative z-20 px-6 pb-12">
                      <div className="bg-background rounded-xl shadow-xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-dashed border-border/60 relative">
                          <div className="absolute -left-3 bottom-0 translate-y-1/2 w-6 h-6 bg-muted/20 rounded-full border-r border-border/60" />
                          <div className="absolute -right-3 bottom-0 translate-y-1/2 w-6 h-6 bg-muted/20 rounded-full border-l border-border/60" />

                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <p className="text-sm text-muted-foreground">Booking Ref</p>
                              <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                                {bookingResult.bookingReference}
                              </p>
                            </div>
                            <Plane className="h-8 w-8 text-muted/30 transform rotate-45" />
                          </div>

                          <div className="flex justify-between items-center mb-4 gap-4">
                            <div>
                              <p className="text-4xl font-light font-serif">
                                {flight.departure.substring(0, 3).toUpperCase()}
                              </p>
                              <p className="text-xs text-muted-foreground">{flight.departure}</p>
                            </div>
                            <div className="flex-1 px-4 flex flex-col items-center relative min-w-0">
                              <Plane className="h-5 w-5 text-primary mb-1" />
                              <div className="w-full border-t-2 border-dashed border-muted-foreground/30" />
                            </div>
                            <div className="text-right">
                              <p className="text-4xl font-light font-serif">
                                {flight.arrival.substring(0, 3).toUpperCase()}
                              </p>
                              <p className="text-xs text-muted-foreground">{flight.arrival}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-secondary/20">
                          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Passenger
                              </p>
                              <p className="font-semibold text-sm truncate">{bookingResult.passengerName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Date
                              </p>
                              <p className="font-semibold text-sm">
                                {format(new Date(flight.departureTime), "dd MMM yyyy")}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Flight
                              </p>
                              <p className="font-semibold text-sm">
                                {flight.airlineName} {flight.flightNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Seat
                              </p>
                              <p className="font-semibold text-xl text-primary">{bookingResult.seatNumber}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        <Button className="w-full h-12" asChild>
                          <Link href={`/app/bookings`}>View My Bookings</Link>
                        </Button>
                        <Button variant="outline" className="w-full h-12" asChild>
                          <Link href={`/app`}>Return Home</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {step !== "confirmation" && (
            <div className="md:w-80 flex-shrink-0">
              <Card className="sticky top-24 shadow-md border-border/60">
                <CardHeader className="bg-primary/5 pb-4 border-b border-border/40">
                  <CardTitle className="text-lg">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {flight.departure} to {flight.arrival}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(flight.departureTime), "MMM dd, yyyy")} •{" "}
                      {format(new Date(flight.departureTime), "HH:mm")}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        Base Price ({preferredCabin})
                      </span>
                      <span className="font-medium">${flight.basePrice}</span>
                    </div>
                    {selectedSeat && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Seat {selectedSeat} ({selectedSeatObj?.cabinClass})
                        </span>
                        <span className="font-medium">${Math.round(price)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes & Fees</span>
                      <span className="font-medium">${Math.round(price * 0.15)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-3xl font-bold text-primary">${Math.round(price * 1.15)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

