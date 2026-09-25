// This file runs separately from the page, in the background — it's what
// lets a notification appear even when Sift isn't open in any tab.
// The browser keeps this alive on its own; we don't control when it runs.

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'Sift', body: event.data ? event.data.text() : 'New update' }; }

  var title = data.title || 'Sift';
  var options = {
    body: data.body || '',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%233D6BFF"/></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%233D6BFF"/></svg>',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification brings the user back to the site.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes(self.location.origin) && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
