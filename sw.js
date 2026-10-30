/* marsX service worker: shows a generic notification when a push arrives while the app is closed.
   Push carries NO message text (end-to-end encryption stays intact). Place this file next to index.html. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some(w => w.visibilityState === 'visible')) return;   // app is open and visible: no need
    await self.registration.showNotification('marsX', {
      body: 'You have a new message or call',
      tag: 'marsx-msg',
      renotify: true,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: { url: self.registration.scope }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) { if ('focus' in w) return w.focus(); }
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || '/');
  })());
});
