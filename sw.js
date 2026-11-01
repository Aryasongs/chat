/* marsX service worker: shows a generic notification when a push arrives while the app is closed.
   Push carries NO message text (end-to-end encryption stays intact). Place this file next to index.html. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const APP_URL = '/app';   // the chat app lives at /app (landing page is at /)

self.addEventListener('push', e => {
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some(w => w.visibilityState === 'visible')) return;   // app is open and visible: no need
    let d = null;
    try { d = e.data ? e.data.json() : null; } catch (_) {}
    const isCall = !!(d && (d.kind === 'call' || d.kind === 'videocall'));
    await self.registration.showNotification((d && d.title) || 'marsX', {
      body: (d && d.body) || 'You have a new message or call',
      tag: (d && d.tag) || 'marsx-msg',
      renotify: true,
      requireInteraction: isCall,                       // call notification stays until tapped
      vibrate: isCall ? [500, 250, 500, 250, 500, 250, 500] : [120],
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: { url: APP_URL, chat: d && d.chat }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // prefer a window that already has the chat app open (not the landing page)
    const appWin = wins.find(w => new URL(w.url).pathname.replace(/\/$/, '').startsWith('/app'));
    const target = appWin || wins[0];
    if (appWin && 'focus' in appWin) return appWin.focus();
    if (target && 'navigate' in target) { try { await target.navigate(APP_URL); return target.focus(); } catch (_) {} }
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || APP_URL);
  })());
});
