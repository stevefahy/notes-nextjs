import APPLICATION_CONSTANTS from "../application_constants/applicationConstants";

const AC = APPLICATION_CONSTANTS;

export function normalizeErrorToString(
  err: unknown,
  fallback = AC.ERROR_FALLBACK,
): string {
  if (typeof err === "string") return err.trim() || fallback;
  if (err instanceof Error && err.message) return err.message;
  if (
    err != null &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  )
    return (err as { message: string }).message;
  const s = String(err ?? fallback);
  if (s === "[object Object]") return fallback;
  return s || fallback;
}

export function toUserFriendlyError(raw: unknown): string {
  const str = normalizeErrorToString(raw, AC.ERROR_FALLBACK);
  const lower = str.toLowerCase();
  if (lower.includes("[object object]")) return AC.ERROR_SERVER;
  if (
    lower.includes("failed to fetch") ||
    lower.includes("load failed") ||
    lower.includes("networkerror")
  )
    return AC.ERROR_NETWORK;
  if (lower.includes("not found") || lower.includes("404"))
    return AC.ERROR_NOT_FOUND;
  if (lower.includes("500") || lower.includes("internal server error"))
    return AC.ERROR_SERVER;
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("aborted")
  )
    return AC.ERROR_TIMEOUT;
  if (lower.includes("cors") || lower.includes("cross-origin"))
    return AC.ERROR_CORS;
  if (
    lower.includes("unexpected end of json") ||
    (lower.includes("json") && lower.includes("unexpected"))
  )
    return AC.ERROR_SERVER_UNREACHABLE;
  return str;
}

export function showErrorMessage(raw: unknown, fromServer?: boolean): string {
  if (fromServer === true)
    return normalizeErrorToString(raw, AC.ERROR_FALLBACK);
  return toUserFriendlyError(raw);
}
