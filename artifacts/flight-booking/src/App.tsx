import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import HomeRedirect from '@/pages/home-redirect';
import LandingPage from '@/pages/landing';
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
import { useGetMe } from '@workspace/api-client-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(220 60% 16%)",
    colorForeground: "hsl(220 30% 15%)",
    colorMutedForeground: "hsl(220 15% 45%)",
    colorDanger: "hsl(0 70% 45%)",
    colorBackground: "hsl(45 40% 98%)",
    colorInput: "hsl(45 20% 88%)",
    colorInputForeground: "hsl(220 30% 15%)",
    colorNeutral: "hsl(45 20% 88%)",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-2xl font-semibold text-primary",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "font-medium",
    formFieldLabel: "font-medium text-foreground",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-destructive-foreground",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border-border hover:bg-accent/10 transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11",
    formFieldInput: "bg-background border-border h-11 px-3 py-2 rounded-md focus:ring-2 focus:ring-ring focus:border-ring",
    footerAction: "bg-muted/30 py-6 border-t border-border/50",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20 text-destructive",
    otpCodeFieldInput: "border-border focus:ring-ring",
    formFieldRow: "mb-4",
    main: "p-8",
  },
};

function SignInPage() {
  // 0 = fully transparent, 1 = fully opaque
  const formBackgroundOpacity = 0.18;

  return (
    <div
      className="relative flex min-h-[100dvh] items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80')",
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

      {/* Sign In Form */}
      <div className="relative z-10 w-full max-w-md">
        <div
          className="rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${formBackgroundOpacity})`,
          }}
        >
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
          />
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  // 0 = fully transparent, 1 = fully opaque
  const formBackgroundOpacity = 0.18;

  return (
    <div
      className="relative flex min-h-[100dvh] items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80')",
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

      {/* Sign Up Form */}
      <div className="relative z-10 w-full max-w-md">
        <div
          className="rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${formBackgroundOpacity})`,
          }}
        >
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
          />
        </div>
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

// Wrapper to ensure our local database profile (Customer) is provisioned
function UserSyncGuard({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { data: customer, isLoading } = useGetMe({ query: { retry: false } });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!customer) {
    return <div className="min-h-screen flex items-center justify-center text-destructive">Error loading user profile.</div>;
  }

  if (adminOnly && customer.role !== 'admin') {
    return <Redirect to="/app" />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  return (
    <>
      <Show when="signed-in">
        <UserSyncGuard adminOnly={adminOnly}>
          <Component />
        </UserSyncGuard>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to SkyReserve",
            subtitle: "Sign in to manage your travels",
          },
        },
        signUp: {
          start: {
            title: "Join SkyReserve",
            subtitle: "Elevate your travel experience",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
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
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
