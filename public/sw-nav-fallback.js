/* Offline fallback:
 * - Navigations: on failure, serve cached /offline.html (avoids Chrome’s generic offline page).
 * - Precached offline bundle (CSS, logo, self-hosted icon fonts): network-first, cache on
 *   failure so /offline.html and in-app icons work offline after install.
 *   subresources load while offline. */
const OFFLINE_URL = "/offline.html";
const OFFLINE_CSS = "/offline.css";
const OFFLINE_LOGO = "/assets/images/edit_white.png";
const ICON_FONTS = [
  "/fonts/material-icons-latin-400-normal.woff2",
  "/fonts/material-icons-outlined-latin-400-normal.woff2",
  "/fonts/material-symbols-outlined-latin-wght-normal.woff2",
];
const CACHE = "notes-offline-fallback-v4";

const PRECACHED_PATHS = new Set([
  OFFLINE_URL,
  OFFLINE_CSS,
  OFFLINE_LOGO,
  ...ICON_FONTS,
]);

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isPrecachedOfflineAsset(url) {
  return isSameOrigin(url) && PRECACHED_PATHS.has(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([...PRECACHED_PATHS])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("notes-offline-fallback-") && k !== CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (!isSameOrigin(url)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) =>
            cached ||
            new Response(
              "<!DOCTYPE html><html><body><p>Offline</p></body></html>",
              {
                status: 503,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              },
            ),
        ),
      ),
    );
    return;
  }

  if (isPrecachedOfflineAsset(url)) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches
          .match(event.request)
          .then(
            (hit) => hit || caches.match(url.pathname, { ignoreSearch: true }),
          ),
      ),
    );
  }
});
