let editScrollEl: HTMLElement | null = null;
let viewScrollEl: HTMLElement | null = null;
let editScrollHandler: (() => void) | null = null;
let viewScrollHandler: (() => void) | null = null;

let isSyncing = false;

/** Treat as “at bottom” so we snap target to its max (avoids drift when scrollHeight changes). */
const SCROLL_BOTTOM_EPS = 2;

export type SplitEnterScrollSnap = {
  from: "edit" | "view";
  atBottom: boolean;
  /** Relative position 0..1 in the source pane (full-width layout). */
  ratio: number;
};

function notePaneScroll(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  return root.querySelector<HTMLElement>(".note-pane-scroll") ?? root;
}

function removeScrollListeners(): void {
  if (editScrollEl && editScrollHandler) {
    editScrollEl.removeEventListener("scroll", editScrollHandler);
  }
  if (viewScrollEl && viewScrollHandler) {
    viewScrollEl.removeEventListener("scroll", viewScrollHandler);
  }
  editScrollEl = null;
  viewScrollEl = null;
  editScrollHandler = null;
  viewScrollHandler = null;
}

function syncScrollFromTo(from: HTMLElement, to: HTMLElement): void {
  const fromMax = from.scrollHeight - from.clientHeight;
  const toMax = to.scrollHeight - to.clientHeight;
  if (toMax <= 0) {
    isSyncing = true;
    to.scrollTop = 0;
    requestAnimationFrame(() => {
      isSyncing = false;
    });
    return;
  }
  if (fromMax > 0 && from.scrollTop >= fromMax - SCROLL_BOTTOM_EPS) {
    isSyncing = true;
    to.scrollTop = toMax;
    requestAnimationFrame(() => {
      isSyncing = false;
    });
    return;
  }
  const ratio = fromMax > 0 ? from.scrollTop / fromMax : 0;
  isSyncing = true;
  to.scrollTop = ratio * toMax;
  requestAnimationFrame(() => {
    isSyncing = false;
  });
}

function makeScrollHandler(
  source: HTMLElement,
  target: HTMLElement | null,
): () => void {
  return () => {
    if (isSyncing || !target) return;
    syncScrollFromTo(source, target);
  };
}

/** Call synchronously before turning split on so metrics are still from the single-column layout. */
export function captureSplitEnterScrollSnap(
  isView: boolean,
): SplitEnterScrollSnap | null {
  if (typeof document === "undefined") return null;
  const from = isView ? "view" : "edit";
  const root = document.querySelector(`#${from}`);
  const el = root instanceof HTMLElement ? notePaneScroll(root) : null;
  if (!el) return null;
  const max = el.scrollHeight - el.clientHeight;
  const atBottom = max > 0 && el.scrollTop >= max - SCROLL_BOTTOM_EPS;
  const ratio = max > 0 ? el.scrollTop / max : 0;
  return { from, atBottom, ratio };
}

function getEditViewScrollEls(): [HTMLElement, HTMLElement] | null {
  const editRoot = document.querySelector("#edit");
  const viewRoot = document.querySelector("#view");
  const editScroll =
    editRoot instanceof HTMLElement ? notePaneScroll(editRoot) : null;
  const viewScroll =
    viewRoot instanceof HTMLElement ? notePaneScroll(viewRoot) : null;
  if (!editScroll || !viewScroll) return null;
  return [editScroll, viewScroll];
}

function pinBothPanesToBottom(editScroll: HTMLElement, viewScroll: HTMLElement): void {
  isSyncing = true;
  editScroll.scrollTop = Math.max(0, editScroll.scrollHeight - editScroll.clientHeight);
  viewScroll.scrollTop = Math.max(0, viewScroll.scrollHeight - viewScroll.clientHeight);
  requestAnimationFrame(() => {
    isSyncing = false;
  });
}

/**
 * While split columns animate narrower, scrollHeight grows from reflow — keep “at bottom” by
 * re-pinning on resize. Does not attach scroll-sync listeners; call `onDone` then `initScrollSync`.
 */
export function stabilizeSplitEnterScroll(
  snap: SplitEnterScrollSnap,
  settleMs: number,
  onDone: () => void,
): () => void {
  const pair = getEditViewScrollEls();
  if (!pair) {
    requestAnimationFrame(() => onDone());
    return () => {};
  }
  const [editScroll, viewScroll] = pair;

  if (snap.atBottom) {
    pinBothPanesToBottom(editScroll, viewScroll);
    const ro = new ResizeObserver(() => {
      pinBothPanesToBottom(editScroll, viewScroll);
    });
    ro.observe(editScroll);
    ro.observe(viewScroll);
    const tid = window.setTimeout(() => {
      ro.disconnect();
      pinBothPanesToBottom(editScroll, viewScroll);
      onDone();
    }, settleMs);
    return () => {
      window.clearTimeout(tid);
      ro.disconnect();
    };
  }

  const tid = window.setTimeout(() => {
    const source = snap.from === "view" ? viewScroll : editScroll;
    const smax = source.scrollHeight - source.clientHeight;
    source.scrollTop = smax > 0 ? snap.ratio * smax : 0;
    syncScrollFromTo(
      source,
      snap.from === "view" ? editScroll : viewScroll,
    );
    requestAnimationFrame(() => {
      requestAnimationFrame(() => onDone());
    });
  }, settleMs);
  return () => window.clearTimeout(tid);
}

export function initScrollSync(): void {
  removeScrollListeners();
  const editRoot = document.querySelector("#edit");
  const viewRoot = document.querySelector("#view");
  editScrollEl =
    editRoot instanceof HTMLElement ? notePaneScroll(editRoot) : null;
  viewScrollEl =
    viewRoot instanceof HTMLElement ? notePaneScroll(viewRoot) : null;
  if (!editScrollEl || !viewScrollEl) return;

  editScrollHandler = makeScrollHandler(editScrollEl, viewScrollEl);
  viewScrollHandler = makeScrollHandler(viewScrollEl, editScrollEl);
  editScrollEl.addEventListener("scroll", editScrollHandler, {
    passive: true,
  });
  viewScrollEl.addEventListener("scroll", viewScrollHandler, {
    passive: true,
  });
}

/** Copy scroll position between panes when switching layout (double-rAF first if DOM just updated). */
export function alignNotePanesScroll(
  layout: "edit" | "view" | "split",
  splitEnterFrom: "edit" | "view" | null,
): void {
  const editRoot = document.querySelector("#edit");
  const viewRoot = document.querySelector("#view");
  const editScroll =
    editRoot instanceof HTMLElement ? notePaneScroll(editRoot) : null;
  const viewScroll =
    viewRoot instanceof HTMLElement ? notePaneScroll(viewRoot) : null;
  if (!editScroll || !viewScroll) return;

  if (layout === "view") {
    syncScrollFromTo(editScroll, viewScroll);
  } else if (layout === "edit") {
    syncScrollFromTo(viewScroll, editScroll);
  } else if (layout === "split") {
    if (splitEnterFrom === "edit") {
      syncScrollFromTo(editScroll, viewScroll);
    } else if (splitEnterFrom === "view") {
      syncScrollFromTo(viewScroll, editScroll);
    }
  }
}
