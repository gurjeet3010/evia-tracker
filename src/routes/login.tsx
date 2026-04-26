import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { signIn, signUp } from "@/lib/auth";
import { Flower2, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Evia" },
      { name: "description", content: "Sign in to Evia to track your menstrual cycle." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !/^\S+@\S+\.\S+$/.test(emailTrim)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const result = mode === "login" ? signIn(emailTrim, password) : signUp(emailTrim, password);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-soft">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-gradient-pink opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-gradient-purple opacity-40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-pink shadow-glow">
              <Flower2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight">Welcome to Evia</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login" ? "Sign in to continue your journey" : "Create an account to start tracking"}
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-soft backdrop-blur">
            <div className="mb-5 flex rounded-2xl bg-muted p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); }}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-input bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-2xl border border-input bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-pink py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Your data stays on your device. <br />
            <Link to="/learn" className="font-semibold text-primary hover:underline">
              Learn more about Evia
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
