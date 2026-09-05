/* NETIZEN ID — service worker (offline-first) */
/* ⚠️ Bump the version string on EVERY deploy, or returning visitors
   will be served the stale app indefinitely (cache-first strategy). */
const CACHE = "netizen-id-v3";
const ASSETS = [
  "./", "./index.html", "./style.css",
  "./app.js", "./avatar.js", "./exporter.js", "./gif.js",
  "./favicon.svg", "./manifest.json",
  "./vendor/jspdf.umd.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Cache-first for app assets; never intercept API calls (defense in depth) */
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.hostname === "api.github.com") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});