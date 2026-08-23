// Period reminder notifications for PWA and Web.
//
// Strategy (in order of preference):
//   1. Service Worker + Notification Triggers (TimestampTrigger) — fires
//      reliably even when the app is closed. Chromium-based browsers.
//   2. Service Worker + showNotification — works across Android Chrome PWA,
//      iOS 16.4+ standalone PWA, and desktop browsers.
//   3. In-tab fallback timer via displayNotification — active while tab is open.
//   4. Due reminder catch-up on app boot (fireDueReminder).
//
// Settings persist in localStorage per-device.

import { computeCycle, addDays, profileToUserData, type UserData } from "./cycle";
import type { Profile } from "./AuthProvider";

const SETTINGS_KEY = "evia.notifications.v1";
const LAST_FIRED_PREFIX = "evia.notifications.lastFired."; // + reminderKey
const MAX_TIMEOUT_MS = 2147483647; // 2^31 - 1 (~24.8 days)

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

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function notificationsSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window || ("serviceWorker" in navigator && "PushManager" in window);
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    ("Notification" in window || "PushManager" in window)
  );
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined") return "unsupported";
  if ("Notification" in window) {
    return Notification.permission;
  }
  return "unsupported";
}

export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    // Callback format fallback for older Safari WebKit
    return new Promise<NotificationPermission | "unsupported">((resolve) => {
      try {
        Notification.requestPermission((result) => resolve(result));
      } catch {
        resolve("unsupported");
      }
    });
  }
}

/** Helper to race a promise against a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Universal notification dispatcher.
 * Prioritizes ServiceWorkerRegistration.showNotification() which is required on
 * Android Chrome and iOS Standalone PWA (where `new Notification()` throws an Illegal constructor error).
 */
/**
 * Universal notification dispatcher.
 * Prioritizes ServiceWorkerRegistration.showNotification() which is required on
 * Android Chrome and iOS Standalone PWA (where `new Notification()` throws an Illegal constructor error).
 */
export async function displayNotification(
  title: string,
  options?: NotificationOptions & { url?: string }
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (permissionState() !== "granted") return false;

  // Haptic feedback on mobile devices if supported
  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {}
  }

  const defaultOptions: NotificationOptions = {
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "evia-period-reminder",
    ...options,
  };

  // 1. Primary: Service Worker showNotification (Works reliably in PWA & Mobile)
  if ("serviceWorker" in navigator) {
    try {
      const reg =
        (await withTimeout(navigator.serviceWorker.getRegistration(), 1000, null)) ||
        (await withTimeout(getServiceWorkerRegistration(), 2000, null));

      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(title, {
          ...defaultOptions,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vibrate: (defaultOptions as any).vibrate || [100, 50, 100],
          data: { url: options?.url || "/dashboard", ...(options?.data || {}) },
        });
        return true;
      }
    } catch (err) {
      console.warn("[Evia Notification] SW showNotification failed, trying fallback:", err);
    }
  }

  // 2. Fallback: window.Notification (Desktop browsers without active SW)
  if ("Notification" in window && typeof Notification === "function") {
    try {
      new Notification(title, defaultOptions);
      return true;
    } catch (err) {
      console.warn("[Evia Notification] window.Notification failed:", err);
    }
  }

  return false;
}

/** Directly trigger a test notification using SW message or displayNotification */
export async function sendTestNotification(): Promise<boolean> {
  const sentSW = await postToSW({
    type: "TEST_NOTIFICATION",
    title: "Evia reminder ✨",
    body: "Notifications are set up and working on your mobile device!",
    url: "/dashboard",
  });
  if (sentSW) return true;

  return displayNotification("Evia reminder ✨", {
    body: "Notifications are set up and working on your mobile device!",
    url: "/dashboard",
  });
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
        void displayNotification(
          "Period reminder 🌸",
          {
            body: days <= 0 ? "Your period is expected today." : `Your next period is expected in ${days} day${days === 1 ? "" : "s"}.`,
            tag: `evia-period-${reminderKey(fire)}`,
          }
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
    // Disable in embedded iframe (e.g. editor webview preview panel)
    if (window.self !== window.top) return true;
  } catch {
    return false;
  }
  return false;
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
    swRegPromise = (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await withTimeout(navigator.serviceWorker.ready, 2000, null);
        return reg;
      } catch (err) {
        console.warn("[Evia PWA] Service Worker registration failed:", err);
        swRegPromise = null;
        return null;
      }
    })();
  }
  return swRegPromise;
}

export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  return await getServiceWorkerRegistration();
}

async function postToSW(message: unknown): Promise<boolean> {
  try {
    const reg =
      (await withTimeout(navigator.serviceWorker.getRegistration(), 1000, null)) ||
      (await withTimeout(getServiceWorkerRegistration(), 2000, null));
    if (!reg) return false;
    const target = reg.active || reg.waiting || reg.installing || navigator.serviceWorker.controller;
    if (target) {
      target.postMessage(message);
      return true;
    }
    return false;
  } catch (err) {
    console.warn("[Evia PWA] postToSW error:", err);
    return false;
  }
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
  const now = Date.now();
  const diff = next.getTime() - now;
  if (diff <= 0) return;

  // Handle setTimeout integer limits without triggering premature reminder
  if (diff <= MAX_TIMEOUT_MS) {
    scheduledTimer = setTimeout(() => {
      if (Date.now() >= next.getTime() - 60000) {
        const info = computeCycle(user);
        const days = Math.max(
          0,
          Math.round((info.nextPeriodStart.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        );
        void displayNotification(
          "Period reminder 🌸",
          {
            body: days <= 0 ? "Your period is expected today." : `Your next period is expected in ${days} day${days === 1 ? "" : "s"}.`,
            tag: `evia-period-${reminderKey(next)}`,
          }
        );
        localStorage.setItem(LAST_FIRED_PREFIX + reminderKey(next), String(Date.now()));
      }
      scheduleInTabFallback(user, s);
    }, diff);
  } else {
    // If over 24.8 days, wake up at max interval and reschedule
    scheduledTimer = setTimeout(() => {
      scheduleInTabFallback(user, s);
    }, MAX_TIMEOUT_MS);
  }
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
  } else {
    // Keep in-tab timer running alongside SW while app is active
    scheduleInTabFallback(user, s);
  }
}

let foregroundListenerAttached = false;

/** Listen for app visibility / focus events to check and dispatch due reminders on mobile unlock/resume */
export function setupMobileForegroundListener(userGetter: () => UserData | null) {
  if (typeof window === "undefined" || foregroundListenerAttached) return;
  foregroundListenerAttached = true;
  const handleCheck = () => {
    if (document.visibilityState === "visible") {
      const u = userGetter();
      const s = loadSettings();
      if (u && s.enabled) {
        fireDueReminder(u, s);
        void scheduleNext(u, s);
      }
    }
  };
  document.addEventListener("visibilitychange", handleCheck);
  window.addEventListener("focus", handleCheck);
}

/** Convenience: bootstrap reminders from a Profile row. */
export function bootstrapReminders(profile: Profile | null) {
  if (!profile) return;
  const s = loadSettings();
  const user = profileToUserData(profile);
  setupMobileForegroundListener(() => user);
  if (!s.enabled) return;
  fireDueReminder(user, s);
  void scheduleNext(user, s);
}
