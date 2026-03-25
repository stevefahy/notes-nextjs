/**
 * Same role and filename as `notes-svelte-public/src/lib/markdown.ts` (markdown-it + Prism `highlight`).
 * Uses `import matter from "./matter"`. `markdown-it-emoji` light defs + `:name:` aliases from
 * `APPLICATION_CONSTANTS.SPECIAL_CHARACTERS` (e.g. `:crush:`, `:tear:`), merged into `defs` (required
 * because the plugin replaces `defs` when options are passed).
 * Prism: only javascript, css, markdown grammars are registered — add more `prismjs/components/*` imports here if needed.
 * When Svelte’s `markdown.ts` changes, update this file the same way — do not reimplement fenced code / `<p>lang</p>` in React-only code.
 */
import MarkdownIt from "markdown-it";
import { light as markdownItEmoji } from "markdown-it-emoji";
import lightEmojiDefs from "markdown-it-emoji/lib/data/light.mjs";
import markdownItFootnote from "markdown-it-footnote";
import markdownItSub from "markdown-it-sub";
import markdownItSup from "markdown-it-sup";
import markdownItIns from "markdown-it-ins";
import markdownItMark from "markdown-it-mark";
import markdownItAbbr from "markdown-it-abbr";
import markdownItAttrs from "markdown-it-attrs";
import markdownItTaskCheckbox from "markdown-it-task-checkbox";
import markdownItContainer from "markdown-it-container";
import markdownItAnchor from "markdown-it-anchor";
import matter from "./matter";
import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";
import {
  sanitizeCustomContainerStyles,
  sanitizeCustomCssClasses,
  sanitizeMarkdownTargetId,
} from "./markdownSafeStyles";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markdown";

// Map "md" to markdown language
const langAliases: Record<string, string> = { md: "markdown" };

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  langPrefix: "language-",
  breaks: false,
  highlight: (str: string, lang?: string): string => {
    const prismLang = lang ? (langAliases[lang] ?? lang) : undefined;
    if (prismLang && prismLang in Prism.languages) {
      const gram = Prism.languages[prismLang as keyof typeof Prism.languages];
      const highlighted = Prism.highlight(str, gram, prismLang);
      return (
        `<pre class="language-${prismLang}"><code class="language-${prismLang}">${highlighted}</code></pre>` +
        `<p>${md.utils.escapeHtml(lang ?? "")}</p>`
      );
    }
    return (
      `<pre><code>${md.utils.escapeHtml(str)}</code></pre>` +
      (lang ? `<p>${md.utils.escapeHtml(lang)}</p>` : "")
    );
  },
});

// Add a ruler to recognize <br> as a hardbreak
md.inline.ruler.push("html_br", (state, silent) => {
  if (state.src.slice(state.pos, state.pos + 4) === "<br>") {
    if (!silent) {
      state.push("hardbreak", "br", 0);
    }
    state.pos += 4;
    return true;
  }
  if (state.src.slice(state.pos, state.pos + 5) === "<br/>") {
    if (!silent) {
      state.push("hardbreak", "br", 0);
    }
    state.pos += 5;
    return true;
  }
  return false;
});

/** `:name:` entries from SPECIAL_CHARACTERS → markdown-it-emoji def keys (e.g. :crush: → crush). */
function emojiAliasDefsFromSpecialChars(
  entries: { char: string; display: string }[],
): Record<string, string> {
  const re = /^:([a-z0-9_+-]+):$/i;
  const out: Record<string, string> = {};
  for (const { char, display } of entries) {
    const m = char.match(re);
    if (m) out[m[1]] = display;
  }
  return out;
}

md.use(markdownItEmoji, {
  defs: {
    ...lightEmojiDefs,
    ...emojiAliasDefsFromSpecialChars(APPLICATION_CONSTANTS.SPECIAL_CHARACTERS),
  },
});
md.use(markdownItFootnote);
md.use(markdownItSub);
md.use(markdownItSup);
md.use(markdownItIns);
md.use(markdownItMark);
md.use(markdownItAbbr);
md.use(markdownItAttrs, {
  leftDelimiter: "xx",
  rightDelimiter: "xx",
  allowedAttributes: [],
});
md.use(markdownItTaskCheckbox, {
  disabled: false,
  divWrap: true,
  divClass: "custom-checkbox",
  idPrefix: "cbx_",
  ulClass: "task-list",
  liClass: "task-list-item",
});
md.use(markdownItAnchor, {
  level: 1,
  permalink: false,
  permalinkClass: "header-anchor",
  permalinkSymbol: "¶",
  permalinkBefore: false,
});

// Parse {{w:32,h:32}} from image alt text for dimensions
function getSize(node: string): {
  width: string | number;
  height: string | number;
} {
  const defaultW = 100;
  const defaultH = 100;
  const substrings = node.split("{{");
  const regexW = /w:\d.*\b/;
  const regexH = /h:\d.*\b/;
  let resultW: RegExpMatchArray | null = null;
  let resultH: RegExpMatchArray | null = null;
  if (substrings[1]) {
    resultW = substrings[1].match(regexW);
    resultH = substrings[1].match(regexH);
  }
  if (
    substrings[1] &&
    substrings[1].includes("}}") &&
    resultW !== null &&
    resultH !== null
  ) {
    const wMatch = substrings[1].match(/(?<=w:\s?)\d+/g);
    const hMatch = substrings[1].match(/(?<=h:\s?)\d+/g);
    return {
      width: wMatch ? wMatch[0] : defaultW,
      height: hMatch ? hMatch[0] : defaultH,
    };
  }
  return { width: defaultW, height: defaultH };
}

// Stack to track anchor links for link_close (supports nested links)
const anchorLinkStack: boolean[] = [];

// Store default renderers
const defaultLinkOpen = md.renderer.rules.link_open;

md.renderer.rules.link_open = function (tokens, idx, options, env, slf) {
  const e = env as { disableLinks?: boolean };
  if (e?.disableLinks) {
    anchorLinkStack.push(false);
    return "";
  }
  const aIndex = tokens[idx].attrIndex("target");
  const hIndex = tokens[idx].attrIndex("href");
  if (aIndex < 0 && tokens[idx].attrs) {
    tokens[idx].attrPush(["target", "_blank"]);
  } else if (aIndex >= 0 && tokens[idx].attrs) {
    tokens[idx].attrs[aIndex][1] = "_blank";
  }
  if (hIndex >= 0 && tokens[idx].attrs) {
    const linkText = tokens[idx].attrs[hIndex][1];
    if (linkText.charAt(0) === "#") {
      anchorLinkStack.push(true);
      if (tokens[idx].attrs) tokens[idx].attrs[hIndex][1] = "#";
      let frag = linkText.slice(1);
      if (frag.startsWith("user-content-")) {
        frag = frag.slice("user-content-".length);
      }
      const safeId = sanitizeMarkdownTargetId(frag);
      const idAttr = safeId ? md.utils.escapeHtml(safeId) : "";
      return (
        '<span class="md_anchorlink" role="link" tabindex="0" data-md-target-id="' +
        idAttr +
        '">'
      );
    }
  }
  anchorLinkStack.push(false);
  return (
    defaultLinkOpen?.(tokens, idx, options, env, slf) ??
    slf.renderToken(tokens, idx, options)
  );
};

const defaultLinkClose = md.renderer.rules.link_close;

md.renderer.rules.link_close = function (tokens, idx, options, env, slf) {
  const e = env as { disableLinks?: boolean };
  if (e?.disableLinks) {
    anchorLinkStack.pop();
    return "";
  }
  const wasAnchor = anchorLinkStack.pop();
  if (wasAnchor) {
    return "</span>";
  }
  return (
    defaultLinkClose?.(tokens, idx, options, env, slf) ??
    slf.renderToken(tokens, idx, options)
  );
};

// Add class to table
md.renderer.rules.table_open = () => '<table class="table table-striped">';

// Add width and height to images from {{w:N,h:N}} syntax
md.renderer.rules.image = function (tokens, idx, options, env, slf) {
  const token = tokens[idx];
  if (token.attrs) {
    const altIndex = token.attrIndex("alt");
    if (altIndex >= 0 && token.children) {
      token.attrs[altIndex][1] = slf.renderInlineAsText(
        token.children,
        options,
        env,
      ) as string;
    }
    const size = getSize(token.attrs[token.attrIndex("alt")][1]);
    token.attrSet("width", size.width + "px");
    token.attrSet("height", size.height + "px");
  }
  return (
    '<span class="image">' + slf.renderToken(tokens, idx, options) + "</span>"
  );
};

// Footnotes: delegated scroll via data-md-footnote-scroll (no inline handlers)
md.renderer.rules.footnote_anchor = function (tokens, idx, options, env, slf) {
  const id =
    (slf.rules.footnote_anchor_name?.(tokens, idx, options, env, slf) ?? "") +
    (tokens[idx].meta?.subId && tokens[idx].meta.subId > 0
      ? ":" + tokens[idx].meta.subId
      : "");
  const escId = md.utils.escapeHtml(id);
  return (
    '<span class="footnote-backref" data-md-footnote-scroll="fnref' +
    escId +
    '" id="fnref' +
    escId +
    '">\u21a9\uFE0E</span>'
  );
};

md.renderer.rules.footnote_ref = function (tokens, idx, options, env, slf) {
  const id =
    slf.rules.footnote_anchor_name?.(tokens, idx, options, env, slf) ?? "";
  const caption =
    slf.rules.footnote_caption?.(tokens, idx, options, env, slf) ?? "";
  const refid =
    id +
    (tokens[idx].meta?.subId && tokens[idx].meta.subId > 0
      ? ":" + tokens[idx].meta.subId
      : "");
  const escRef = md.utils.escapeHtml(refid);
  const escId = md.utils.escapeHtml(id);
  return (
    '<sup class="footnote-ref"><span class="md-footnote-ref" data-md-footnote-scroll="fn' +
    escId +
    '" id="fnref' +
    escRef +
    '">' +
    caption +
    "</span></sup>"
  );
};

// Custom container: allowlisted inline styles only (see markdownSafeStyles)
md.use(markdownItContainer, "custom", {
  validate: (params: string) => !!params.trim().match(/^custom\s+(.*)$/),
  render: (
    tokens: { info: string; nesting: number }[],
    idx: number,
    _options: unknown,
    _env: unknown,
    _slf: { renderToken: (...args: unknown[]) => string },
  ) => {
    const m = tokens[idx].info.trim().match(/^custom\s+(.*)$/);
    if (tokens[idx].nesting === 1) {
      const safe = sanitizeCustomContainerStyles(m![1] ?? "");
      if (safe) return '<span style="' + md.utils.escapeHtml(safe) + '">\n';
      return '<span class="md-custom-unstyled">\n';
    }
    return "</span>\n";
  },
});

md.use(markdownItContainer, "custom-css", {
  validate: (params: string) => !!params.trim().match(/^custom-css\s+(.*)$/),
  render: (
    tokens: { info: string; nesting: number }[],
    idx: number,
    options: unknown,
    env: unknown,
    slf: { renderToken: (...args: unknown[]) => string },
  ) => {
    if (tokens[idx].nesting === 1) {
      const m = tokens[idx].info.trim().match(/^custom-css\s+(.*)$/);
      if (!m) return slf.renderToken(tokens, idx, options, env, slf);
      const classes = sanitizeCustomCssClasses(m[1]);
      if (classes)
        return '<span class="' + md.utils.escapeHtml(classes) + '">\n';
      return '<span class="md-custom-css-fallback">\n';
    }
    return "</span>\n";
  },
});

export function renderMarkdown(text: string, disableLinks = false): string {
  if (!text) return "";
  const { content } = matter(text);
  return md.render(content, { disableLinks });
}
