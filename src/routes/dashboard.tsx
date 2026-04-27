import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getUserData } from "@/lib/auth";
import { computeCycle, formatDate, addDays, startOfDay, isSameDay, getDayMarker } from "@/lib/cycle";
import { Bell, Droplet, Sparkles, Heart } from "lucide-react";
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
  const user = useMemo(() => getUserData(), []);
  const today = startOfDay(new Date());
  const [selected, setSelected] = useState<Date>(today);

  if (!user) return null;
  const info = useMemo(() => computeCycle(user, today), [user]);

  // 7-day strip centered around today
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i - 3));

  const monthLabel = today.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const phaseTitle: Record<string, string> = {
    period: "Period",
    fertile: "Fertile",
    ovulation: "Ovulation",
    luteal: "Luteal",
    follicular: "Follicular",
    pms: "PMS",
  };

  const heroDay = info.currentPhase === "period" ? info.currentDay : info.currentDay;
  const heroSubtitle =
    info.currentPhase === "period"
      ? `Next ovulation in ${info.daysUntilOvulation > 0 ? info.daysUntilOvulation : info.cycleLength + info.daysUntilOvulation} days`
      : info.currentPhase === "ovulation"
      ? `Ovulation today · Next period in ${info.daysUntilNextPeriod}d`
      : info.currentPhase === "fertile"
      ? `Ovulation in ${Math.max(info.daysUntilOvulation, 0)} days`
      : `Next period in ${info.daysUntilNextPeriod} days`;

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
            "linear-gradient(135deg, #ff7eb3 0%, #ff8a73 45%, #c79bf2 100%)",
        }}
      >
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-90">
              {phaseTitle[info.currentPhase]}
            </p>
            <h2 className="mt-1 text-5xl font-bold leading-none">
              day {heroDay}
            </h2>
          </div>
          <button
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-colors hover:bg-white/35"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-6 inline-block rounded-2xl bg-white/20 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] font-medium opacity-90">Up next</p>
          <p className="text-sm font-semibold">{heroSubtitle}</p>
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
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily tip</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {info.currentPhase === "period" && "💧 Stay hydrated and consider gentle stretching to ease cramps."}
          {info.currentPhase === "fertile" && "🌸 Your energy peaks now — a great time for social connection."}
          {info.currentPhase === "ovulation" && "✨ Ovulation today. Notice subtle shifts in mood and energy."}
          {info.currentPhase === "follicular" && "🌱 Energy is rising — perfect for new projects and workouts."}
          {info.currentPhase === "luteal" && "🌙 Slow down a little — your body is preparing for rest."}
          {info.currentPhase === "pms" && "🤍 Be patient with yourself today. Comfort foods and rest help."}
        </p>
      </section>
    </div>
  );
}
