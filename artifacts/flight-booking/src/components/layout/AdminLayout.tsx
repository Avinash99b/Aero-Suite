import { Link, useLocation } from "wouter";
import { Plane, LayoutDashboard, PlaneTakeoff, Users, FileText, Database, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    setLocation("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: PlaneTakeoff, label: "Flights", href: "/admin/flights" },
    { icon: Plane, label: "Airlines", href: "/admin/airlines" },
    { icon: Users, label: "Customers", href: "/admin/customers" },
    { icon: FileText, label: "Bookings", href: "/admin/bookings" },
    { icon: Database, label: "Database", href: "/admin/database" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col bg-[#1A2234] text-white shadow-xl z-10 sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2 mb-6">
            <Plane className="h-8 w-8 text-accent" />
            <span className="font-serif text-2xl font-bold tracking-tight text-white">SkyReserve<span className="text-xs align-top text-accent ml-1 uppercase tracking-widest">Admin</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-semibold text-accent">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/50">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 mt-2 px-2">Management</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location === item.href
                  ? "bg-accent/20 text-accent"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <Link href="/app" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Exit to App
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full bg-muted/30">
        {children}
      </main>
    </div>
  );
}
