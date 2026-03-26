import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import { useAppDispatch } from "../../store/hooks";
import { dispatchErrorSnack } from "../../lib/dispatchSnack";
import {
  isBrowserOffline,
  runClientNavIfOnline,
} from "../../lib/clientOfflineNav";

const AC = APPLICATION_CONSTANTS;

/** Same as NextAuth’s client fetch — matches the session cookie after login. useSession() often lags here. */
async function fetchSessionFromApi(): Promise<Session | null> {
  const res = await fetch("/api/auth/session", { credentials: "same-origin" });
  const data = (await res.json()) as Session | Record<string, never>;
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return null;
  }
  return data as Session;
}

function hasSignedInUser(s: Session | null | undefined): boolean {
  return (
    s?.user != null &&
    typeof (s.user as { email?: unknown }).email === "string"
  );
}

export default function MenuDropdown() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [navSession, setNavSession] = useState<Session | null | undefined>(
    undefined,
  );

  const loading = navSession === undefined;
  const success = hasSignedInUser(navSession);

  const [open, setOpen] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setOpen((o) => !o);
    setRippleKey((k) => k + 1);
  };

  const close = useCallback(() => setOpen(false), []);

  const handleProfile = () => {
    close();
    runClientNavIfOnline(dispatch, () => void router.push("/profile"));
  };

  const loginHandler = () => {
    close();
    runClientNavIfOnline(dispatch, () => void router.push(AC.LOGIN_PAGE));
  };

  const handleLogout = async () => {
    close();
    if (isBrowserOffline()) {
      dispatchErrorSnack(dispatch, new Error("Failed to fetch"), false);
      return;
    }
    try {
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      dispatchErrorSnack(dispatch, e, false);
    }
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        open &&
        e.target instanceof Node &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, close]);

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await fetchSessionFromApi();
        if (!cancelled) setNavSession(s);
      } catch {
        if (!cancelled) setNavSession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.asPath]);

  if (loading) {
    return null;
  }

  return (
    <div className="nav_menu" ref={dropdownRef}>
      <div className="dropdown">
        <button
          type="button"
          className={`icon profile-trigger${open ? " is-active" : ""}`}
          onClick={toggleMenu}
          onKeyDown={(e) => e.key === "Escape" && close()}
          aria-haspopup="true"
          aria-expanded={open}
        >
          {rippleKey > 0 ? (
            <span key={rippleKey} className="ripple-burst" aria-hidden />
          ) : null}
          <span className="material-icons-outlined menu_item">person</span>
        </button>

        {open ? (
          <div className="dropdown-menu" role="menu">
            {success ? (
              <button
                type="button"
                className="dropdown-item"
                onClick={handleProfile}
                role="menuitem"
              >
                <span className="material-icons-outlined menu_item">
                  person
                </span>
                Profile
              </button>
            ) : null}
            {!success ? (
              <button
                type="button"
                className="dropdown-item"
                onClick={loginHandler}
                role="menuitem"
              >
                <span className="material-icons menu_item">login</span>
                Sign in
              </button>
            ) : null}
            {success ? (
              <button
                type="button"
                className="dropdown-item"
                onClick={() => void handleLogout()}
                role="menuitem"
              >
                <span className="material-icons menu_item danger_icon">
                  logout
                </span>
                Sign out
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
