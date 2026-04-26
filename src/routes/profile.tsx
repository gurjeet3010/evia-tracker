import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getCurrentEmail, getUserData, saveUserData, signOut } from "@/lib/auth";
import { useMemo, useState } from "react";
import { LogOut, Save, Check } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Evia" },
      { name: "description", content: "Update your cycle settings and personal preferences." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}

function ProfileContent() {
  const navigate = useNavigate();
  const email = getCurrentEmail() ?? "";
  const initial = useMemo(() => getUserData(), []);
  const [lastPeriod, setLastPeriod] = useState(initial?.lastPeriodDate ?? new Date().toISOString().slice(0, 10));
  const [cycleLength, setCycleLength] = useState(initial?.cycleLength ?? 28);
  const [periodLength, setPeriodLength] = useState(initial?.periodLength ?? 5);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveUserData({ email, lastPeriodDate: lastPeriod, cycleLength, periodLength });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function handleLogout() {
    signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your account</p>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      </header>

      <section className="flex items-center gap-4 rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-glow">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 text-xl font-bold backdrop-blur-sm">
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide opacity-85">Signed in as</p>
          <p className="truncate text-base font-semibold">{email}</p>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <div>
          <h2 className="text-base font-bold">Cycle settings</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">These help us calculate your phases accurately.</p>
        </div>

        <Field label="Last period start date">
          <input
            type="date"
            value={lastPeriod}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setLastPeriod(e.target.value)}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </Field>

        <Field label={`Cycle length: ${cycleLength} days`} hint="Average days between the start of two periods">
          <input
            type="range"
            min={21}
            max={45}
            value={cycleLength}
            onChange={(e) => setCycleLength(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>21</span><span>28</span><span>45</span>
          </div>
        </Field>

        <Field label={`Period length: ${periodLength} days`} hint="How long your period typically lasts">
          <input
            type="range"
            min={2}
            max={10}
            value={periodLength}
            onChange={(e) => setPeriodLength(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>2</span><span>5</span><span>10</span>
          </div>
        </Field>

        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-pink py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save changes</>}
        </button>
      </section>

      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
