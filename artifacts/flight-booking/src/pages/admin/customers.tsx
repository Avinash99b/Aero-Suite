import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useListCustomers } from "@workspace/api-client-react";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useListCustomers({ search });

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage user accounts and roles.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : customers?.length ? (
                  customers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={customer.avatarUrl || undefined} />
                          <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{customer.name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{customer.email}</div>
                        <div className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'}>{customer.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(customer.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <a href="#" className="text-sm text-primary hover:underline">View Bookings</a>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No customers found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
