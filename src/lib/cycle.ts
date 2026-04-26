// Cycle calculation utilities

export type TrackingFor = "self" | "partner";

export type UserData = {
  email: string;
  lastPeriodDate: string; // ISO date
  cycleLength: number;
  periodLength: number;
  name?: string;
  trackingFor?: TrackingFor;
  onboarded?: boolean;
};

export type Phase = "period" | "fertile" | "ovulation" | "luteal" | "follicular" | "pms";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date | string): Date {
  const date = typeof d === "string" ? new Date(d) : new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const diff = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(diff / MS_PER_DAY);
}

export function addDays(d: Date | string, days: number): Date {
  const date = startOfDay(d);
  date.setDate(date.getDate() + days);
  return date;
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(d).toLocaleDateString(undefined, opts);
}

export function formatRange(a: Date, b: Date): string {
  return `${formatDate(a)} – ${formatDate(b)}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export type CycleInfo = {
  currentDay: number;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: Date;
  nextPeriodStart: Date;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  pmsStart: Date;
  daysUntilNextPeriod: number;
  daysUntilOvulation: number;
  currentPhase: Phase;
};

export function computeCycle(user: UserData, today: Date = new Date()): CycleInfo {
  const t = startOfDay(today);
  const cycleLength = user.cycleLength || 28;
  const periodLength = user.periodLength || 5;

  // Find the most recent period start that's <= today
  let lastPeriodStart = startOfDay(user.lastPeriodDate);
  while (daysBetween(lastPeriodStart, t) >= cycleLength) {
    lastPeriodStart = addDays(lastPeriodStart, cycleLength);
  }
  // If user-provided date is in the future, roll back
  while (lastPeriodStart.getTime() > t.getTime()) {
    lastPeriodStart = addDays(lastPeriodStart, -cycleLength);
  }

  const currentDay = daysBetween(lastPeriodStart, t) + 1;
  const nextPeriodStart = addDays(lastPeriodStart, cycleLength);
  const ovulationDate = addDays(nextPeriodStart, -14);
  const fertileStart = addDays(ovulationDate, -3);
  const fertileEnd = addDays(ovulationDate, 3);
  const pmsStart = addDays(nextPeriodStart, -5);

  let currentPhase: Phase = "follicular";
  if (currentDay <= periodLength) currentPhase = "period";
  else if (t >= fertileStart && t <= fertileEnd) {
    currentPhase = isSameDay(t, ovulationDate) ? "ovulation" : "fertile";
  } else if (t >= pmsStart && t < nextPeriodStart) currentPhase = "pms";
  else if (t > fertileEnd) currentPhase = "luteal";

  return {
    currentDay,
    cycleLength,
    periodLength,
    lastPeriodStart,
    nextPeriodStart,
    ovulationDate,
    fertileStart,
    fertileEnd,
    pmsStart,
    daysUntilNextPeriod: daysBetween(t, nextPeriodStart),
    daysUntilOvulation: daysBetween(t, ovulationDate),
    currentPhase,
  };
}

export function getDayMarker(date: Date, info: CycleInfo): "period" | "ovulation" | "fertile" | "pms" | null {
  const d = startOfDay(date);

  // Check period (current and next)
  for (const start of [info.lastPeriodStart, info.nextPeriodStart, addDays(info.lastPeriodStart, -info.cycleLength)]) {
    for (let i = 0; i < info.periodLength; i++) {
      if (isSameDay(d, addDays(start, i))) return "period";
    }
  }
  if (isSameDay(d, info.ovulationDate)) return "ovulation";
  if (d >= info.fertileStart && d <= info.fertileEnd) return "fertile";
  if (d >= info.pmsStart && d < info.nextPeriodStart) return "pms";
  return null;
}
