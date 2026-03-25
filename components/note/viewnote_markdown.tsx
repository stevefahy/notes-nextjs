import React, { useCallback, useEffect, useMemo, useState } from "react";
import matter from "../../lib/matter";
import { scrollToElementByHtmlId } from "../../lib/markdownScroll";
import { SkeletonBlock } from "../ui/skeleton-block";
import type { ViewNoteMarkdownProps } from "../../types";

/** Same as Svelte `ViewNoteMarkdown.svelte` — task line detection for checkbox sync. */
const TASK_LINE_RE = /^\s*[-*+]\s+\[[xX \u00a0]\s*\]/;

/**
 * Note body markdown: **same pipeline as Svelte** (`notes-svelte-public/src/lib/markdown.ts`).
 * HTML from `markdown-it` + Prism `highlight` (incl. `<pre><code>` + `<p>lang</p>`) via
 * `dangerouslySetInnerHTML` — no react-markdown / custom `pre`+`code` bridging.
 */
const ViewNoteMarkdown = (props: ViewNoteMarkdownProps) => {
  const { viewText, disableLinks = false, updatedViewText } = props;
  const isReadOnly = updatedViewText == null;

  const [renderMarkdown, setRenderMarkdown] = useState<
    ((text: string, dl?: boolean) => string) | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    import("../../lib/markdown").then((mod) => {
      if (!cancelled) setRenderMarkdown(() => mod.renderMarkdown);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const html = useMemo(
    () => (renderMarkdown ? renderMarkdown(viewText, disableLinks) : ""),
    [renderMarkdown, viewText, disableLinks],
  );

  const handleMarkdownPointer = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      const target = event.target as HTMLElement;
      if (updatedViewText && target.tagName === "INPUT") {
        return;
      }

      const foot = target.closest<HTMLElement>("[data-md-footnote-scroll]");
      if (foot) {
        const to = foot.getAttribute("data-md-footnote-scroll");
        if (to) {
          event.preventDefault();
          scrollToElementByHtmlId(to);
        }
        return;
      }

      const anchor = target.closest<HTMLElement>(
        ".md_anchorlink[data-md-target-id]",
      );
      if (anchor) {
        const id = anchor.getAttribute("data-md-target-id");
        if (id) {
          event.preventDefault();
          scrollToElementByHtmlId(id);
        }
      }
    },
    [updatedViewText],
  );

  const handleMarkdownKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target as HTMLElement;
      const anchor = target.closest<HTMLElement>(
        ".md_anchorlink[data-md-target-id]",
      );
      if (!anchor || !anchor.contains(target)) return;
      const id = anchor.getAttribute("data-md-target-id");
      if (!id) return;
      event.preventDefault();
      scrollToElementByHtmlId(id);
    },
    [],
  );

  const handleCheckboxClick = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      if (!updatedViewText) return;
      const target = event.target as HTMLElement;
      if (target.tagName !== "INPUT") return;
      const input = target as HTMLInputElement;
      if (input.type !== "checkbox") return;
      const id = input.id;
      if (!id || !id.startsWith("cbx_")) return;
      const taskIndex = parseInt(id.slice(4), 10);
      if (isNaN(taskIndex) || taskIndex < 0) return;

      const checked = input.checked;

      const parsed = matter(viewText);
      const content = parsed.content;
      const lines = content.split("\n");
      let nth = 0;
      for (let i = 0; i < lines.length; i++) {
        if (TASK_LINE_RE.test(lines[i])) {
          if (nth === taskIndex) {
            lines[i] = lines[i].replace(
              /\[\s*(x|\s)\s*\]/i,
              checked ? "[x]" : "[ ]",
            );
            const newContent = lines.join("\n");
            const updatedFull =
              Object.keys(parsed.data).length > 0
                ? matter.stringify(newContent, parsed.data)
                : newContent;
            updatedViewText(updatedFull);
            return;
          }
          nth++;
        }
      }
    },
    [updatedViewText, viewText],
  );

  if (!renderMarkdown) {
    return <SkeletonBlock className="skeleton-view-placeholder" height={20} />;
  }

  return (
    <span
      className={
        isReadOnly ? "viewnote_content md-readonly" : "viewnote_content"
      }
      data-viewnote-markdown=""
      {...(!isReadOnly ? { role: "presentation" as const } : {})}
      onClick={
        updatedViewText
          ? (e) => {
              handleMarkdownPointer(e);
              handleCheckboxClick(e);
            }
          : handleMarkdownPointer
      }
      onKeyDown={handleMarkdownKeyDown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default ViewNoteMarkdown;
