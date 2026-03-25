/** Sets --jsvh and --jsheader-height on :root (see theme-variables.css). */
export function setScreenHeight(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const jsvh = window.innerHeight;
  const header_height = document
    .getElementById("header_height")
    ?.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--jsvh", `${jsvh}px`);
  document.documentElement.style.setProperty(
    "--jsheader-height",
    `${header_height ?? 0}`,
  );
}
