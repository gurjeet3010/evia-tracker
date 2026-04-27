import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getUserData } from "@/lib/auth";
import { computeCycle, getDayMarker, isSameDay, startOfDay } from "@/lib/cycle";
import { ChevronLeft, ChevronRight, Pencil, Droplet, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Evia" },
      { name: "description", content: "Monthly calendar of your menstrual cycle, ovulation, and fertility window." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AppShell>
      <CalendarContent />
    </AppShell>
  );
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
type Filter = "period" | "fertile" | "pms" | "all";

function CalendarContent() {
  const navigate = useNavigate();
  const user = useMemo(() => getUserData(), []);
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [filter, setFilter] = useState<Filter>("all");

  if (!user) return null;
  const info = useMemo(() => computeCycle(user, today), [user]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstWeekday = viewMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];

  const filterPills: { key: Filter; label: string; cls: string }[] = [
    { key: "period", label: "Period", cls: "border-[var(--period)] text-[var(--period)]" },
    { key: "fertile", label: "Fertility", cls: "border-[var(--ovulation)] text-[var(--ovulation)]" },
    { key: "pms", label: "PMS", cls: "border-[var(--pms)] text-[oklch(0.55_0.14_50)]" },
    { key: "all", label: "All", cls: "border-border text-muted-foreground" },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Calendar</h1>
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </header>

      {/* Month switcher */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-bold">
            {monthLabel} <span className="ml-1 text-muted-foreground">›</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const marker = getDayMarker(d, info);
            const visible =
              filter === "all" ||
              (filter === "period" && marker === "period") ||
              (filter === "fertile" && (marker === "fertile" || marker === "ovulation")) ||
              (filter === "pms" && marker === "pms");

            const isToday = isSameDay(d, today);

            const cls =
              visible && marker === "period"
                ? "bg-gradient-period text-white shadow-soft"
                : visible && marker === "ovulation"
                ? "bg-[var(--ovulation)] text-[var(--ovulation-foreground)] shadow-soft"
                : visible && marker === "fertile"
                ? "bg-[oklch(0.85_0.09_320)] text-[var(--ovulation)]"
                : visible && marker === "pms"
                ? "bg-[var(--pms)]/40 text-foreground"
                : "text-foreground";

            return (
              <div key={i} className="flex justify-center">
                <button
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all ${cls} ${isToday && !marker ? "ring-1 ring-border" : ""}`}
                >
                  {d.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Filter pills */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterPills.map((p) => {
          const active = filter === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setFilter(p.key)}
              className={`shrink-0 rounded-full border bg-card px-4 py-1.5 text-xs font-semibold transition-all ${p.cls} ${active ? "shadow-soft scale-[1.03]" : "opacity-80"}`}
            >
              {p.label}
            </button>
          );
        })}
      </section>

      {/* About your cycle */}
      <section className="rounded-[28px] bg-secondary/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">About your cycle</h2>
          <span className="h-1 w-10 rounded-full bg-muted" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fertile)]">
              <Sparkles className="h-4 w-4" style={{ color: "var(--period)" }} />
            </div>
            <p className="text-[11px] text-muted-foreground">Average cycle length</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: "var(--period)" }}>
              {info.cycleLength} <span className="text-base font-semibold">days</span>
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fertile)]">
              <Droplet className="h-4 w-4" style={{ color: "var(--period)" }} />
            </div>
            <p className="text-[11px] text-muted-foreground">Average period length</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: "var(--period)" }}>
              {info.periodLength} <span className="text-base font-semibold">days</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
