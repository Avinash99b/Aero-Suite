import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Plane, Edit, Trash2 } from "lucide-react";
import { useListFlights, useCreateFlight, useUpdateFlight, useDeleteFlight, useListAirlines, getListFlightsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminFlights() {
  const [search, setSearch] = useState("");
  const { data: flights, isLoading } = useListFlights();
  const { data: airlines } = useListAirlines();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createFlight = useCreateFlight();
  const updateFlight = useUpdateFlight();
  const deleteFlight = useDeleteFlight();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    airlineId: "",
    flightNumber: "",
    departure: "",
    arrival: "",
    departureTime: new Date().toISOString().slice(0,16),
    arrivalTime: new Date().toISOString().slice(0,16),
    status: "scheduled",
    aircraft: "Boeing 777",
    totalSeats: 200,
    basePrice: 500
  });

  const handleSave = async () => {
    try {
      await createFlight.mutateAsync({
        data: {
          ...formData,
          airlineId: parseInt(formData.airlineId),
          totalSeats: parseInt(formData.totalSeats),
          basePrice: parseInt(formData.basePrice),
          departureTime: new Date(formData.departureTime).toISOString(),
          arrivalTime: new Date(formData.arrivalTime).toISOString()
        }
      });
      toast({ title: "Success", description: "Flight created successfully" });
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: getListFlightsQueryKey() });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure?")) return;
    try {
      await deleteFlight.mutateAsync({ id });
      toast({ title: "Deleted", description: "Flight deleted" });
      queryClient.invalidateQueries({ queryKey: getListFlightsQueryKey() });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filteredFlights = flights?.filter(f => 
    f.flightNumber?.toLowerCase().includes(search.toLowerCase()) ||
    f.departure.toLowerCase().includes(search.toLowerCase()) ||
    f.arrival.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Flights Management</h1>
            <p className="text-muted-foreground">Manage schedules, routes, and statuses.</p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search routes..." 
                className="pl-9 bg-card"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" /> New Flight</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Flight</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Airline</Label>
                    <Select value={formData.airlineId} onValueChange={v => setFormData({...formData, airlineId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select Airline" /></SelectTrigger>
                      <SelectContent>
                        {airlines?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Flight Number</Label>
                    <Input value={formData.flightNumber} onChange={e => setFormData({...formData, flightNumber: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Origin (Code)</Label>
                    <Input value={formData.departure} onChange={e => setFormData({...formData, departure: e.target.value})} placeholder="JFK" />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination (Code)</Label>
                    <Input value={formData.arrival} onChange={e => setFormData({...formData, arrival: e.target.value})} placeholder="LHR" />
                  </div>
                  <div className="space-y-2">
                    <Label>Departure Time</Label>
                    <Input type="datetime-local" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Arrival Time</Label>
                    <Input type="datetime-local" value={formData.arrivalTime} onChange={e => setFormData({...formData, arrivalTime: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Aircraft</Label>
                    <Input value={formData.aircraft} onChange={e => setFormData({...formData, aircraft: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price ($)</Label>
                    <Input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Seats</Label>
                    <Input type="number" value={formData.totalSeats} onChange={e => setFormData({...formData, totalSeats: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={createFlight.isPending}>Save Flight</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Flight</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : filteredFlights?.length ? (
                  filteredFlights.map(flight => (
                    <TableRow key={flight.id} className="hover:bg-muted/10">
                      <TableCell>
                        <div className="font-medium text-foreground">{flight.airlineName}</div>
                        <div className="text-xs text-muted-foreground">{flight.flightNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          {flight.departure} <Plane className="h-3 w-3 text-muted-foreground rotate-90" /> {flight.arrival}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{format(new Date(flight.departureTime), "MMM dd, HH:mm")}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          flight.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          flight.status === 'delayed' ? 'bg-orange-100 text-orange-700' :
                          flight.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {flight.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{flight.availableSeats} / {flight.totalSeats}</div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1 max-w-[80px]">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${((flight.totalSeats - flight.availableSeats)/flight.totalSeats)*100}%` }}></div>
                        </div>
                      </TableCell>
                      <TableCell>${flight.basePrice}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(flight.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No flights found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
