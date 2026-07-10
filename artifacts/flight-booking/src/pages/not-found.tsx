import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-8xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-medium text-foreground mb-4">Flight Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for has departed or never existed. Please check your gate and try again.
        </p>
        <Link href="/" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          Return to Terminal
        </Link>
      </div>
    </div>
  );
}
