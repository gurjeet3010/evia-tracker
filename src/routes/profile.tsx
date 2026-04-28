import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/AuthProvider";
import { addPeriod, deletePeriod, listPeriods, type PeriodEntry } from "@/lib/cycleApi";
import {
  loadSettings,
  saveSettings,
  requestPermission,
  permissionState,
  scheduleNext,
  clearScheduled,
  nextReminderAt,
  notificationsSupported,
  type ReminderSettings,
} from "@/lib/notifications";
import { profileToUserData } from "@/lib/cycle";
import { useEffect, useState } from "react";
import { LogOut, Save, Check, Plus, Trash2, Droplet, Bell, BellOff, BellRing, Sparkles, ShieldAlert, ChevronDown, Send } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Evia" },
      { name: "description", content: "Update your cycle settings and view your past periods." },
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
  const { user, profile, signOut, updateProfile, refreshProfile } = useAuth();

  const [lastPeriod, setLastPeriod] = useState(profile?.last_period_start ?? new Date().toISOString().slice(0, 10));
  const [cycleLength, setCycleLength] = useState(profile?.cycle_length ?? 28);
  const [periodLength, setPeriodLength] = useState(profile?.period_length ?? 5);
  const [saved, setSaved] = useState(false);

  const [history, setHistory] = useState<PeriodEntry[]>([]);
  const [newStart, setNewStart] = useState(new Date().toISOString().slice(0, 10));
  const [newEnd, setNewEnd] = useState<string>("");

  useEffect(() => {
    if (profile) {
      setLastPeriod(profile.last_period_start ?? new Date().toISOString().slice(0, 10));
      setCycleLength(profile.cycle_length);
      setPeriodLength(profile.period_length);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadHistory() {
    if (!user) return;
    setHistory(await listPeriods(user.id));
  }

  async function handleSave() {
    const res = await updateProfile({
      last_period_start: lastPeriod,
      cycle_length: cycleLength,
      period_length: periodLength,
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      await refreshProfile();
    }
  }

  async function handleAddPeriod() {
    if (!user || !newStart) return;
    await addPeriod(user.id, newStart, newEnd || null);
    setNewEnd("");
    await loadHistory();
  }

  async function handleDelete(id: string) {
    await deletePeriod(id);
    await loadHistory();
  }

  async function handleLogout() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  if (!user || !profile) return null;
  const email = user.email ?? "";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your account</p>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      </header>

      <section className="flex items-center gap-4 rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-glow">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 text-xl font-bold backdrop-blur-sm">
          {(profile.name?.[0] ?? email[0] ?? "E").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide opacity-85">Signed in as</p>
          <p className="truncate text-base font-semibold">{profile.name || email}</p>
          {profile.name && <p className="truncate text-xs opacity-80">{email}</p>}
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
          <input type="range" min={21} max={45} value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
        </Field>

        <Field label={`Period length: ${periodLength} days`} hint="How long your period typically lasts">
          <input type="range" min={2} max={10} value={periodLength} onChange={(e) => setPeriodLength(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
        </Field>

        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-pink py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save changes</>}
        </button>
      </section>

      {/* Notifications */}
      {profile && <NotificationsSection profile={profile} />}

      {/* Period history */}
      <section className="space-y-4 rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <div>
          <h2 className="text-base font-bold">Period history</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Log past periods to improve your predictions over time.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Start</label>
            <input type="date" value={newStart} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setNewStart(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">End (optional)</label>
            <input type="date" value={newEnd} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setNewEnd(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <button onClick={handleAddPeriod} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
          <Plus className="h-4 w-4" /> Log period
        </button>

        <ul className="space-y-2">
          {history.length === 0 && (
            <li className="rounded-2xl bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">No past periods logged yet.</li>
          )}
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-period text-white">
                <Droplet className="h-4 w-4" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-semibold text-foreground">
                  {new Date(h.start_date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {h.end_date ? `Ended ${new Date(h.end_date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}` : "Ongoing"}
                </p>
              </div>
              <button onClick={() => handleDelete(h.id)} aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
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

function NotificationsSection({ profile }: { profile: NonNullable<ReturnType<typeof useAuth>["profile"]> }) {
  const [settings, setSettings] = useState<ReminderSettings>(() => loadSettings());
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(() => permissionState());
  const supported = notificationsSupported();

  const user = profileToUserData(profile);
  const next = settings.enabled && perm === "granted" ? nextReminderAt(user, settings) : null;

  function persist(patch: Partial<ReminderSettings>) {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveSettings(updated);
    if (updated.enabled && perm === "granted") {
      scheduleNext(user, updated);
    } else {
      clearScheduled();
    }
  }

  async function handleToggle() {
    if (settings.enabled) {
      persist({ enabled: false });
      return;
    }
    const result = await requestPermission();
    setPerm(result);
    if (result === "granted") {
      persist({ enabled: true });
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">Period reminders</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Get a heads-up before your next period starts.
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={!supported}
          aria-label="Toggle reminders"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${
            settings.enabled && perm === "granted"
              ? "bg-gradient-pink text-primary-foreground shadow-soft"
              : "bg-muted text-muted-foreground"
          } disabled:opacity-50`}
        >
          {settings.enabled && perm === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>
      </div>

      {!supported && (
        <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Notifications aren't supported in this browser.
        </p>
      )}
      {supported && perm === "denied" && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Notifications are blocked. Enable them in your browser settings to receive reminders.
        </p>
      )}

      <Field label={`Remind me ${settings.daysBefore} day${settings.daysBefore === 1 ? "" : "s"} before`}>
        <div className="flex gap-2">
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => persist({ daysBefore: d })}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
                settings.daysBefore === d
                  ? "bg-gradient-pink text-primary-foreground shadow-soft"
                  : "bg-secondary/60 text-foreground hover:bg-secondary"
              }`}
            >
              {d} day{d === 1 ? "" : "s"}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`At ${String(settings.hour).padStart(2, "0")}:00`} hint="Local time">
        <input
          type="range"
          min={0}
          max={23}
          value={settings.hour}
          onChange={(e) => persist({ hour: Number(e.target.value) })}
          className="w-full accent-[var(--primary)]"
        />
      </Field>

      {next && (
        <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-xs">
          <p className="font-semibold text-foreground">Next reminder</p>
          <p className="text-muted-foreground">
            {next.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </section>
  );
}
