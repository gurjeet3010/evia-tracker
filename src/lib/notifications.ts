// Period reminder notifications.
//
// Strategy (in order of preference):
//   1. Service Worker + Notification Triggers (TimestampTrigger) — fires
//      reliably even when the app is closed. Chromium-based browsers.
//   2. Service Worker + setTimeout inside the SW — works while the SW is
//      alive; we re-post the schedule on every app load.
//   3. In-tab setTimeout via the page's Notification API — last-resort
//      fallback (only fires while a tab is open).
//
// Settings persist in localStorage per-device.

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

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window
  );
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

  const candidates = [info.nextPeriodStart, addDays(info.nextPeriodStart, info.cycleLength)];
  for (const periodDate of candidates) {
    const fire = addDays(periodDate, -s.daysBefore);
    fire.setHours(s.hour, 0, 0, 0);
    if (fire.getTime() > now.getTime()) return fire;
  }
  return null;
}

/** Builds the next ~3 reminder events for the SW to schedule. */
function buildReminderQueue(user: UserData, s: ReminderSettings, now: Date = new Date()) {
  const info = computeCycle(user, now);
  const out: { at: number; title: string; body: string; tag: string }[] = [];
  const periods = [
    info.nextPeriodStart,
    addDays(info.nextPeriodStart, info.cycleLength),
    addDays(info.nextPeriodStart, info.cycleLength * 2),
  ];
  for (const periodDate of periods) {
    const fire = addDays(periodDate, -s.daysBefore);
    fire.setHours(s.hour, 0, 0, 0);
    if (fire.getTime() <= now.getTime()) continue;
    const days = Math.max(0, Math.round((periodDate.getTime() - fire.getTime()) / (24 * 60 * 60 * 1000)));
    out.push({
      at: fire.getTime(),
      title: "Period reminder 🌸",
      body: days <= 0
        ? "Your period is expected today."
        : `Your next period is expected in ${days} day${days === 1 ? "" : "s"}.`,
      tag: `evia-period-${fire.toISOString().slice(0, 13)}`,
    });
  }
  return out;
}

function reminderKey(fireAt: Date): string {
  return fireAt.toISOString().slice(0, 13);
}

function showInTab(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png", tag: "evia-period-reminder" });
  } catch (e) {
    console.error("Failed to show notification:", e);
  }
}

/** Fire a reminder NOW if one was due in the last 24h and not yet shown. */
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
        showInTab(
          "Period reminder 🌸",
          days <= 0 ? "Your period is expected today." : `Your next period is expected in ${days} day${days === 1 ? "" : "s"}.`
        );
        localStorage.setItem(key, String(now.getTime()));
      }
    }
  }
}

// ---------- Service Worker registration & messaging ----------

let swRegPromise: Promise<ServiceWorkerRegistration | null> | null = null;

function isPreviewOrIframe(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com");
}

export function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  if (isPreviewOrIframe()) {
    // Don't register SW in the editor preview (caches stale content & blocks routing).
    // Also clean up any previously-registered SW so dev stays sane.
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    return Promise.resolve(null);
  }
  if (!swRegPromise) {
    swRegPromise = navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(async (reg) => {
        await navigator.serviceWorker.ready;
        return reg;
      })
      .catch((err) => {
        console.warn("SW registration failed:", err);
        return null;
      });
  }
  return swRegPromise;
}

async function postToSW(message: unknown) {
  const reg = await getServiceWorkerRegistration();
  const target = reg?.active || navigator.serviceWorker?.controller;
  target?.postMessage(message);
  return Boolean(target);
}

// ---------- In-tab fallback timer ----------

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

export function clearScheduled() {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
  // Best effort: also clear SW-scheduled reminders.
  void postToSW({ type: "CLEAR_REMINDERS" });
}

function scheduleInTabFallback(user: UserData, s: ReminderSettings) {
  if (scheduledTimer) clearTimeout(scheduledTimer);
  const next = nextReminderAt(user, s);
  if (!next) return;
  const delay = Math.min(next.getTime() - Date.now(), 24 * 60 * 60 * 1000);
  if (delay <= 0) return;
  scheduledTimer = setTimeout(() => {
    const info = computeCycle(user);
    const days = Math.max(
      0,
      Math.round((info.nextPeriodStart.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    );
    showInTab(
      "Period reminder 🌸",
      days <= 0 ? "Your period is expected today." : `Your next period is expected in ${days} day${days === 1 ? "" : "s"}.`
    );
    localStorage.setItem(LAST_FIRED_PREFIX + reminderKey(next), String(Date.now()));
    scheduleInTabFallback(user, s);
  }, delay);
}

/**
 * Schedules upcoming reminders. Prefers the Service Worker (which can deliver
 * notifications even when the app is closed); falls back to an in-tab timeout.
 */
export async function scheduleNext(user: UserData, s: ReminderSettings) {
  if (typeof window === "undefined") return;
  if (!s.enabled || permissionState() !== "granted") {
    clearScheduled();
    return;
  }

  const reminders = buildReminderQueue(user, s);
  const sentToSW = await postToSW({ type: "SCHEDULE_REMINDERS", reminders });

  if (!sentToSW) {
    // Fallback only if no SW is available (e.g. preview iframe, unsupported browser).
    scheduleInTabFallback(user, s);
  } else if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

/** Convenience: bootstrap reminders from a Profile row. */
export function bootstrapReminders(profile: Profile | null) {
  if (!profile) return;
  const s = loadSettings();
  if (!s.enabled) return;
  const user = profileToUserData(profile);
  fireDueReminder(user, s);
  void scheduleNext(user, s);
}
