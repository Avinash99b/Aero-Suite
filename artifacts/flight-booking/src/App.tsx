import { Switch, Route, Redirect, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

import HomeRedirect from '@/pages/home-redirect';
import LandingPage from '@/pages/landing';
import SignInPage from '@/pages/sign-in';
import SignUpPage from '@/pages/sign-up';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';
import AppHome from '@/pages/app/home';
import SearchFlights from '@/pages/app/search';
import FlightDetail from '@/pages/app/flight-detail';
import Bookings from '@/pages/app/bookings';
import Wishlist from '@/pages/app/wishlist';
import Notifications from '@/pages/app/notifications';
import Profile from '@/pages/app/profile';

import AdminDashboard from '@/pages/admin/dashboard';
import AdminFlights from '@/pages/admin/flights';
import AdminAirlines from '@/pages/admin/airlines';
import AdminCustomers from '@/pages/admin/customers';
import AdminBookings from '@/pages/admin/bookings';
import AdminDatabase from '@/pages/admin/database';

import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Redirect to="/app" />;
  }

  return <Component />;
}

function GuestRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/app" />;
  }

  return <Component />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/sign-in"><GuestRoute component={SignInPage} /></Route>
      <Route path="/sign-up"><GuestRoute component={SignUpPage} /></Route>
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      <Route path="/app"><ProtectedRoute component={AppHome} /></Route>
      <Route path="/app/search"><ProtectedRoute component={SearchFlights} /></Route>
      <Route path="/app/flights/:id"><ProtectedRoute component={FlightDetail} /></Route>
      <Route path="/app/bookings"><ProtectedRoute component={Bookings} /></Route>
      <Route path="/app/wishlist"><ProtectedRoute component={Wishlist} /></Route>
      <Route path="/app/notifications"><ProtectedRoute component={Notifications} /></Route>
      <Route path="/app/profile"><ProtectedRoute component={Profile} /></Route>

      <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>
      <Route path="/admin/flights"><ProtectedRoute component={AdminFlights} adminOnly /></Route>
      <Route path="/admin/airlines"><ProtectedRoute component={AdminAirlines} adminOnly /></Route>
      <Route path="/admin/customers"><ProtectedRoute component={AdminCustomers} adminOnly /></Route>
      <Route path="/admin/bookings"><ProtectedRoute component={AdminBookings} adminOnly /></Route>
      <Route path="/admin/database"><ProtectedRoute component={AdminDatabase} adminOnly /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}
