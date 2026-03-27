/**
 * Framework-agnostic note shell transitions: set data-note-transition on #view_container;
 * CSS (@keyframes / transitions) in styles/note-shell.css performs motion.
 * Uses setTimeout, dataset, and .note-shell--scroll-locked — any framework can call this.
 * Cleanup delays read :root durations (--note-shell-*-animation-duration) so they stay in sync with CSS.
 */

export type NoteShellLayout = "edit" | "view" | "split";

/** Added on #view_container while a transition runs; CSS freezes .note-pane-scroll overflow. */
const SCROLL_LOCK_CLASS = "note-shell--scroll-locked";

/** Must match styles/note-shell.css :root variable names. */
const NOTE_SHELL_CSS_VAR_EDIT_VIEW = "--note-shell-edit-view-animation-duration";
const NOTE_SHELL_CSS_VAR_SPLIT = "--note-shell-split-animation-duration";

/** When the CSS var is missing or unparsable (e.g. SSR, stylesheet not loaded). */
const FALLBACK_ANIMATION_MS = 380;

function parseCssTimeToMs(raw: string): number {
  const s = raw.trim();
  if (!s) return FALLBACK_ANIMATION_MS;
  const msMatch = s.match(/^([\d.]+)ms$/i);
  if (msMatch) return Math.round(parseFloat(msMatch[1]));
  const sMatch = s.match(/^([\d.]+)s$/i);
  if (sMatch) return Math.round(parseFloat(sMatch[1]) * 1000);
  return FALLBACK_ANIMATION_MS;
}

function readCssVarDurationMs(varName: string): number {
  if (typeof document === "undefined") return FALLBACK_ANIMATION_MS;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName);
  return parseCssTimeToMs(raw);
}

/** Match cleanup in `commitNoteShellTransition` — layout/scroll is stable after this. */
function cleanupMsForCssVar(varName: string): number {
  return readCssVarDurationMs(varName) + 50;
}

function tokenToCssVarName(token: string): string {
  if (token === "view-edit" || token === "edit-view") return NOTE_SHELL_CSS_VAR_EDIT_VIEW;
  return NOTE_SHELL_CSS_VAR_SPLIT;
}

function getNoteShellTransitionCleanupMsForToken(token: string): number {
  return cleanupMsForCssVar(tokenToCssVarName(token));
}

/** Cleanup delay for split-only flows (scroll stabilize / post-align); reads --note-shell-split-animation-duration. */
export function getNoteShellSplitTransitionCleanupMs(): number {
  return cleanupMsForCssVar(NOTE_SHELL_CSS_VAR_SPLIT);
}

/** Reads --note-shell-edit-view-animation-duration (view-edit / edit-view). */
export function getNoteShellEditViewTransitionCleanupMs(): number {
  return cleanupMsForCssVar(NOTE_SHELL_CSS_VAR_EDIT_VIEW);
}

type Cleanup = { timeoutId: number };

const cleanups = new WeakMap<HTMLElement, Cleanup>();

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Maps a layout change to a data-note-transition token, or null if no scripted motion. */
function noteShellTransitionToken(
  from: NoteShellLayout,
  to: NoteShellLayout,
): string | null {
  if (from === "view" && to === "edit") return "view-edit";
  if (from === "edit" && to === "view") return "edit-view";
  if (from === "edit" && to === "split") return "edit-split";
  if (from === "view" && to === "split") return "view-split";
  if (from === "split" && to === "edit") return "split-edit";
  if (from === "split" && to === "view") return "split-view";
  return null;
}

function cancelPending(root: HTMLElement): void {
  const c = cleanups.get(root);
  if (c) {
    clearTimeout(c.timeoutId);
    cleanups.delete(root);
  }
  root.classList.remove(SCROLL_LOCK_CLASS);
  delete root.dataset.noteTransition;
}

/**
 * Run a transition after the DOM already reflects `to` (e.g. data-note-layout from React).
 * Safe to call repeatedly; cancels any in-flight transition on the same root.
 */
export function commitNoteShellTransition(
  root: HTMLElement | null,
  from: NoteShellLayout,
  to: NoteShellLayout,
): void {
  if (!root || from === to) return;

  cancelPending(root);

  const token = noteShellTransitionToken(from, to);
  if (!token || prefersReducedMotion()) {
    return;
  }

  root.dataset.noteTransition = token;
  root.classList.add(SCROLL_LOCK_CLASS);
  void root.offsetWidth;

  const cleanupMs = getNoteShellTransitionCleanupMsForToken(token);
  const timeoutId = window.setTimeout((): void => {
    root.classList.remove(SCROLL_LOCK_CLASS);
    delete root.dataset.noteTransition;
    cleanups.delete(root);
  }, cleanupMs);

  cleanups.set(root, { timeoutId });
}
