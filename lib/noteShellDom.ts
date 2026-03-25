/**
 * Framework-agnostic note shell transitions: set data-note-transition on #view_container;
 * CSS (@keyframes / transitions) in styles/note-shell.css performs motion.
 * Uses setTimeout, dataset, and .note-shell--scroll-locked — any framework can call this.
 */

export type NoteShellLayout = "edit" | "view" | "split";

const GO_CLASS = "note-shell--go";
/** Added on #view_container while a transition runs; CSS freezes .note-pane-scroll overflow. */
const SCROLL_LOCK_CLASS = "note-shell--scroll-locked";
const DURATION_MS = 400;

/** Match cleanup in `commitNoteShellTransition` — layout/scroll is stable after this. */
export const NOTE_SHELL_TRANSITION_CLEANUP_MS = DURATION_MS + 50;

type Cleanup = {
  timeoutId: number;
  raf1: number;
  raf2: number;
};

const cleanups = new WeakMap<HTMLElement, Cleanup>();

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Maps a layout change to a data-note-transition token, or null if no scripted motion. */
export function noteShellTransitionToken(
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
    cancelAnimationFrame(c.raf1);
    cancelAnimationFrame(c.raf2);
    cleanups.delete(root);
  }
  root.classList.remove(GO_CLASS, SCROLL_LOCK_CLASS);
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

  const timeoutId = window.setTimeout((): void => {
    root.classList.remove(GO_CLASS, SCROLL_LOCK_CLASS);
    delete root.dataset.noteTransition;
    cleanups.delete(root);
  }, DURATION_MS + 50);

  cleanups.set(root, { timeoutId, raf1: 0, raf2: 0 });
}
