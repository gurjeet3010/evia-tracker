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
  displayNotification,
  sendTestNotification,
  initServiceWorker,
  isStandalone,
  isIOS,
  type ReminderSettings,
} from "@/lib/notifications";
import { profileToUserData } from "@/lib/cycle";
import { useEffect, useState } from "react";
import { LogOut, Save, Check, Plus, Trash2, Droplet, Bell, BellOff, BellRing, Sparkles, ShieldAlert, ChevronDown, Send, Smartphone } from "lucide-react";

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
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [addingPeriod, setAddingPeriod] = useState(false);

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
    setLoadingHistory(true);
    setHistory(await listPeriods(user.id));
    setLoadingHistory(false);
  }

  async function handleSave() {
    const res = await updateProfile({
      last_period_start: lastPeriod,
      cycle_length: cycleLength,
      period_length: periodLength,
    });
    if (res.ok) {
      if (user && lastPeriod) {
        // Auto-log period start date into period history so user doesn't have to duplicate work
        await addPeriod(user.id, lastPeriod, null);
        await loadHistory();
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      await refreshProfile();
    }
  }

  async function handleAddPeriod(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || !newStart) return;
    setAddingPeriod(true);
    await addPeriod(user.id, newStart, newEnd || null);
    // Auto-update cycle settings if newly logged period is most recent
    if (!profile?.last_period_start || newStart >= profile.last_period_start) {
      await updateProfile({ last_period_start: newStart });
      setLastPeriod(newStart);
      await refreshProfile();
    }
    setNewEnd("");
    await loadHistory();
    setAddingPeriod(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Period history</h2>
            <p className="text-xs text-muted-foreground">Log past cycles to keep predictions accurate</p>
          </div>
          <Droplet className="h-5 w-5 text-primary" />
        </div>

        <form onSubmit={handleAddPeriod} className="space-y-3 rounded-2xl bg-muted/40 p-3">
          <p className="text-xs font-semibold text-foreground">Log a period</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground">Start date</label>
              <input
                type="date"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">End date (optional)</label>
              <input
                type="date"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addingPeriod || !newStart}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-pink py-2.5 text-xs font-semibold text-primary-foreground shadow-soft hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> {addingPeriod ? "Saving…" : "Log period"}
          </button>
        </form>

        {loadingHistory ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No periods logged yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-border/40 bg-background px-4 py-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(p.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    {p.end_date && ` → ${new Date(p.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.end_date
                      ? `${Math.max(1, Math.round((new Date(p.end_date).getTime() - new Date(p.start_date).getTime()) / (24 * 60 * 60 * 1000)) + 1)} days`
                      : "Start only"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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

type BrowserKind = "chrome" | "edge" | "firefox" | "safari" | "opera" | "samsung" | "other";

function detectBrowser(): BrowserKind {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/OPR\/|Opera/.test(ua)) return "opera";
  if (/SamsungBrowser/.test(ua)) return "samsung";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Chrome\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua)) return "safari";
  return "other";
}

function unblockSteps(b: BrowserKind): string[] {
  switch (b) {
    case "chrome":
    case "edge":
    case "opera":
    case "samsung":
      return [
        "Tap the lock or info icon in the address bar.",
        "Find Notifications in the site settings.",
        "Switch it to Allow, then reload this page.",
      ];
    case "firefox":
      return [
        "Click the lock icon in the address bar.",
        "Open Site permissions and find Send Notifications.",
        "Remove the Block, then reload this page.",
      ];
    case "safari":
      return [
        "Open Safari → Settings → Websites → Notifications.",
        "Find this site and set it to Allow.",
        "Return here and reload the page.",
      ];
    default:
      return [
        "Open your browser's site settings for this page.",
        "Set Notifications to Allow.",
        "Reload this page to apply the change.",
      ];
  }
}

function NotificationsSection({ profile }: { profile: NonNullable<ReturnType<typeof useAuth>["profile"]> }) {
  const [settings, setSettings] = useState<ReminderSettings>(() => loadSettings());
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(() => permissionState());
  const [requesting, setRequesting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testNote, setTestNote] = useState<string | null>(null);
  const supported = notificationsSupported();
  const browser = detectBrowser();
  const standalone = isStandalone();
  const ios = isIOS();

  useEffect(() => {
    function refresh() {
      setPerm(permissionState());
    }
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const user = profileToUserData(profile);
  const active = settings.enabled && perm === "granted";
  const next = active ? nextReminderAt(user, settings) : null;

  function persist(patch: Partial<ReminderSettings>, overridePerm?: NotificationPermission | "unsupported") {
    const effectivePerm = overridePerm ?? perm;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveSettings(updated);
    if (updated.enabled && effectivePerm === "granted") {
      void scheduleNext(user, updated);
    } else {
      clearScheduled();
    }
  }

  async function handleEnable() {
    if (!supported) return;
    setRequesting(true);
    try {
      const result = await requestPermission();
      setPerm(result);
      if (result === "granted") {
        await initServiceWorker();
        persist({ enabled: true }, result);
        void sendTestNotification();
      } else if (result === "denied") {
        setShowHelp(true);
      }
    } finally {
      setRequesting(false);
    }
  }

  function handleDisable() {
    persist({ enabled: false });
  }

  const [showDiag, setShowDiag] = useState(false);
  const [diagInfo, setDiagInfo] = useState<{
    secure: boolean;
    swSupported: boolean;
    swRegistered: boolean;
    perm: string;
    standalone: boolean;
  }>({
    secure: typeof window !== "undefined" ? window.isSecureContext : false,
    swSupported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    swRegistered: false,
    perm: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
    standalone: isStandalone(),
  });

  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setDiagInfo((prev) => ({ ...prev, swRegistered: !!reg }));
      });
    }
  }, []);

  async function handleTest() {
    setTesting(true);
    setTestNote(null);
    try {
      let currentPerm = permissionState();
      if (currentPerm !== "granted") {
        currentPerm = await requestPermission();
        setPerm(currentPerm);
      }
      if (currentPerm !== "granted") {
        setTestNote(`Notification permission is "${currentPerm}". Please allow notifications in browser settings.`);
        return;
      }
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setTestNote("⚠️ Error: Not a secure context (HTTPS). Mobile browsers block notifications on plain HTTP/IP.");
        return;
      }
      await initServiceWorker();
      persist({ enabled: true }, currentPerm);

      const sent = await sendTestNotification();
      if (sent) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      } else {
        setTestNote("Notification dispatched to Service Worker. If no banner appeared, check your phone Settings → Apps → Chrome/Evia → Notifications.");
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("Test notification failed:", e);
      setTestNote(`Error: ${err}`);
    } finally {
      setTesting(false);
    }
  }

  if (!supported) {
    return (
      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BellOff className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">Period reminders</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your browser doesn't support notifications. Open Evia in Chrome on your Android phone to enable notifications.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // 2) Permission not yet asked → big one-click enable card
  if (perm === "default") {
    return (
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
        <div className="bg-gradient-hero p-5 text-primary-foreground">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm">
              <BellRing className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold">Never miss your period</h2>
              <p className="mt-1 text-xs opacity-90">
                Get a friendly reminder a few days before your next predicted period.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Personalised to your saved cycle</li>
            <li className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Choose your lead time and delivery hour</li>
            <li className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Works even when the app is closed</li>
          </ul>
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-pink py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            <Bell className="h-4 w-4" />
            {requesting ? "Waiting for permission…" : "Enable reminders"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            Your browser will ask you to allow notifications. You can turn this off any time.
          </p>
        </div>
      </section>
    );
  }

  // 3) Permission denied → help panel with platform-specific instructions
  if (perm === "denied") {
    const steps = unblockSteps(browser);
    return (
      <section className="space-y-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground">Notifications are blocked</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Evia can't send you reminders until you allow notifications in your browser settings.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowHelp((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/40"
        >
          <span>How to unblock notifications</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showHelp ? "rotate-180" : ""}`} />
        </button>

        {showHelp && (
          <ol className="space-y-2 rounded-2xl bg-card px-4 py-3 text-xs text-muted-foreground">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
            <li className="pt-1">
              <button
                onClick={() => window.location.reload()}
                className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                Reload page
              </button>
            </li>
          </ol>
        )}
      </section>
    );
  }

  // 4) Permission granted → full settings panel
  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-gradient-pink text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground"}`}>
            {active ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold">Period reminders</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {active ? "Reminders are on" : "Reminders are paused"}
            </p>
          </div>
        </div>
        <button
          onClick={active ? handleDisable : handleEnable}
          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            active ? "bg-muted text-foreground hover:bg-muted/70" : "bg-gradient-pink text-primary-foreground shadow-soft"
          }`}
        >
          {active ? "Pause" : "Turn on"}
        </button>
      </div>

      <Field label={`Remind me ${settings.daysBefore} day${settings.daysBefore === 1 ? "" : "s"} before`}>
        <div className="flex gap-2">
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => persist({ daysBefore: d })}
              disabled={!active}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
                settings.daysBefore === d
                  ? "bg-gradient-pink text-primary-foreground shadow-soft"
                  : "bg-secondary/60 text-foreground hover:bg-secondary"
              } disabled:opacity-50`}
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
          disabled={!active}
          className="w-full accent-[var(--primary)] disabled:opacity-50"
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

      <div className="space-y-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {testing ? (
            "Sending test notification…"
          ) : testSent ? (
            <><Check className="h-3.5 w-3.5 text-emerald-500" /> Sent — check your notification shade</>
          ) : (
            <><Send className="h-3.5 w-3.5" /> Send a test notification</>
          )}
        </button>
        {testNote && (
          <p className="rounded-xl bg-amber-500/10 p-2.5 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
            {testNote}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
              navigator.serviceWorker.getRegistration().then((reg) => {
                setDiagInfo({
                  secure: window.isSecureContext,
                  swSupported: "serviceWorker" in navigator,
                  swRegistered: !!reg,
                  perm: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
                  standalone: isStandalone(),
                });
              });
            }
            setShowDiag((v) => !v);
          }}
          className="mt-2 text-center text-[11px] text-muted-foreground underline hover:text-foreground block w-full"
        >
          {showDiag ? "Hide device diagnostics" : "Check device notification status"}
        </button>

        {showDiag && (
          <div className="rounded-2xl border border-border/80 bg-muted/40 p-3 text-[11px] font-mono space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>Secure Context (HTTPS):</span>
              <span className={diagInfo.secure ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                {diagInfo.secure ? "YES" : "NO (Blocked by Browser)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Notification API:</span>
              <span className="font-bold text-foreground">{diagInfo.perm}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Worker Supported:</span>
              <span className="font-bold text-foreground">{diagInfo.swSupported ? "YES" : "NO"}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Worker Registered:</span>
              <span className={diagInfo.swRegistered ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                {diagInfo.swRegistered ? "YES" : "NOT YET"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>App Mode:</span>
              <span className="font-bold text-foreground">{diagInfo.standalone ? "Installed PWA" : "Browser Webpage"}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
