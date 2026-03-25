const SW_SCRIPT = "/sw-nav-fallback.js";

/**
 * Registers a minimal service worker that only handles failed **navigation**
 * (document) requests and serves `/offline.html` instead of the browser’s
 * generic ERR_INTERNET_DISCONNECTED page. No patch to Next.js required.
 */
export function registerOfflineFallbackServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const run = () => {
    void navigator.serviceWorker
      .register(SW_SCRIPT, { scope: "/" })
      .catch(() => {
        /* ignore registration errors (unsupported, private mode, etc.) */
      });
  };

  if (document.readyState === "complete") {
    run();
  } else {
    window.addEventListener("load", run, { once: true });
  }
}
