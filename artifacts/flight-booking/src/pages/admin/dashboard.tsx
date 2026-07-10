import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummary, useGetActivityFeed } from "@workspace/api-client-react";
import { Users, PlaneTakeoff, Ticket, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: activities } = useGetActivityFeed();

  const StatCard = ({ title, value, icon: Icon, description, trend }: any) => (
    <Card className="border-border/50 shadow-sm bg-card">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground">SkyReserve global operations at a glance.</p>
        </div>

        {isLoading || !summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card animate-pulse rounded-xl border border-border" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Revenue" value={`$${(summary.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} />
              <StatCard title="Total Bookings" value={summary.totalBookings} icon={Ticket} />
              <StatCard title="Active Customers" value={summary.totalCustomers} icon={Users} />
              <StatCard title="Total Flights" value={summary.totalFlights} icon={PlaneTakeoff} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Flight Status */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg font-serif">Operational Status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-sm text-muted-foreground mb-1">Upcoming</p>
                        <p className="text-2xl font-bold text-primary">{summary.upcomingFlights}</p>
                      </div>
                      <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/10">
                        <p className="text-sm text-muted-foreground mb-1">Delayed</p>
                        <p className="text-2xl font-bold text-orange-600">{summary.delayedFlights}</p>
                      </div>
                      <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10">
                        <p className="text-sm text-muted-foreground mb-1">Cancelled</p>
                        <p className="text-2xl font-bold text-destructive">{summary.cancelledFlights}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Revenue chart placeholder - actual implementation depends on chart library, usually Recharts */}
                <Card className="border-border/50 shadow-sm h-80 flex items-center justify-center bg-card">
                   <p className="text-muted-foreground">Revenue Analytics Chart</p>
                </Card>
              </div>

              {/* Right Column - Live Activity */}
              <Card className="border-border/50 shadow-sm flex flex-col h-[500px]">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Activity className="h-5 w-5 text-accent" /> Live Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  <div className="divide-y divide-border/50">
                    {activities?.map((activity) => (
                      <div key={activity.id} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                            activity.type === 'booking' ? 'bg-green-500' : 
                            activity.type === 'cancellation' ? 'bg-destructive' : 'bg-primary'
                          }`} />
                          <div>
                            <p className="text-sm text-foreground">{activity.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!activities?.length && (
                      <div className="p-8 text-center text-muted-foreground text-sm">No recent activity.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
