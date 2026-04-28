// Period reminder notifications using the browser Notification API.
// Settings persist in localStorage per-device. We schedule an in-tab timeout
// for the next reminder while the app is open, and also re-check on load
// to catch any reminders that should have fired while the app was closed.

import { computeCycle, addDays, profileToUserData, type UserData } from "./cycle";
import type { Profile } from "./AuthProvider";

const SETTINGS_KEY = "evia.notifications.v1";
const LAST_FIRED_PREFIX = "evia.notifications.lastFired."; // + reminderKey

export type ReminderSettings = {
  enabled: boolean;
  daysBefore: number; // 1, 2, or 3
  hour: number; // 0-23, local time
};

export const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  daysBefore: 2,
  hour: 9,
};

export function loadSettings(): ReminderSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: ReminderSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

/**
 * Returns the next Date the reminder should fire at, given the user's cycle
 * and reminder settings. Returns null if disabled / no permission.
 */
export function nextReminderAt(user: UserData, s: ReminderSettings, now: Date = new Date()): Date | null {
  if (!s.enabled) return null;
  const info = computeCycle(user, now);

  // Build candidate fire times for this and the next cycle.
  const candidates = [info.nextPeriodStart, addDays(info.nextPeriodStart, info.cycleLength)];
  for (const periodDate of candidates) {
    const fire = addDays(periodDate, -s.daysBefore);
    fire.setHours(s.hour, 0, 0, 0);
    if (fire.getTime() > now.getTime()) return fire;
  }
  return null;
}

function reminderKey(fireAt: Date): string {
  return fireAt.toISOString().slice(0, 13); // unique per hour
}

function show(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "evia-period-reminder",
    });
  } catch (e) {
    console.error("Failed to show notification:", e);
  }
}

/**
 * Fires a reminder NOW if one was due while the app was closed (within the
 * last 24h) and hasn't been shown yet. Idempotent.
 */
export function fireDueReminder(user: UserData, s: ReminderSettings, now: Date = new Date()) {
  if (!s.enabled || permissionState() !== "granted") return;
  const info = computeCycle(user, now);

  for (const periodDate of [info.nextPeriodStart, addDays(info.nextPeriodStart, -info.cycleLength)]) {
    const fire = addDays(periodDate, -s.daysBefore);
    fire.setHours(s.hour, 0, 0, 0);
    const diff = now.getTime() - fire.getTime();
    if (diff >= 0 && diff <= 24 * 60 * 60 * 1000) {
      const key = LAST_FIRED_PREFIX + reminderKey(fire);
      if (!localStorage.getItem(key)) {
        const days = Math.max(0, Math.round((periodDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
        show(
          "Period reminder 🌸",
          days <= 0 ? "Your period is expected today." : `Your next period is expected in ${days} day${days === 1 ? "" : "s"}.`
        );
        localStorage.setItem(key, String(now.getTime()));
      }
    }
  }
}

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

export function clearScheduled() {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

/**
 * Schedules an in-tab timeout to show the next reminder. Re-call whenever
 * settings or profile change. Safely no-ops on the server.
 */
export function scheduleNext(user: UserData, s: ReminderSettings) {
  clearScheduled();
  if (typeof window === "undefined") return;
  if (!s.enabled || permissionState() !== "granted") return;

  const next = nextReminderAt(user, s);
  if (!next) return;

  // setTimeout max is ~24.8 days. Cap at 24h, then reschedule.
  const delay = Math.min(next.getTime() - Date.now(), 24 * 60 * 60 * 1000);
  if (delay <= 0) return;

  scheduledTimer = setTimeout(() => {
    const info = computeCycle(user);
    const days = Math.max(
      0,
      Math.round((info.nextPeriodStart.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    );
    show(
      "Period reminder 🌸",
      days <= 0 ? "Your period is expected today." : `Your next period is expected in ${days} day${days === 1 ? "" : "s"}.`
    );
    const key = LAST_FIRED_PREFIX + reminderKey(next);
    localStorage.setItem(key, String(Date.now()));
    // Schedule the following reminder
    scheduleNext(user, s);
  }, delay);
}

/** Convenience: bootstrap reminders from a Profile row. */
export function bootstrapReminders(profile: Profile | null) {
  if (!profile) return;
  const s = loadSettings();
  if (!s.enabled) return;
  const user = profileToUserData(profile);
  fireDueReminder(user, s);
  scheduleNext(user, s);
}
