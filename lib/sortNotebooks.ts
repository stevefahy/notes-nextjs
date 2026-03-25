import { Notebook } from "../types";

const FALLBACK_DATE = "December 17, 1995 03:24:00";

/**
 * Newest `updatedAt` first (matches legacy React notebooks page behavior).
 * Does not mutate the input list.
 */
export function sortNotebooksLatestFirst(list: Notebook[]): Notebook[] {
  const normalized = list.map((nb) => ({
    ...nb,
    updatedAt:
      nb.updatedAt === "No date" || nb.updatedAt === undefined
        ? FALLBACK_DATE
        : nb.updatedAt,
  }));
  return [...normalized]
    .sort((a, b) => {
      if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }
      return a.updatedAt !== undefined ? 1 : -1;
    })
    .reverse();
}
