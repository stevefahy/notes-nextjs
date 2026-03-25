import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import { useAppDispatch } from "../../store/hooks";
import { dispatchErrorSnack } from "../../lib/dispatchSnack";
import {
  isBrowserOffline,
  runClientNavIfOnline,
} from "../../lib/clientOfflineNav";

const AC = APPLICATION_CONSTANTS;

export default function MenuDropdown() {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();
  const router = useRouter();

  const loading = status === "loading";
  const success = !!session;
  const details = session?.user;

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

  if (loading && !details) {
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
