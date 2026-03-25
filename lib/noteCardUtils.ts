import fm from "front-matter";

/**
 * Maximum number of plain-text characters shown as the note card title.
 * Increase this value to show longer titles.
 */
export const TITLE_MAX_CHARS = 10;

/**
 * Converts one line of markdown to plain text.
 */
function toPlainText(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\{\{(?:[^}:]*:)?([^}]*)\}\}/g, "$1")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*+]\s+\[[ xX]\]\s*/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^>\s*/, "")
    .replace(/^:{3}.*/, "")
    .replace(/[*_~]{1,3}([^*_~\n]*)[*_~]{1,3}/g, "$1")
    .replace(/`{3}[^`]*`{3}/g, "")
    .replace(/`{2}([^`]*)`{2}/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~`#>|\\{}[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const STRUCTURAL_LINE = /^[-*_=]{3,}$|^`{3}|^:{3}/;

/**
 * Extracts the display title from a note's markdown content.
 */
export function extractNoteTitle(content: string): string {
  if (!content?.trim()) return "Untitled";
  const body = (fm(content).body ?? content).trim();

  const parts: string[] = [];
  let inCodeBlock = false;

  for (const rawLine of body.split("\n")) {
    const trimmed = rawLine.trim();

    if (/^`{3}/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (!trimmed) continue;
    if (STRUCTURAL_LINE.test(trimmed)) continue;

    const plain = toPlainText(trimmed);
    if (!plain) continue;

    parts.push(plain);
    if (parts.join(" ").length >= TITLE_MAX_CHARS) break;
  }

  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return "Untitled";

  return text.length > TITLE_MAX_CHARS
    ? text.slice(0, TITLE_MAX_CHARS) + "…"
    : text;
}

/**
 * Detects the primary content type of a note for the tag pill.
 */
export function detectNoteTag(
  content: string,
): "todo" | "table" | "code" | "image" | "list" | "text" | "empty" {
  if (!content?.trim()) return "empty";
  const body = (fm(content).body ?? content).trim();
  if (!body) return "empty";

  if (/^[ \t]*[-*+]\s+\[[ xX]\]/m.test(body)) return "todo";
  if (/^\|.+\|/m.test(body)) return "table";
  if (/^`{3}/m.test(body)) return "code";
  if (/!\[.*?\]\(.*?\)/m.test(body)) return "image";
  if (/^[ \t]*[-*+]\s+/m.test(body) || /^[ \t]*\d+\.\s+/m.test(body)) {
    return "list";
  }
  if (/\S/.test(body)) return "text";
  return "empty";
}
