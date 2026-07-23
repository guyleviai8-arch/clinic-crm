// Service Worker — ד"ר קליניק
// אסטרטגיה: Network-First. המערכת חייבת נתונים עדכניים,
// והמטמון משמש רק כגיבוי כשאין אינטרנט.

const CACHE = 'clinic-v1';
const SHELL = [
  './',
  './index.html',
  './booking.html',
  './consent.html',
  './manage.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // רק בקשות GET נשמרות במטמון
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // לעולם לא לשמור במטמון קריאות ל-Supabase (נתונים חיים)
  if (url.hostname.includes('supabase.co')) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // שמור עותק טרי במטמון
        if (res && res.status === 200 && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        // אין רשת — החזר מהמטמון
        caches.match(req).then((r) => r || caches.match('./index.html'))
      )
  );
});
