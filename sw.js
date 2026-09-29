/* Crumble Recall Web Push service worker.
   This intentionally has no fetch handler: the game stays network-first and update-safe. */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { body: event.data ? event.data.text() : '' };
  }
  var title = data.title || 'Crumble Recall';
  var url = data.url || './index.html';
  var options = {
    body: data.body || 'A new update is ready.',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: data.tag || 'crumble-update',
    renotify: true,
    data: { url: url }
  };
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    self.registration.setAppBadge ? self.registration.setAppBadge(1) : Promise.resolve()
  ]));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var wanted = new URL((event.notification.data && event.notification.data.url) || './index.html', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windows) {
    for (var i = 0; i < windows.length; i++) {
      if (windows[i].url.indexOf(self.registration.scope) === 0) {
        return windows[i].focus().then(function (client) {
          return 'navigate' in client ? client.navigate(wanted) : client;
        });
      }
    }
    return self.clients.openWindow(wanted);
  }));
});
