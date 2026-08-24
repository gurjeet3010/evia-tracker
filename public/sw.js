// Evia Service Worker — handles period reminders so notifications fire
// even when the app is closed. Uses the Notification Triggers API
// (TimestampTrigger) on Chromium-based browsers when available; falls
// back to in-SW setTimeout and client sync.

const CACHE_NAME = "evia-sw-v3";
const MAX_TIMEOUT_MS = 2147483647; // 2^31 - 1 (~24.8 days)

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// In-SW timer storage
const timers = new Map();

function clearAllTimers() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

function getIconUrl(path) {
  try {
    return new URL(path, self.location.origin).href;
  } catch {
    return path;
  }
}

async function showReminder(title, body, tag, data) {
  const icon = getIconUrl("/icon-192.png");
  return self.registration.showNotification(title, {
    body,
    tag: tag || "evia-period-reminder",
    icon,
    badge: icon,
    vibrate: [100, 50, 100],
    renotify: true,
    requireInteraction: false,
    data: data || { url: "/dashboard" },
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

    // Prefer Notification Triggers (fires reliably on supported Chromium even when offline / SW unloaded).
    if ("TimestampTrigger" in self) {
      try {
        const icon = getIconUrl("/icon-192.png");
        // eslint-disable-next-line no-undef
        const trigger = new TimestampTrigger(r.at);
        await self.registration.showNotification(r.title, {
          body: r.body,
          tag: r.tag || "evia-period-reminder",
          icon,
          badge: icon,
          vibrate: [100, 50, 100],
          renotify: true,
          showTrigger: trigger,
          data: { url: "/dashboard" },
        });
        continue;
      } catch (e) {
        // Fall through to setTimeout
      }
    }

    // In-SW Timer fallback
    const diff = r.at - now;
    if (diff > 0 && diff <= MAX_TIMEOUT_MS) {
      const id = setTimeout(() => {
        // Verify reminder is actually due before displaying
        if (Date.now() >= r.at - 60000) {
          showReminder(r.title, r.body, r.tag, { url: "/dashboard" });
        }
        timers.delete(r.tag);
      }, diff);
      timers.set(r.tag, id);
    }
  }
}

self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "SCHEDULE_REMINDERS") {
    event.waitUntil(scheduleReminders(msg.reminders || []));
  } else if (msg.type === "CLEAR_REMINDERS") {
    event.waitUntil(scheduleReminders([]));
  } else if (msg.type === "TEST_NOTIFICATION") {
    event.waitUntil(
      showReminder(
        msg.title || "Evia reminder ✨",
        msg.body || "Notifications are set up and working on your mobile device!",
        msg.tag || "evia-test-reminder",
        { url: msg.url || "/dashboard" }
      ).catch((err) => console.warn("[Evia SW] TEST_NOTIFICATION showReminder error:", err))
    );
  }
});

// Periodic Sync fallback for Android Chrome PWAs
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "evia-check-reminders") {
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "CHECK_DUE_REMINDERS" }));
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && client.url.includes(self.location.origin)) {
          if ("navigate" in client) {
            client.navigate(url);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

