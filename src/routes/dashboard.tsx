import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getUserData } from "@/lib/auth";
import { computeCycle, formatDate, formatRange, addDays } from "@/lib/cycle";
import { Droplet, Sparkles, Heart, Flower2, ChevronRight } from "lucide-react";
import { useMemo } from "react";

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

function DashboardContent() {
  const user = useMemo(() => getUserData(), []);
  if (!user) return null;
  const info = useMemo(() => computeCycle(user), [user]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const phaseLabel: Record<string, string> = {
    period: "On your period",
    fertile: "Fertile window",
    ovulation: "Ovulation day",
    luteal: "Luteal phase",
    follicular: "Follicular phase",
    pms: "PMS phase",
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {greeting}{user.name ? `, ${user.name}` : ""}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.trackingFor === "partner" ? "Partner's day" : "Today"}
          </h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-pink shadow-soft">
          <Flower2 className="h-5 w-5 text-primary-foreground" />
        </div>
      </header>

      {/* Hero card */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-hero p-7 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <p className="text-sm font-medium opacity-90">{phaseLabel[info.currentPhase]}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-6xl font-bold leading-none">{info.currentDay}</span>
            <span className="text-base font-medium opacity-90">/ {info.cycleLength} day cycle</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">Next period</p>
              <p className="mt-1 text-sm font-semibold">in {info.daysUntilNextPeriod} days</p>
              <p className="text-[11px] opacity-80">{formatDate(info.nextPeriodStart)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">Ovulation</p>
              <p className="mt-1 text-sm font-semibold">
                {info.daysUntilOvulation > 0 ? `in ${info.daysUntilOvulation} days` : info.daysUntilOvulation === 0 ? "Today" : `${Math.abs(info.daysUntilOvulation)}d ago`}
              </p>
              <p className="text-[11px] opacity-80">{formatDate(info.ovulationDate)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your timeline</h2>
          <Link to="/calendar" className="flex items-center gap-1 text-xs font-semibold text-primary">
            View calendar <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          <PhaseCard
            title="Period"
            range={formatRange(info.lastPeriodStart, addDays(info.lastPeriodStart, info.periodLength - 1))}
            icon={<Droplet className="h-5 w-5" />}
            gradient="bg-gradient-period"
            description="Rest, hydrate, and be gentle with yourself."
          />
          <PhaseCard
            title="Fertility window"
            range={formatRange(info.fertileStart, info.fertileEnd)}
            icon={<Sparkles className="h-5 w-5" />}
            gradient="bg-gradient-fertile"
            description={`Ovulation on ${formatDate(info.ovulationDate)}.`}
            tone="light"
          />
          <PhaseCard
            title="PMS phase"
            range={formatRange(info.pmsStart, addDays(info.nextPeriodStart, -1))}
            icon={<Heart className="h-5 w-5" />}
            gradient="bg-gradient-pms"
            description="Mood changes are normal — be kind to your body."
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
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

function PhaseCard({
  title, range, icon, gradient, description, tone = "dark",
}: {
  title: string; range: string; icon: React.ReactNode; gradient: string; description: string; tone?: "dark" | "light";
}) {
  const text = tone === "light" ? "text-foreground" : "text-primary-foreground";
  const sub = tone === "light" ? "text-foreground/70" : "text-primary-foreground/85";
  return (
    <div className={`flex items-center gap-4 rounded-3xl p-4 shadow-soft ${gradient}`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25 ${text}`}>
        {icon}
      </div>
      <div className={`flex-1 ${text}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold">{title}</p>
          <p className={`text-[11px] font-medium ${sub}`}>{range}</p>
        </div>
        <p className={`mt-1 text-xs leading-snug ${sub}`}>{description}</p>
      </div>
    </div>
  );
}
