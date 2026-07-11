import { Link, useLocation } from "wouter";
import { Plane, Home, Search, BookOpen, Heart, Bell, User, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    setLocation("/");
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/app" },
    { icon: Search, label: "Search Flights", href: "/app/search" },
    { icon: BookOpen, label: "My Bookings", href: "/app/bookings" },
    { icon: Heart, label: "Wishlist", href: "/app/wishlist" },
    { icon: Bell, label: "Notifications", href: "/app/notifications" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card shadow-sm z-10 sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/app" className="flex items-center gap-2 mb-8">
            <Plane className="h-8 w-8 text-primary" />
            <span className="font-serif text-2xl font-bold text-primary tracking-tight">SkyReserve</span>
          </Link>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  location === item.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-secondary transition-colors text-left">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/profile" className="cursor-pointer flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  Profile & Settings
                </Link>
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer flex items-center w-full">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-20">
        <Link href="/app" className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-bold text-primary">SkyReserve</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link href="/app/profile">Profile</Link></DropdownMenuItem>
            {user?.role === 'admin' && <DropdownMenuItem asChild><Link href="/admin">Admin</Link></DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-card border-t border-border z-20 pb-safe">
        <div className="flex justify-around p-2">
          {[
            { icon: Home, href: "/app" },
            { icon: Search, href: "/app/search" },
            { icon: BookOpen, href: "/app/bookings" },
            { icon: Bell, href: "/app/notifications" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-3 rounded-full transition-colors flex items-center justify-center",
                location === item.href ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
