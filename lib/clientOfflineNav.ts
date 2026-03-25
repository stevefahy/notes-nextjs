import type { AppDispatch } from "../store";
import { dispatchErrorSnack } from "./dispatchSnack";

/** `navigator.onLine === false` — coarse but matches typical “offline” UX. */
export function isBrowserOffline(): boolean {
  if (typeof window === "undefined") return false;
  return window.navigator.onLine === false;
}

const OFFLINE_FETCH_ERROR = new Error("Failed to fetch");

export function notifyOfflineNavigationBlocked(dispatch: AppDispatch): void {
  dispatchErrorSnack(dispatch, OFFLINE_FETCH_ERROR, false);
}

/**
 * If offline, shows network snack and returns false. Otherwise runs `run` and returns true.
 * Pass your framework navigation here (e.g. `() => void router.push(href)`).
 */
export function runClientNavIfOnline(
  dispatch: AppDispatch,
  run: () => void | Promise<void>,
): boolean {
  if (isBrowserOffline()) {
    notifyOfflineNavigationBlocked(dispatch);
    return false;
  }
  void run();
  return true;
}

/**
 * Capture-phase listener: primary same-window clicks on same-origin `<a href>` while offline.
 * Does not block new tabs (modifier keys or target=_blank).
 */
export function createOfflineAnchorClickCapture(dispatch: AppDispatch) {
  return (e: MouseEvent) => {
    if (!isBrowserOffline()) return;
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    const a = t.closest("a[href]");
    if (!a || !(a instanceof HTMLAnchorElement)) return;
    if (
      a.target === "_blank" ||
      a.target === "_parent" ||
      a.target === "_top"
    ) {
      return;
    }
    const hrefAttr = a.getAttribute("href");
    if (!hrefAttr || hrefAttr.startsWith("#")) return;
    if (/^(mailto:|tel:|javascript:)/i.test(hrefAttr)) return;
    let url: URL;
    try {
      url = new URL(a.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    e.stopPropagation();
    notifyOfflineNavigationBlocked(dispatch);
  };
}
