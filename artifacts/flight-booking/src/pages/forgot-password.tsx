import { useState } from "react";
import { Link, useLocation } from "wouter";
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
      <motion.div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

type Step = "email" | "newPassword" | "done";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/check-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep("newPassword");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No account found with that email address.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password-direct`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });
      if (res.ok) {
        setStep("done");
        setTimeout(() => setLocation("/sign-in"), 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

            {step === "email" && (
              <>
                <h1 className="font-serif text-2xl font-semibold text-primary text-center mb-1">
                  Reset your password
                </h1>
                <p className="text-muted-foreground text-center text-sm mb-8">
                  Enter your account email to continue
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      placeholder="you@example.com"
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? "Checking…" : "Continue"}
                  </Button>
                </form>
              </>
            )}

            {step === "newPassword" && (
              <>
                <h1 className="font-serif text-2xl font-semibold text-primary text-center mb-1">
                  Set new password
                </h1>
                <p className="text-muted-foreground text-center text-sm mb-8">
                  Choose a new password for <span className="font-medium text-foreground">{email}</span>
                </p>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? "Updating…" : "Update password"}
                  </Button>
                </form>
              </>
            )}

            {step === "done" && (
              <div className="text-center space-y-4">
                <h1 className="font-serif text-2xl font-semibold text-primary mb-1">Password updated!</h1>
                <p className="text-muted-foreground text-sm">Redirecting to sign in…</p>
                <div className="h-6 w-6 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
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
