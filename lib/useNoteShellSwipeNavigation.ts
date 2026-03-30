import { RefObject, useLayoutEffect, useRef } from "react";
import type { NoteShellLayout } from "./noteShellDom";

/**
 * Horizontal swipe to mirror the footer Edit/View toggle (same `setIsView` → `commitNoteShellTransition`).
 * Disabled when `layout === "split"`.
 *
 * - Mouse / pen: Pointer Events (window-level move/up/cancel).
 * - Touch: Touch Events on window — many mobile stacks cancel Pointer Events before pointerup;
 *   touchend still carries the gesture. Pointer path skips pointerType === "touch".
 *
 * styles/note-shell.css + index.module.css: touch-action pan-y on the shell.
 */

export function useNoteShellSwipeNavigation(
  containerRef: RefObject<HTMLElement | null>,
  layout: NoteShellLayout,
  onSwipeToView: () => void,
  onSwipeToEdit: () => void,
): void {
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  useLayoutEffect(() => {
    if (layout === "split") return;

    const el = containerRef.current;
    if (!el) return;

    const ANGLE_LOCK_PX = 12;
    const MIN_SWIPE_PX = 56;
    const H_DOMINANCE = 1.25;

    const trySwipe = (
      dx: number,
      dy: number,
      resolvedDir: "h" | "v" | null,
    ): void => {
      let resolved = resolvedDir;
      if (resolved === null) {
        if (Math.abs(dx) < ANGLE_LOCK_PX && Math.abs(dy) < ANGLE_LOCK_PX) {
          return;
        }
        resolved = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }

      if (resolved !== "h") return;
      if (Math.abs(dx) < MIN_SWIPE_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * H_DOMINANCE) return;

      const current = layoutRef.current;
      if (current === "edit" && dx < 0) {
        onSwipeToView();
      } else if (current === "view" && dx > 0) {
        onSwipeToEdit();
      }
    };

    /* ---------- Pointer path (mouse / pen only) ---------- */

    let activePointerId: number | null = null;
    let pStartX = 0;
    let pStartY = 0;
    let pDirection: "h" | "v" | null = null;
    let removePointerWindowListeners: (() => void) | null = null;

    const releaseCaptureIfHeld = (): void => {
      if (activePointerId === null) return;
      try {
        if (el.hasPointerCapture(activePointerId)) {
          el.releasePointerCapture(activePointerId);
        }
      } catch {
        /* ignore */
      }
    };

    const resetPointer = (): void => {
      releaseCaptureIfHeld();
      activePointerId = null;
      pDirection = null;
      removePointerWindowListeners?.();
      removePointerWindowListeners = null;
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (e.pointerId !== activePointerId) return;
      const dx = e.clientX - pStartX;
      const dy = e.clientY - pStartY;
      if (pDirection !== null) {
        if (pDirection === "h") {
          e.preventDefault();
        }
        return;
      }
      if (Math.abs(dx) < ANGLE_LOCK_PX && Math.abs(dy) < ANGLE_LOCK_PX) return;
      pDirection = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (pDirection === "h") {
        try {
          el.setPointerCapture(activePointerId);
        } catch {
          /* ignore */
        }
      }
    };

    const onPointerEnd = (e: PointerEvent): void => {
      if (e.pointerId !== activePointerId) return;

      const dx = e.clientX - pStartX;
      const dy = e.clientY - pStartY;

      trySwipe(dx, dy, pDirection);
      resetPointer();
    };

    const onPointerDown = (e: PointerEvent): void => {
      if (e.pointerType === "touch") return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      resetPointer();

      activePointerId = e.pointerId;
      pStartX = e.clientX;
      pStartY = e.clientY;
      pDirection = null;

      const opts = { capture: true };
      const moveOpts = { capture: true, passive: false };
      window.addEventListener("pointermove", onPointerMove, moveOpts);
      window.addEventListener("pointerup", onPointerEnd, opts);
      window.addEventListener("pointercancel", onPointerEnd, opts);

      removePointerWindowListeners = (): void => {
        window.removeEventListener("pointermove", onPointerMove, moveOpts);
        window.removeEventListener("pointerup", onPointerEnd, opts);
        window.removeEventListener("pointercancel", onPointerEnd, opts);
        removePointerWindowListeners = null;
      };
    };

    const onLostPointerCapture = (e: PointerEvent): void => {
      if (e.pointerId !== activePointerId) return;
      resetPointer();
    };

    /* ---------- Touch path ---------- */

    let touchId: number | null = null;
    let tStartX = 0;
    let tStartY = 0;
    let tDirection: "h" | "v" | null = null;
    let removeTouchWindowListeners: (() => void) | null = null;

    const resetTouch = (): void => {
      touchId = null;
      tDirection = null;
      removeTouchWindowListeners?.();
      removeTouchWindowListeners = null;
    };

    const getTouch = (
      list: TouchList,
      id: number,
    ): Touch | undefined => {
      for (let i = 0; i < list.length; i++) {
        const t = list.item(i);
        if (t?.identifier === id) return t;
      }
      return undefined;
    };

    const onTouchMove = (e: TouchEvent): void => {
      if (touchId === null) return;
      const t =
        getTouch(e.changedTouches, touchId) ?? getTouch(e.touches, touchId);
      if (!t) return;

      const dx = t.clientX - tStartX;
      const dy = t.clientY - tStartY;

      if (tDirection !== null) {
        if (tDirection === "h") {
          e.preventDefault();
        }
        return;
      }
      if (Math.abs(dx) < ANGLE_LOCK_PX && Math.abs(dy) < ANGLE_LOCK_PX) return;
      tDirection = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    };

    const onTouchEnd = (e: TouchEvent): void => {
      if (touchId === null) return;
      const t = getTouch(e.changedTouches, touchId);
      if (!t) {
        resetTouch();
        return;
      }

      const dx = t.clientX - tStartX;
      const dy = t.clientY - tStartY;

      trySwipe(dx, dy, tDirection);
      resetTouch();
    };

    const onTouchStart = (e: TouchEvent): void => {
      if (e.touches.length !== 1) return;

      resetTouch();

      const t0 = e.touches.item(0);
      if (!t0) return;

      touchId = t0.identifier;
      tStartX = t0.clientX;
      tStartY = t0.clientY;
      tDirection = null;

      const moveOpts = { capture: true, passive: false };
      const endOpts = { capture: true };
      window.addEventListener("touchmove", onTouchMove, moveOpts);
      window.addEventListener("touchend", onTouchEnd, endOpts);
      window.addEventListener("touchcancel", onTouchEnd, endOpts);

      removeTouchWindowListeners = (): void => {
        window.removeEventListener("touchmove", onTouchMove, moveOpts);
        window.removeEventListener("touchend", onTouchEnd, endOpts);
        window.removeEventListener("touchcancel", onTouchEnd, endOpts);
        removeTouchWindowListeners = null;
      };
    };

    const touchStartOpts: AddEventListenerOptions = {
      capture: true,
      passive: true,
    };
    el.addEventListener("pointerdown", onPointerDown, { capture: true });
    el.addEventListener("lostpointercapture", onLostPointerCapture);
    el.addEventListener("touchstart", onTouchStart, touchStartOpts);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown, { capture: true });
      el.removeEventListener("lostpointercapture", onLostPointerCapture);
      el.removeEventListener("touchstart", onTouchStart, touchStartOpts);
      resetPointer();
      resetTouch();
    };
  }, [containerRef, layout, onSwipeToEdit, onSwipeToView]);
}
