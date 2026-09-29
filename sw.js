// Runs in the background so alerts appear even when Sift isn't open.

// Sift's brand mark, used as the small icon/badge on every alert.
var ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' +
  '<rect width="128" height="128" rx="28" fill="#0A0C10"/>' +
  '<circle cx="64" cy="64" r="34" fill="none" stroke="#3D6BFF" stroke-width="12"/>' +
  '<circle cx="64" cy="64" r="11" fill="#33D2FF"/></svg>'
);

// A wide banner image drawn fresh for each alert: the two team codes on a
// dark card with the brand ring behind them. Android and desktop Chrome show
// this inside the notification; platforms that don't support it just skip it,
// so this never breaks anything.
function bannerFor(data) {
  var home = (data.home || '').slice(0, 4).toUpperCase();
  var away = (data.away || '').slice(0, 4).toUpperCase();
  if (!home || !away) return null;
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="140">' +
    '<rect width="360" height="140" fill="#0A0C10"/>' +
    '<circle cx="180" cy="70" r="120" fill="none" stroke="#3D6BFF" stroke-width="2" opacity="0.35"/>' +
    '<text x="70" y="86" font-family="Georgia,serif" font-size="46" font-weight="600" fill="#F2F4F7" text-anchor="middle">' + home + '</text>' +
    '<text x="180" y="80" font-family="Arial,sans-serif" font-size="18" fill="#5B6270" text-anchor="middle">v</text>' +
    '<text x="290" y="86" font-family="Georgia,serif" font-size="46" font-weight="600" fill="#F2F4F7" text-anchor="middle">' + away + '</text>' +
    '</svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data.json(); }
  catch (e) { data = { title: 'Sift', body: event.data ? event.data.text() : 'New update' }; }

  var title = data.title || 'Sift';
  var image = bannerFor(data);

  var options = {
    body: data.body || '',
    icon: ICON,
    badge: ICON,
    image: image || undefined,
    // Same match = replace the previous alert instead of stacking a pile of them
    tag: data.matchId ? 'match-' + data.matchId : undefined,
    renotify: !!data.matchId,
    data: { matchId: data.matchId || null },
    actions: data.matchId ? [
      { action: 'open', title: 'View match' },
      { action: 'dismiss', title: 'Dismiss' },
    ] : undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the alert (or its "View match" button) opens Sift at that match.
// "Dismiss" just closes it — no page opens.
self.addEventListener('notificationclick', function (event) {
  var matchId = event.notification.data && event.notification.data.matchId;
  event.notification.close();

  if (event.action === 'dismiss') return;

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
