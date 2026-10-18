/* Packliste: online die aktuelle Seite laden, offline die gespeicherte nutzen. */
const CACHE = "packliste-v5";
const SHELL = ["./", "./index.html"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(SHELL.map((url) => new Request(url, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("packliste-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(new Request(e.request, { cache: "no-cache" }));
        if (!response.ok) throw new Error("Page unavailable");
        await cache.put("./index.html", response.clone());
        return response;
      } catch {
        return await cache.match("./index.html") || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request);
    if (hit) return hit;
    const response = await fetch(e.request);
    if (response.ok) await cache.put(e.request, response.clone());
    return response;
  })());
});
