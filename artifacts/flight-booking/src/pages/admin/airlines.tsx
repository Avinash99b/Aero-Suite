import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useListAirlines, useCreateAirline } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminAirlines() {
  const { data: airlines, isLoading } = useListAirlines();
  const createAirline = useCreateAirline();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", country: "", logoUrl: "" });

  const handleSave = async () => {
    if (!formData.name || !formData.country) return;
    await createAirline.mutateAsync({ data: formData });
    setIsAddOpen(false);
    queryClient.invalidateQueries({ queryKey: ["airlines"] });
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Airlines</h1>
            <p className="text-muted-foreground">Manage partner airlines.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Airline</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Airline</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Airline Name</Label><Input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
                <div className="space-y-2"><Label>Country</Label><Input value={formData.country} onChange={e=>setFormData({...formData, country: e.target.value})} /></div>
                <div className="space-y-2"><Label>Logo URL</Label><Input value={formData.logoUrl} onChange={e=>setFormData({...formData, logoUrl: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={createAirline.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            [1,2,3,4].map(i => <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />)
          ) : airlines?.map(airline => (
            <Card key={airline.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  {airline.logoUrl ? (
                    <img src={airline.logoUrl} alt={airline.name} className="w-full h-full object-cover" />
                  ) : (
                    <Plane className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-semibold text-lg">{airline.name}</h3>
                <p className="text-sm text-muted-foreground">{airline.country}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
