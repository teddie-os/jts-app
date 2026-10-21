// The app's background script. It does two things: shows a notification when
// one arrives, and opens the app when someone taps it.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let note = {};
  try { note = event.data ? event.data.json() : {}; } catch (e) { note = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(note.title || "Just Talk Studios", {
    body: note.body || "",
    icon: "icons/mic-192.png",
    badge: "icons/mic-192.png",
    data: { url: note.url || "./" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "./", self.registration.scope).href;
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of open) {
      if (c.url.startsWith(self.registration.scope)) { await c.focus(); return; }
    }
    await self.clients.openWindow(url);
  })());
});
