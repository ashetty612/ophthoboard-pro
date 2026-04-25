/* Clear Vision Boards — service worker.
 *
 * Strategy:
 *   - Cache-first for the heavy static data (case JSON, mascot PNGs,
 *     fonts, _next/static chunks). These rarely change between deploys
 *     and a stale cached copy is far better than a network round-trip
 *     when the user is on a flaky connection.
 *   - Network-first with cache fallback for navigations + dynamic
 *     pages so the user always gets the latest UI when online but the
 *     app still launches when offline.
 *   - Skip /api/* (chat, auth) so AI requests aren't intercepted.
 *   - On activate, purge old cache buckets so we don't bloat storage
 *     across deploys.
 */

const CACHE_VERSION = "cvb-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// What to pre-cache at install time. Big wins: the case JSON (≈few hundred
// KB) and the mascot images. Without these the app shell is unusable
// offline.
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/data/cases_database.json",
  "/data/ppp_database.json",
  "/mascots/cve-icon.png",
  "/mascots/cve.png",
  "/mascots/lensley.png",
  "/mascots/eyesaac.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Use { cache: "reload" } so we get the freshest copy at install,
      // not whatever the HTTP cache had.
      Promise.allSettled(
        PRECACHE_URLS.map((u) => cache.add(new Request(u, { cache: "reload" })))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Don't intercept Supabase, AI, or auth — these need fresh data and
  // talking to a server. Same for Vercel analytics.
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.endsWith(".supabase.co") ||
    url.hostname.endsWith("vercel-insights.com") ||
    url.hostname.endsWith("vercel-analytics.com")
  ) {
    return;
  }

  // Cache-first for heavy static content
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/data/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/mascots/") ||
    url.pathname.startsWith("/brand/") ||
    /\.(woff2?|ttf|otf|png|jpg|jpeg|webp|gif|svg|ico)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Refresh in the background ("stale-while-revalidate") so
          // subsequent visits pick up newer assets without blocking now.
          fetch(request)
            .then((res) => {
              if (res && res.ok) {
                caches.open(RUNTIME_CACHE).then((c) => c.put(request, res.clone()));
              }
            })
            .catch(() => {});
          return cached;
        }
        return fetch(request)
          .then((res) => {
            if (res && res.ok && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => caches.match("/") || new Response("Offline", { status: 503 }));
      })
    );
    return;
  }

  // Network-first with cache fallback for navigations / HTML
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok && res.status === 200) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
  }
});
