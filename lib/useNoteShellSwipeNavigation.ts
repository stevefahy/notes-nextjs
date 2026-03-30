import { RefObject, useEffect } from "react";
import type { NoteShellLayout } from "./noteShellDom";

/**
 * Horizontal swipe to mirror the footer Edit/View toggle (same `setIsView` → `commitNoteShellTransition`).
 * Pointer Events so touch, pen, and primary mouse work. Disabled when `layout === "split"`.
 *
 * Edit: swipe left → View (panel enters from the right).
 * View: swipe right → Edit (panel enters from the left).
 *
 * Uses window-level move/end listeners (no setPointerCapture) so vertical scrolling inside panes is not hijacked.
 */
export function useNoteShellSwipeNavigation(
  containerRef: RefObject<HTMLElement | null>,
  layout: NoteShellLayout,
  onSwipeToView: () => void,
  onSwipeToEdit: () => void,
): void {
  useEffect(() => {
    if (layout === "split") return;

    const el = containerRef.current;
    if (!el) return;

    const ANGLE_LOCK_PX = 12;
    const MIN_SWIPE_PX = 56;
    const H_DOMINANCE = 1.25;

    let activePointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let direction: "h" | "v" | null = null;

    let removeWindowListeners: (() => void) | null = null;

    const reset = (): void => {
      activePointerId = null;
      direction = null;
      removeWindowListeners?.();
      removeWindowListeners = null;
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (direction !== null) return;
      if (Math.abs(dx) < ANGLE_LOCK_PX && Math.abs(dy) < ANGLE_LOCK_PX) return;
      direction = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    };

    const onPointerEnd = (e: PointerEvent): void => {
      if (e.pointerId !== activePointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let resolved = direction;
      if (resolved === null) {
        if (Math.abs(dx) < ANGLE_LOCK_PX && Math.abs(dy) < ANGLE_LOCK_PX) {
          reset();
          return;
        }
        resolved = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }

      if (resolved !== "h") {
        reset();
        return;
      }

      if (Math.abs(dx) < MIN_SWIPE_PX) {
        reset();
        return;
      }

      if (Math.abs(dx) < Math.abs(dy) * H_DOMINANCE) {
        reset();
        return;
      }

      if (layout === "edit" && dx < 0) {
        onSwipeToView();
      } else if (layout === "view" && dx > 0) {
        onSwipeToEdit();
      }

      reset();
    };

    const onPointerDown = (e: PointerEvent): void => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      reset();

      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      direction = null;

      const opts = { capture: true };
      window.addEventListener("pointermove", onPointerMove, opts);
      window.addEventListener("pointerup", onPointerEnd, opts);
      window.addEventListener("pointercancel", onPointerEnd, opts);

      removeWindowListeners = (): void => {
        window.removeEventListener("pointermove", onPointerMove, opts);
        window.removeEventListener("pointerup", onPointerEnd, opts);
        window.removeEventListener("pointercancel", onPointerEnd, opts);
        removeWindowListeners = null;
      };
    };

    el.addEventListener("pointerdown", onPointerDown);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      reset();
    };
  }, [containerRef, layout, onSwipeToEdit, onSwipeToView]);
}
