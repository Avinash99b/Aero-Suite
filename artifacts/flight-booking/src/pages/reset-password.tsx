import { useState } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plane, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthBackdrop() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden bg-[#0a1628] bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-[#0a1628]/70" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/80 via-[#0a1628]/60 to-black/70" />
    </div>
  );
}

export default function ResetPasswordPage() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match");
      setStatus("error");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password updated! Redirecting to sign in…");
        setStatus("done");
        setTimeout(() => setLocation("/sign-in"), 2000);
      } else {
        setMessage(data.error ?? "Reset failed");
        setStatus("error");
      }
    } catch {
      setMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center px-4">
        <AuthBackdrop />
        <div className="relative z-10 text-center text-white">
          <p className="mb-4">Invalid or missing reset token.</p>
          <Link href="/forgot-password" className="text-primary underline">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <AuthBackdrop />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          <div className="p-8">
            <div className="mb-6 flex justify-center">
              <Plane className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-primary text-center mb-1">
              Set new password
            </h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Choose a strong password for your account
            </p>

            {status === "done" ? (
              <div className="rounded-md bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-11"
                    placeholder="Repeat your password"
                  />
                </div>

                {status === "error" && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {message}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={status === "loading"}>
                  {status === "loading" ? "Updating…" : "Update password"}
                </Button>
              </form>
            )}
          </div>

          <div className="bg-muted/30 py-5 border-t border-border/50 text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
