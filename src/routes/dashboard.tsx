import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/AuthProvider";
import { computeCycle, formatDate, addDays, startOfDay, isSameDay, getDayMarker, profileToUserData } from "@/lib/cycle";
import { getPhaseGuidance } from "@/lib/cycleSyncing";
import { Bell, Droplet, Sparkles, Heart, Zap, Utensils, Activity, ChevronRight, X, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Today — Evia" },
      { name: "description", content: "Your cycle at a glance — current day, next ovulation, and upcoming phases." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

const WEEKDAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function DashboardContent() {
  const { profile } = useAuth();
  const today = startOfDay(new Date());
  const [selected, setSelected] = useState<Date>(today);
  const [showFullGuide, setShowFullGuide] = useState(false);

  const user = useMemo(() => (profile ? profileToUserData(profile) : null), [profile]);
  const info = useMemo(() => (user ? computeCycle(user, today) : null), [user]);
  const selectedInfo = useMemo(() => (user ? computeCycle(user, selected) : null), [user, selected]);
  if (!user || !info) return null;

  const displayInfo = selectedInfo || info;
  const guidance = getPhaseGuidance(displayInfo.currentPhase, user.trackingFor);

  // 7-day strip centered around today
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i - 3));

  const monthLabel = selected.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const phaseTitle: Record<string, string> = {
    period: "Period",
    fertile: "Fertile",
    ovulation: "Ovulation",
    luteal: "Luteal",
    follicular: "Follicular",
    pms: "PMS",
  };

  const heroDay = displayInfo.currentDay;
  const heroSubtitle =
    displayInfo.currentPhase === "period"
      ? `Next ovulation in ${displayInfo.daysUntilOvulation > 0 ? displayInfo.daysUntilOvulation : displayInfo.cycleLength + displayInfo.daysUntilOvulation} days`
      : displayInfo.currentPhase === "ovulation"
      ? `Ovulation today · Next period in ${displayInfo.daysUntilNextPeriod}d`
      : displayInfo.currentPhase === "fertile"
      ? `Ovulation in ${Math.max(displayInfo.daysUntilOvulation, 0)} days`
      : `Next period in ${displayInfo.daysUntilNextPeriod} days`;

  // Build timeline upcoming events
  const timeline = [
    {
      key: "period-now",
      date: info.lastPeriodStart,
      end: addDays(info.lastPeriodStart, info.periodLength - 1),
      title: "Period",
      sub: `${info.periodLength} days`,
      icon: <Droplet className="h-4 w-4" />,
      tone: "bg-gradient-period text-white",
      ring: "border-[var(--period)]",
    },
    {
      key: "fertile",
      date: info.fertileStart,
      end: info.fertileEnd,
      title: "Fertility window",
      sub: `Ovulation ${formatDate(info.ovulationDate)}`,
      icon: <Sparkles className="h-4 w-4" />,
      tone: "bg-gradient-fertile text-foreground",
      ring: "border-[var(--fertile)]",
    },
    {
      key: "pms",
      date: info.pmsStart,
      end: addDays(info.nextPeriodStart, -1),
      title: "PMS",
      sub: formatDate(info.pmsStart),
      icon: <Heart className="h-4 w-4" />,
      tone: "bg-gradient-pms text-foreground",
      ring: "border-[var(--pms)]",
    },
    {
      key: "next-period",
      date: info.nextPeriodStart,
      end: addDays(info.nextPeriodStart, info.periodLength - 1),
      title: "Period",
      sub: `${info.periodLength} days`,
      icon: <Droplet className="h-4 w-4" />,
      tone: "bg-gradient-period text-white",
      ring: "border-[var(--period)]",
    },
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const intensityBadgeColor = {
    restorative: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    low: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    moderate: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    high: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  }[guidance.movement.intensity];

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {user.name ? `Hi, ${user.name}` : "Hello"}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{monthLabel}</h1>
        </div>
      </header>

      {/* Weekday strip */}
      <section className="flex items-center justify-between gap-1">
        {weekDays.map((d) => {
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selected);
          const marker = getDayMarker(d, info);
          const dot =
            marker === "period" ? "bg-[var(--period)]" :
            marker === "ovulation" ? "bg-[var(--ovulation)]" :
            marker === "fertile" ? "bg-[var(--fertile)]" :
            marker === "pms" ? "bg-[var(--pms)]" : "";

          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <span className={`text-sm font-semibold ${isToday ? "text-foreground" : "text-muted-foreground"}`}>
                {d.getDate()}
              </span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold tracking-wide transition-all ${
                  isSelected
                    ? "bg-gradient-period text-white shadow-soft"
                    : "text-muted-foreground"
                }`}
              >
                {WEEKDAY_SHORT[d.getDay()]}
              </span>
              <span className={`h-1 w-1 rounded-full ${dot}`} />
            </button>
          );
        })}
      </section>

      {/* Hero gradient card */}
      <section
        className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-glow"
        style={{
          background:
            "linear-gradient(135deg, #6667AB 0%, #7B337E 55%, #420D4B 100%)",
        }}
      >
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-90">
              {phaseTitle[displayInfo.currentPhase]}
            </p>
            <h2 className="mt-1 text-5xl font-bold leading-none">
              day {heroDay}
            </h2>
          </div>
          <Link
            to="/profile"
            aria-label="Reminder Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-colors hover:bg-white/35"
          >
            <Bell className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative mt-6 inline-block rounded-2xl bg-white/20 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] font-medium opacity-90">Up next</p>
          <p className="text-sm font-semibold">{heroSubtitle}</p>
        </div>
      </section>

      {/* Cycle Syncing & Daily Guidance Card */}
      <section className="rounded-[28px] border border-border/60 bg-card p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Cycle Syncing Guide</h2>
              <p className="text-xs text-muted-foreground">{guidance.title}</p>
            </div>
          </div>
          <button
            onClick={() => setShowFullGuide(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Full Guide <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Energy Level Gauge */}
        <div className="rounded-2xl bg-secondary/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" /> Energy Status
            </span>
            <span className="font-bold text-primary">{guidance.energyPercent}% · {guidance.energyLabel}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/80">
            <div
              className="h-full rounded-full bg-gradient-pink transition-all duration-500"
              style={{ width: `${guidance.energyPercent}%` }}
            />
          </div>
        </div>

        {/* Nutrition & Movement Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Nutrition Chip */}
          <div className="rounded-2xl border border-border/70 bg-background p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-emerald-500" /> Nutrition Focus
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed line-clamp-2">
              {guidance.nutrition.summary}
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {guidance.nutrition.keyNutrients.slice(0, 3).map((n) => (
                <span key={n} className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Movement Chip */}
          <div className="rounded-2xl border border-border/70 bg-background p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-indigo-500" /> Movement
              </span>
              <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold capitalize ${intensityBadgeColor}`}>
                {guidance.movement.intensity}
              </span>
            </div>
            <p className="font-semibold text-foreground">{guidance.movement.type}</p>
            <p className="text-muted-foreground leading-relaxed line-clamp-1">
              {guidance.movement.summary}
            </p>
          </div>
        </div>
      </section>

      {/* Timelines */}
      <section className="rounded-[28px] border border-border/60 bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Timelines</h2>
          <span className="h-1 w-10 rounded-full bg-muted" />
        </div>

        <ol className="relative space-y-4">
          <span className="absolute left-[34px] top-2 bottom-2 w-px bg-border mx-[17px] my-[5px]" aria-hidden />
          {timeline.map((t) => (
            <li key={t.key} className="relative flex items-center gap-4">
              <div className="flex w-16 shrink-0 flex-col">
                <span className="text-sm font-bold text-foreground">
                  {t.date.toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toLowerCase()}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t.end.toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toLowerCase()}
                </span>
              </div>
              <div className="relative">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${t.tone} shadow-soft`}>
                  {t.icon}
                </span>
              </div>
              <div className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3">
                <p className="text-sm font-bold" style={{ color: "var(--period)" }}>
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground">{t.sub}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Daily tip */}
      <section className="rounded-[28px] border border-border/60 bg-card p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {user.trackingFor === "partner" ? "Partner care tip" : "Daily mindfulness tip"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {guidance.selfCare}
        </p>
      </section>

      {/* Expanded Cycle Syncing Modal */}
      {showFullGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {guidance.title}
                </span>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {guidance.tagline}
                </h3>
              </div>
              <button
                onClick={() => setShowFullGuide(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Hormonal Background */}
            <div className="rounded-2xl bg-secondary/50 p-4 text-xs space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Hormonal Status
              </span>
              <p className="text-muted-foreground leading-relaxed">{guidance.hormones}</p>
            </div>

            {/* Nutrition Focus Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Utensils className="h-4 w-4 text-emerald-500" /> Recommended Foods & Nutrients
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{guidance.nutrition.summary}</p>
              <div className="rounded-2xl border border-border/60 p-3 space-y-2 text-xs">
                <p className="font-semibold text-foreground">Foods to Focus On:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-muted-foreground">
                  {guidance.nutrition.focusFoods.map((food) => (
                    <li key={food} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{food}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {guidance.nutrition.avoidMinimize.length > 0 && (
                <div className="rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Consider minimizing: </span>
                  {guidance.nutrition.avoidMinimize.join(", ")}
                </div>
              )}
            </div>

            {/* Exercise & Movement Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" /> Workout & Movement Plan
              </h4>
              <div className="rounded-2xl border border-border/60 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{guidance.movement.type}</span>
                  <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold capitalize ${intensityBadgeColor}`}>
                    {guidance.movement.intensity} intensity
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{guidance.movement.summary}</p>
                <div className="pt-1">
                  <p className="font-semibold text-foreground mb-1">Suggested Activities:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guidance.movement.activities.map((act) => (
                      <span key={act} className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mindset / Partner Tip */}
            <div className="rounded-2xl bg-gradient-pink/15 p-4 text-xs text-foreground space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-primary" /> {user.trackingFor === "partner" ? "Partner Support Tip" : "Self-Care & Mindset"}
              </span>
              <p className="leading-relaxed">{guidance.selfCare}</p>
            </div>

            <button
              onClick={() => setShowFullGuide(false)}
              className="w-full rounded-2xl bg-gradient-pink py-3 text-xs font-bold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

