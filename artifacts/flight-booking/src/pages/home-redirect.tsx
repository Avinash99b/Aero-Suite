import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./landing";

export default function HomeRedirect() {
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

  return <LandingPage />;
}
