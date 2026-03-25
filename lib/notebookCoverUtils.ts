export type NotebookCoverType = "forest" | "emerald" | "lime" | "sage";

const LEGACY_COVER_MAP: Record<string, NotebookCoverType> = {
  default: "sage",
  red: "forest",
  green: "lime",
  blue: "emerald",
};

export function getDisplayCover(cover: string | undefined): NotebookCoverType {
  if (!cover) return "sage";
  const normalized = cover.toLowerCase();
  return (LEGACY_COVER_MAP[normalized] ?? normalized) as NotebookCoverType;
}
