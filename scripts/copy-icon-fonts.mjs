/**
 * Copies Material icon woff2 files from @fontsource packages into public/fonts.
 * Run after `npm install` (see package.json postinstall).
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "fonts");

const files = [
  [
    "node_modules/@fontsource/material-icons/files/material-icons-latin-400-normal.woff2",
    "material-icons-latin-400-normal.woff2",
  ],
  [
    "node_modules/@fontsource/material-icons-outlined/files/material-icons-outlined-latin-400-normal.woff2",
    "material-icons-outlined-latin-400-normal.woff2",
  ],
  [
    "node_modules/@fontsource-variable/material-symbols-outlined/files/material-symbols-outlined-latin-wght-normal.woff2",
    "material-symbols-outlined-latin-wght-normal.woff2",
  ],
];

mkdirSync(outDir, { recursive: true });
for (const [srcRel, name] of files) {
  copyFileSync(join(root, srcRel), join(outDir, name));
}
console.log("copy-icon-fonts: wrote", files.length, "files to public/fonts");
