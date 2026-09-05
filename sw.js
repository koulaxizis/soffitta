/* Soffitta service worker — progressive offline caching */
"use strict";

const CACHE = "soffitta-v1";
const CORE = ["./", "./index.html"];

/* Εγκατάσταση: μόνο το index προ-αποθηκεύεται — τα apps μπαίνουν
   στο cache όταν επισκεφτεί ο χρήστης (progressive, χωρίς 404 traps). */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

/* Καθαρισμός παλιών caches σε κάθε αναβάθμιση */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch: cache-first για same-origin GET, με ενημέρωση από το δίκτυο.
   Cross-origin (π.χ. Wikipedia του museum, εικόνες thumbnail) αγνοούνται
   — ποτέ caching περιεχομένου τρίτων. */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
      return cached || network;
    }).catch(() =>
      caches.match("./").then((page) =>
        page || new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
      )
    )
  );
});