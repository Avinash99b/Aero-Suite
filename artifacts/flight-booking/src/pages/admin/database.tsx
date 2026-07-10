import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, Zap, Table as TableIcon, Code2, Play } from "lucide-react";
import { 
  useListTriggerLogs, 
  useListProcedures, 
  useExecuteProcedure, 
  useListQueryDefinitions,
  useExecuteQuery,
  useGetDailyFlightScheduleView,
  useGetConfirmedBookingsView
} from "@workspace/api-client-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function AdminDatabase() {
  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" /> Database Control Room
          </h1>
          <p className="text-muted-foreground mt-1">Direct access to triggers, procedures, views, and complex queries.</p>
        </div>

        <Tabs defaultValue="triggers" className="w-full">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="triggers"><Zap className="h-4 w-4 mr-2" /> Triggers</TabsTrigger>
            <TabsTrigger value="procedures"><Code2 className="h-4 w-4 mr-2" /> Stored Procedures</TabsTrigger>
            <TabsTrigger value="views"><TableIcon className="h-4 w-4 mr-2" /> Views</TabsTrigger>
            <TabsTrigger value="queries"><Database className="h-4 w-4 mr-2" /> Query Explorer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="triggers" className="space-y-6 outline-none">
            <TriggerTab />
          </TabsContent>
          
          <TabsContent value="procedures" className="outline-none">
            <ProceduresTab />
          </TabsContent>

          <TabsContent value="views" className="outline-none">
            <ViewsTab />
          </TabsContent>

          <TabsContent value="queries" className="outline-none">
            <QueriesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function TriggerTab() {
  const { data: logs } = useListTriggerLogs();
  
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="space-y-4 md:col-span-1">
        <Card className="border-border">
          <CardHeader className="bg-primary/5 pb-4">
             <CardTitle className="text-base font-semibold">Seat Availability Trigger</CardTitle>
             <CardDescription>Prevents booking if requested seats exceed available seats on flight.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="bg-primary/5 pb-4">
             <CardTitle className="text-base font-semibold">Booking Status Notifier</CardTitle>
             <CardDescription>Automatically generates a Notification record when a booking status changes.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="bg-primary/5 pb-4">
             <CardTitle className="text-base font-semibold">Flight Schedule Logger</CardTitle>
             <CardDescription>Logs changes to departure/arrival times to ActivityEvent table.</CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <Card className="md:col-span-2 border-border flex flex-col h-[600px]">
        <CardHeader className="border-b border-border/50">
          <CardTitle>Live Trigger Execution Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto flex-1 bg-black text-green-400 font-mono text-sm">
          <div className="p-4 space-y-2">
            {logs?.map(log => (
              <div key={log.id} className="border-b border-white/10 pb-2">
                <span className="text-white/50">[{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}]</span> 
                <span className="text-blue-400 ml-2">{log.triggerName}:</span> 
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
            {!logs?.length && <div className="text-white/50 italic">Awaiting trigger events...</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProceduresTab() {
  const { data: procs } = useListProcedures();
  const execute = useExecuteProcedure();
  const [params, setParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  const handleRun = async (name: string, pList: string[]) => {
    try {
      const payload: any = {};
      pList.forEach(p => {
        if (params[`${name}_${p}`]) {
          payload[p] = p.endsWith('Id') ? parseInt(params[`${name}_${p}`]) : params[`${name}_${p}`];
        }
      });
      const res = await execute.mutateAsync({ name, data: payload });
      setResult(res);
    } catch (e: any) {
      setResult({ success: false, output: e.message });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        {procs?.map(proc => (
          <Card key={proc.name} className="border-border">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-mono text-primary">{proc.name}()</CardTitle>
              <CardDescription>{proc.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {proc.params.map(p => (
                <div key={p} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{p}</label>
                  <Input 
                    value={params[`${proc.name}_${p}`] || ''} 
                    onChange={e => setParams({...params, [`${proc.name}_${p}`]: e.target.value})}
                    placeholder={`Enter ${p}`}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
              <Button onClick={() => handleRun(proc.name, proc.params)} disabled={execute.isPending} className="w-full">
                <Play className="h-4 w-4 mr-2" /> Execute Procedure
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <Card className="h-full border-border sticky top-6">
          <CardHeader>
            <CardTitle>Execution Result</CardTitle>
          </CardHeader>
          <CardContent>
             {result ? (
               <div className={`p-4 rounded-md border font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[500px] ${result.success ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                 {result.output}
               </div>
             ) : (
               <div className="text-center py-20 text-muted-foreground italic border border-dashed rounded-md bg-muted/10">
                 Run a procedure to see output here.
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ViewsTab() {
  const { data: sched } = useGetDailyFlightScheduleView();
  const { data: conf } = useGetConfirmedBookingsView();

  return (
    <div className="space-y-8">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-mono text-primary">vw_daily_flight_schedule</CardTitle>
          <CardDescription>A joined view of flights, airlines, and status for today's schedule.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-3">Flight</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Departure</th>
                <th className="px-6 py-3">Arrival</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sched?.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-6 py-3 font-medium">{row.airlineName} {row.flightNumber}</td>
                  <td className="px-6 py-3">{row.departure} → {row.arrival}</td>
                  <td className="px-6 py-3">{format(new Date(row.departureTime), "HH:mm")}</td>
                  <td className="px-6 py-3">{format(new Date(row.arrivalTime), "HH:mm")}</td>
                  <td className="px-6 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-mono text-primary">vw_confirmed_bookings</CardTitle>
          <CardDescription>Denormalized view joining Customer, Booking, and Flight for quick reporting.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Seat</th>
                <th className="px-6 py-3">Booked On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {conf?.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-6 py-3 font-medium">{row.customerName}</td>
                  <td className="px-6 py-3 text-muted-foreground">{row.email}</td>
                  <td className="px-6 py-3">{row.departure} → {row.arrival}</td>
                  <td className="px-6 py-3">{row.seatNumber}</td>
                  <td className="px-6 py-3">{format(new Date(row.bookingDate), "MMM dd")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function QueriesTab() {
  const { data: defs } = useListQueryDefinitions();
  const execute = useExecuteQuery();
  const [result, setResult] = useState<any>(null);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const handleRun = async (id: string) => {
    setActiveQuery(id);
    try {
      const res = await execute.mutateAsync({ id });
      setResult(res);
    } catch (e: any) {
      setResult({ error: e.message });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        {defs?.map((q: any) => (
          <Card key={q.id} className={`border-border cursor-pointer hover:border-primary transition-colors ${activeQuery === q.id ? 'border-primary shadow-md' : ''}`} onClick={() => handleRun(q.id)}>
            <CardContent className="p-4">
              <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">{q.category}</div>
              <h3 className="font-medium text-foreground mb-2">{q.label}</h3>
              <p className="text-xs text-muted-foreground">{q.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="md:col-span-2 space-y-4">
        {activeQuery && defs && (
          <Card className="border-border bg-slate-950 text-slate-300">
            <CardContent className="p-4 font-mono text-sm overflow-x-auto">
              <pre>{defs.find((d:any)=>d.id === activeQuery)?.sql}</pre>
            </CardContent>
          </Card>
        )}

        <Card className="border-border min-h-[400px]">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {execute.isPending ? (
              <div className="p-8 text-center text-muted-foreground">Running query...</div>
            ) : result?.error ? (
              <div className="p-4 m-4 bg-destructive/10 text-destructive rounded border border-destructive/20 font-mono text-sm">
                {result.error}
              </div>
            ) : result?.rows ? (
              <div>
                <div className="px-6 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground">
                  Returned {result.rowCount} rows in {result.executionTimeMs}ms
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/10 text-muted-foreground">
                    <tr>
                      {result.columns.map((c: string) => <th key={c} className="px-4 py-2 border-b border-border">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.rows.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/5">
                        {result.columns.map((c: string) => <td key={`${i}-${c}`} className="px-4 py-2">{String(row[c] ?? 'NULL')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center text-muted-foreground italic border border-dashed rounded-md m-4 bg-muted/10">
                Select a query to execute
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
