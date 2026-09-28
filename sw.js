// Runs in the background so alerts appear even when Sift isn't open.

// A designed icon: Sift's ring mark on the dark brand color. SVG data URLs are
// accepted by Chrome for notification icons; browsers that reject it simply
// show their default, so nothing breaks.
var ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' +
  '<rect width="128" height="128" rx="28" fill="#0A0C10"/>' +
  '<circle cx="64" cy="64" r="34" fill="none" stroke="#3D6BFF" stroke-width="12"/>' +
  '<circle cx="64" cy="64" r="11" fill="#33D2FF"/></svg>'
);

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data.json(); }
  catch (e) { data = { title: 'Sift', body: event.data ? event.data.text() : 'New update' }; }

  var title = data.title || 'Sift';
  var options = {
    body: data.body || '',
    icon: ICON,
    badge: ICON,
    // Same match = replace the previous alert instead of stacking a pile of them
    tag: data.matchId ? 'match-' + data.matchId : undefined,
    renotify: !!data.matchId,
    data: { matchId: data.matchId || null },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the alert brings the user back to Sift, at the right match.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var matchId = event.notification.data && event.notification.data.matchId;
  var target = self.registration.scope + (matchId ? '?match=' + encodeURIComponent(matchId) : '');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) {
          if (matchId && 'navigate' in list[i]) { list[i].navigate(target); }
          return list[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
