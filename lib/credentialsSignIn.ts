import type { SignInResponse } from "next-auth/react";
import { getCsrfToken, getSession } from "next-auth/react";

/**
 * NextAuth client `signIn("credentials", { redirect: false })` calls `getProviders()` first.
 * When that fetch fails (offline / network error), next-auth redirects to `/api/auth/error`
 * and never returns — so the login form cannot show an inline error.
 * This helper performs the same credentials POST without that redirect.
 */
function nextAuthBasePath(): string {
  const raw = process.env.NEXTAUTH_URL;
  if (!raw) return "/api/auth";
  const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    const defaultPath = "/api/auth";
    const path =
      u.pathname === "/" || u.pathname === ""
        ? defaultPath
        : u.pathname.replace(/\/$/, "");
    return path || defaultPath;
  } catch {
    return "/api/auth";
  }
}

function callbackErrorFromUrl(redirectUrl: string): string | null {
  try {
    const u = redirectUrl.startsWith("http")
      ? new URL(redirectUrl)
      : new URL(redirectUrl, window.location.origin);
    return u.searchParams.get("error");
  } catch {
    return null;
  }
}

export async function signInCredentials(options: {
  email: string;
  password: string;
  callbackUrl?: string;
}): Promise<SignInResponse> {
  const callbackUrl =
    options.callbackUrl ??
    (typeof window !== "undefined" ? window.location.href : "/");

  const csrfToken = await getCsrfToken();
  if (!csrfToken) {
    return {
      error: "Failed to fetch",
      status: 0,
      ok: false,
      url: null,
    };
  }

  const params = new URLSearchParams();
  params.set("csrfToken", csrfToken);
  params.set("callbackUrl", callbackUrl);
  params.set("json", "true");
  params.set("redirect", "false");
  params.set("email", options.email);
  params.set("password", options.password);

  const path = `${nextAuthBasePath()}/callback/credentials`;

  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      credentials: "include",
    });
  } catch {
    return {
      error: "Failed to fetch",
      status: 0,
      ok: false,
      url: null,
    };
  }

  let data: { url?: string };
  try {
    data = await res.json();
  } catch {
    return {
      error: "CredentialsSignin",
      status: res.status,
      ok: false,
      url: null,
    };
  }

  const redirectUrl = data.url ?? callbackUrl;
  const error = callbackErrorFromUrl(redirectUrl);

  if (res.ok) {
    await getSession({ event: "storage" });
  }

  return {
    error,
    status: res.status,
    ok: res.ok,
    url: error ? null : redirectUrl,
  };
}
