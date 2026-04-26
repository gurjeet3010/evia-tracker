import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getUserData } from "@/lib/auth";
import { computeCycle, getDayMarker, isSameDay, startOfDay } from "@/lib/cycle";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function CalendarContent() {
  const user = useMemo(() => getUserData(), []);
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  if (!user) return null;
  const info = useMemo(() => computeCycle(user, today), [user]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstWeekday = viewMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];

  const selMarker = getDayMarker(selected, info);
  const selLabels: Record<string, { label: string; tone: string }> = {
    period: { label: "Period day", tone: "bg-gradient-period text-primary-foreground" },
    ovulation: { label: "Ovulation day", tone: "bg-[var(--ovulation)] text-[var(--ovulation-foreground)]" },
    fertile: { label: "Fertility window", tone: "bg-gradient-fertile text-foreground" },
    pms: { label: "PMS day", tone: "bg-gradient-pms text-foreground" },
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your cycle</p>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
      </header>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-accent"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-base font-bold">{monthLabel}</p>
          <button
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-accent"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
          {WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const marker = getDayMarker(d, info);
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, selected);

            const base = "relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all mx-auto";
            const cls =
              marker === "period" ? "bg-gradient-period text-primary-foreground shadow-soft" :
              marker === "ovulation" ? "bg-[var(--ovulation)] text-[var(--ovulation-foreground)] shadow-soft" :
              marker === "fertile" ? "bg-[var(--fertile)] text-[var(--fertile-foreground)]" :
              marker === "pms" ? "bg-[var(--pms)]/40 text-foreground" :
              "text-foreground hover:bg-muted";

            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={`${base} ${cls} ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
              >
                {d.getDate()}
                {isToday && (
                  <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected</p>
        <p className="mt-1 text-lg font-bold">
          {selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <div className="mt-3">
          {selMarker ? (
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${selLabels[selMarker].tone}`}>
              {selLabels[selMarker].label}
            </span>
          ) : (
            <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Regular cycle day
            </span>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legend</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <LegendDot className="bg-gradient-period" label="Period" />
          <LegendDot className="bg-[var(--ovulation)]" label="Ovulation" />
          <LegendDot className="bg-[var(--fertile)] border border-border" label="Fertile" />
          <LegendDot className="bg-[var(--pms)]/40" label="PMS" />
        </div>
      </section>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded-full ${className}`} />
      <span className="font-medium text-foreground">{label}</span>
    </div>
  );
}
