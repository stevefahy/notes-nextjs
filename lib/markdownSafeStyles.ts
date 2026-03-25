/**
 * Allowlisted inline CSS for markdown `::: custom ...` blocks only.
 * Rejects url(), expression(), behavior, etc.
 */
const DECL_RE =
  /^\s*(font-size|color|font-weight|text-align|text-decoration|height|width|max-width|display|vertical-align|margin-inline-start|margin-inline-end|margin-block-start|margin-block-end)\s*:\s*(.+?)\s*$/i;

const LENGTH_VAL = /^\d+(\.\d+)?(px|em|rem|%)$/;
/** Unitless 0 or non-negative lengths (logical margins in `::: custom`). */
const MARGIN_INSET_VAL = /^(0|\d+(\.\d+)?(px|em|rem|%))$/;
const FONT_WEIGHT_VAL = /^(normal|bold|bolder|lighter|\d{3})$/;
const TEXT_ALIGN_VAL = /^(left|right|center|justify|start|end)$/;
const TEXT_DECO_VAL = /^(none|underline|line-through|overline)$/i;
/** Safe subset for layout inside `::: custom` blocks (no url/expression). */
const DISPLAY_VAL =
  /^(block|inline|inline-block|inline-flex|flex|grid|flow-root|table|table-row|table-cell|none)$/i;
const VERTICAL_ALIGN_VAL =
  /^(baseline|sub|super|top|text-top|middle|bottom|text-bottom)$/i;
const COLOR_VAL =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|[a-z]{3,20})$/i;

function isSafeColorValue(v: string): boolean {
  const t = v.trim();
  if (!COLOR_VAL.test(t)) return false;
  if (/url\s*\(/i.test(t)) return false;
  return true;
}

export function sanitizeCustomContainerStyles(raw: string): string {
  const parts: string[] = [];
  for (const piece of raw.split(";")) {
    const m = piece.match(DECL_RE);
    if (!m) continue;
    const prop = m[1].toLowerCase();
    const val = m[2].trim();
    let ok = false;
    if (prop === "font-size" && LENGTH_VAL.test(val)) ok = true;
    else if (prop === "height" && LENGTH_VAL.test(val)) ok = true;
    else if (prop === "width" && LENGTH_VAL.test(val)) ok = true;
    else if (prop === "max-width" && LENGTH_VAL.test(val)) ok = true;
    else if (
      (prop === "margin-inline-start" ||
        prop === "margin-inline-end" ||
        prop === "margin-block-start" ||
        prop === "margin-block-end") &&
      MARGIN_INSET_VAL.test(val)
    )
      ok = true;
    else if (prop === "font-weight" && FONT_WEIGHT_VAL.test(val)) ok = true;
    else if (prop === "text-align" && TEXT_ALIGN_VAL.test(val)) ok = true;
    else if (prop === "text-decoration" && TEXT_DECO_VAL.test(val)) ok = true;
    else if (prop === "display" && DISPLAY_VAL.test(val)) ok = true;
    else if (prop === "vertical-align" && VERTICAL_ALIGN_VAL.test(val))
      ok = true;
    else if (prop === "color" && isSafeColorValue(val)) ok = true;
    if (ok) parts.push(`${prop}: ${val}`);
  }
  return parts.join("; ");
}

/** Safe HTML `class` list for `::: custom-css ...` (no `../`, no special chars). */
const CLASS_TOKEN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export function sanitizeCustomCssClasses(raw: string): string {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  const safe = tokens.filter((t) => CLASS_TOKEN.test(t));
  return safe.join(" ");
}

/**
 * Fragment for in-doc anchor navigation (after `#` processing).
 * Must match heading `id` values from markdown-it-anchor, which uses
 * `encodeURIComponent` — so `%` hex sequences are valid.
 */
const SIMPLE_TARGET_RE = /^[\w.-]+$/;
const ENCODED_TARGET_RE = /^[\w.~+@%+-]+$/i;

export function sanitizeMarkdownTargetId(fragment: string): string | null {
  const raw = fragment.trim();
  if (!raw) return null;
  if (SIMPLE_TARGET_RE.test(raw)) return raw;
  if (!ENCODED_TARGET_RE.test(raw) || /%(?![0-9A-Fa-f]{2})/i.test(raw)) {
    return null;
  }
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.length > 256) return null;
    if (/[\s\u0000-\u001F\u007F<>"]/.test(decoded)) return null;
    return raw;
  } catch {
    return null;
  }
}
