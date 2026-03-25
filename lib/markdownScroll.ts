/** Scroll to an element by HTML id (used for markdown anchor + footnote UI). */
export function scrollToElementByHtmlId(id: string): void {
  if (!id) return;
  try {
    const esc = CSS.escape(id);
    const viewPane = document.getElementById("view");
    const el =
      (viewPane?.querySelector(`#${esc}`) as HTMLElement | null) ??
      document.getElementById(id) ??
      (document.querySelector(`#${esc}`) as HTMLElement | null);
    if (!el) return;
    // Prefer "start" over "nearest": inside overflow panes (e.g. #view) "nearest"
    // often skips scrolling when the target is only partially visible.
    el.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  } catch {
    /* invalid id */
  }
}
