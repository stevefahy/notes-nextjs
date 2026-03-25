let editScrollEl: HTMLElement | null = null;
let viewScrollEl: HTMLElement | null = null;
let editScrollHandler: (() => void) | null = null;
let viewScrollHandler: (() => void) | null = null;

let isSyncing = false;

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
