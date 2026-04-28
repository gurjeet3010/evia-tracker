// Evia Service Worker — handles period reminders so notifications fire
// even when the app is closed. Uses the experimental Notification Triggers
// API (TimestampTrigger) on Chromium-based browsers when available; falls
// back to in-SW setTimeout while the SW is alive otherwise.

const CACHE_NAME = "evia-sw-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// In-SW timer fallback (cleared on SW restart, but rebuilt whenever the
// page posts a SCHEDULE message — which happens on every app load).
const timers = new Map();

function clearAllTimers() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

async function showReminder(title, body, tag) {
  return self.registration.showNotification(title, {
    body,
    tag: tag || "evia-period-reminder",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/dashboard" },
  });
}

async function scheduleReminders(reminders) {
  // reminders: [{ at: epoch_ms, title, body, tag }]
  clearAllTimers();

  // Cancel any previously-scheduled triggered notifications.
  if ("getNotifications" in self.registration) {
    try {
      const pending = await self.registration.getNotifications({ includeTriggered: true });
      pending.forEach((n) => n.close());
    } catch {}
  }

  const now = Date.now();
  for (const r of reminders) {
    if (r.at <= now) continue;

    // Prefer Notification Triggers (fires reliably even when offline / SW unloaded).
    if ("TimestampTrigger" in self) {
      try {
        await self.registration.showNotification(r.title, {
          body: r.body,
          tag: r.tag || "evia-period-reminder",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          // eslint-disable-next-line no-undef
          showTrigger: new TimestampTrigger(r.at),
          data: { url: "/dashboard" },
        });
        continue;
      } catch (e) {
        // Fall through to setTimeout
      }
    }

    // Fallback: setTimeout (capped at 24h, page will reschedule on next load).
    const delay = Math.min(r.at - now, 24 * 60 * 60 * 1000);
    const id = setTimeout(() => {
      showReminder(r.title, r.body, r.tag);
      timers.delete(r.tag);
    }, delay);
    timers.set(r.tag, id);
  }
}

self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "SCHEDULE_REMINDERS") {
    event.waitUntil(scheduleReminders(msg.reminders || []));
  } else if (msg.type === "CLEAR_REMINDERS") {
    event.waitUntil(scheduleReminders([]));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
