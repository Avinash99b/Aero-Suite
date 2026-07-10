import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMe, useUpdateMe, useListPassengers, useCreatePassenger, useDeletePassenger } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Users, CreditCard, Save, Plus, Trash2 } from "lucide-react";

export default function Profile() {
  const { data: user } = useGetMe();
  const updateMe = useUpdateMe();
  const { data: passengers, refetch: refetchPassengers } = useListPassengers({ query: { enabled: !!user } });
  const createPassenger = useCreatePassenger();
  const deletePassenger = useDeletePassenger();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    darkModePref: user?.darkModePref ?? false,
    notifyEmail: user?.notifyEmail ?? true,
    notifySms: user?.notifySms ?? false,
  });

  const [newPassenger, setNewPassenger] = useState({
    fullName: "",
    email: "",
    phone: "",
    passportNumber: ""
  });
  const [showAddPassenger, setShowAddPassenger] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await updateMe.mutateAsync({ data: profileForm });
      toast({ title: "Profile updated", description: "Your preferences have been saved." });
      // Apply dark mode immediately if needed
      if (profileForm.darkModePref) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAddPassenger = async () => {
    try {
      await createPassenger.mutateAsync({ data: newPassenger });
      toast({ title: "Passenger added", description: "Saved passenger profile successfully." });
      setNewPassenger({ fullName: "", email: "", phone: "", passportNumber: "" });
      setShowAddPassenger(false);
      refetchPassengers();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeletePassenger = async (id: number) => {
    try {
      await deletePassenger.mutateAsync({ id });
      toast({ title: "Passenger removed" });
      refetchPassengers();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="flex items-center gap-6 mb-12">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">{user.name}</h1>
            <p className="text-muted-foreground mt-1">{user.email}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent uppercase tracking-wider">
              {user.role} Account
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-8 bg-transparent border-b border-border w-full justify-start h-auto p-0 rounded-none overflow-x-auto flex-nowrap">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-medium">
              <User className="h-4 w-4 mr-2" /> General
            </TabsTrigger>
            <TabsTrigger value="passengers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-medium">
              <Users className="h-4 w-4 mr-2" /> Saved Passengers
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-medium">
              <Settings className="h-4 w-4 mr-2" /> Preferences
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      value={profileForm.name} 
                      onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={user.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      value={profileForm.phone} 
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={updateMe.isPending}>
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passengers">
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Saved Passengers</CardTitle>
                  <CardDescription>Quickly book flights for your family and friends.</CardDescription>
                </div>
                <Button onClick={() => setShowAddPassenger(!showAddPassenger)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              </CardHeader>
              <CardContent>
                {showAddPassenger && (
                  <div className="bg-muted/30 p-6 rounded-xl border border-border mb-6 space-y-4">
                    <h4 className="font-medium">New Passenger</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Full Name</Label><Input value={newPassenger.fullName} onChange={e=>setNewPassenger({...newPassenger, fullName: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Email</Label><Input value={newPassenger.email} onChange={e=>setNewPassenger({...newPassenger, email: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={newPassenger.phone} onChange={e=>setNewPassenger({...newPassenger, phone: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Passport Number</Label><Input value={newPassenger.passportNumber} onChange={e=>setNewPassenger({...newPassenger, passportNumber: e.target.value})} /></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" onClick={() => setShowAddPassenger(false)}>Cancel</Button>
                      <Button onClick={handleAddPassenger} disabled={createPassenger.isPending || !newPassenger.fullName}>Save Passenger</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {passengers?.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 border border-border rounded-lg bg-card">
                      <div>
                        <p className="font-medium text-foreground">{p.fullName}</p>
                        <p className="text-sm text-muted-foreground">{p.email} • {p.phone}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeletePassenger(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {passengers?.length === 0 && !showAddPassenger && (
                     <p className="text-center text-muted-foreground py-8">No saved passengers.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>Manage your display and notification settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Appearance</h3>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Use dark theme for the application interface.</p>
                    </div>
                    <Switch 
                      checked={profileForm.darkModePref} 
                      onCheckedChange={(checked) => setProfileForm({...profileForm, darkModePref: checked})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Notifications</h3>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg border-b-0 rounded-b-none">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive booking confirmations and flight updates via email.</p>
                    </div>
                    <Switch 
                      checked={profileForm.notifyEmail} 
                      onCheckedChange={(checked) => setProfileForm({...profileForm, notifyEmail: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg rounded-t-none -mt-4">
                    <div>
                      <p className="font-medium text-foreground">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive urgent flight delay or gate change alerts via SMS.</p>
                    </div>
                    <Switch 
                      checked={profileForm.notifySms} 
                      onCheckedChange={(checked) => setProfileForm({...profileForm, notifySms: checked})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={updateMe.isPending}>
                    <Save className="h-4 w-4 mr-2" /> Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
}
