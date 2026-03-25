import React, { useCallback, useMemo, useState } from "react";
import classes from "./profile-form.module.css";
import type { IAuthDetails, ProfileFormProps } from "../../types";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import { unwrapResponse } from "../../lib/unwrapResponse";
import {
  toUserFriendlyError,
  showErrorMessage,
} from "../../lib/errorMessageMap";
import { useAppDispatch } from "../../store/hooks";
import { dispatchSuccessSnack } from "../../lib/dispatchSnack";

const AC = APPLICATION_CONSTANTS;

const UserTabIcon = () => (
  <svg
    className={classes.tabIcon}
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PassTabIcon = () => (
  <svg
    className={classes.tabIcon}
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ErrorGlyph = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
    <circle cx="6" cy="6" r="5.5" fill="#c0392b" />
    <path
      d="M6 3.5v3M6 8v.5"
      stroke="white"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

async function patchUsername(
  newUsername: string,
  userEmail: string,
  userId: string,
): Promise<
  | { success: true; details: IAuthDetails; error?: never }
  | { error: string; fromServer?: boolean; success?: never }
> {
  let res: Response;
  try {
    res = await fetch("/api/auth/user/change-username", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newUsername }),
    });
  } catch (e) {
    return { error: toUserFriendlyError(e), fromServer: false };
  }
  let data: { error?: string } = {};
  try {
    data = (await res.json()) as { error?: string };
  } catch {
    /* non-JSON body */
  }
  if (res.status === 401) {
    return { error: AC.UNAUTHORIZED, fromServer: false };
  }
  if (!res.ok) {
    return {
      error:
        typeof data.error === "string"
          ? data.error
          : res.status >= 500
            ? AC.ERROR_SERVER_UNREACHABLE
            : AC.CHANGE_USER_ERROR,
      fromServer: true,
    };
  }
  return {
    success: true,
    details: {
      username: newUsername.trim(),
      email: userEmail,
      _id: userId,
      authStrategy: "credentials",
      __v: 0,
    },
  };
}

async function patchPassword(
  oldPassword: string,
  newPassword: string,
): Promise<
  | { success: true; error?: never }
  | { error: string; fromServer?: boolean; success?: never }
> {
  let res: Response;
  try {
    res = await fetch("/api/auth/user/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  } catch (e) {
    return { error: toUserFriendlyError(e), fromServer: false };
  }
  let data: { error?: string } = {};
  try {
    data = (await res.json()) as { error?: string };
  } catch {
    /* non-JSON body */
  }
  if (res.status === 401) {
    return { error: AC.UNAUTHORIZED, fromServer: false };
  }
  if (!res.ok) {
    return {
      error:
        typeof data.error === "string"
          ? showErrorMessage(data.error, true)
          : res.status >= 500
            ? AC.ERROR_SERVER_UNREACHABLE
            : AC.CHANGE_PASS_ERROR,
      fromServer: true,
    };
  }
  return { success: true };
}

const ProfileForm = ({
  userName,
  onSessionRefresh,
  userEmail = "",
  userId = "",
}: ProfileFormProps) => {
  const dispatch = useAppDispatch();

  const [newUsername, setNewUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameServerError, setUsernameServerError] = useState("");
  const [passwordServerError, setPasswordServerError] = useState("");
  const [activeTab, setActiveTab] = useState<"user" | "pass">("user");
  const [tooltipSuppressed, setTooltipSuppressed] = useState(false);

  const usernameError = useMemo((): string => {
    const len = newUsername.length;
    if (len === 0) return "";
    if (len > AC.USERNAME_MAX)
      return `Too long — max ${AC.USERNAME_MAX} characters`;
    if (newUsername.trim() === userName) return "Same as your current username";
    if (newUsername.trim().length < AC.USERNAME_MIN)
      return `At least ${AC.USERNAME_MIN} characters required`;
    return "";
  }, [newUsername, userName]);

  const usernameValid = useMemo(
    () =>
      newUsername.length > 0 &&
      newUsername.length <= AC.USERNAME_MAX &&
      newUsername.trim() !== userName &&
      newUsername.trim().length >= AC.USERNAME_MIN,
    [newUsername, userName],
  );

  const usernameTooltip = useMemo(
    () =>
      usernameError ||
      (newUsername.length === 0 ? "Enter a new username to save" : ""),
    [usernameError, newUsername.length],
  );

  const passwordError = useMemo((): string => {
    if (!newPassword || !oldPassword) return "";
    if (newPassword === oldPassword)
      return "Must differ from your current password";
    if (newPassword.length < AC.PASSWORD_MIN)
      return `At least ${AC.PASSWORD_MIN} characters required`;
    if (newPassword.length > AC.PASSWORD_MAX)
      return `Max ${AC.PASSWORD_MAX} characters`;
    return "";
  }, [newPassword, oldPassword]);

  const passwordValid = useMemo(
    () =>
      !!oldPassword &&
      !!newPassword &&
      newPassword !== oldPassword &&
      newPassword.length >= AC.PASSWORD_MIN &&
      newPassword.length <= AC.PASSWORD_MAX,
    [oldPassword, newPassword],
  );

  const passwordTooltip = useMemo(
    () =>
      passwordError ||
      (!oldPassword || !newPassword ? "Fill in both fields to continue" : ""),
    [passwordError, oldPassword, newPassword],
  );

  const strengthScore = useMemo((): number => {
    let s = 0;
    if (newPassword.length >= AC.PASSWORD_MIN) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  }, [newPassword]);

  const strengthClass = useMemo(
    () => (strengthScore <= 1 ? "weak" : strengthScore <= 2 ? "ok" : "good"),
    [strengthScore],
  );

  const suppressTooltip = useCallback(() => setTooltipSuppressed(true), []);
  const resetTooltip = useCallback(() => setTooltipSuppressed(false), []);

  const handleTooltipKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        suppressTooltip();
      }
    },
    [suppressTooltip],
  );

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameValid) return;
    setIsSubmitting(true);
    const raw = await patchUsername(newUsername.trim(), userEmail, userId);
    const result = unwrapResponse<{ success: true; details: IAuthDetails }>(
      raw,
    );
    setIsSubmitting(false);
    if (!result.ok) {
      setUsernameServerError(
        result.fromServer === true
          ? (result.error ?? AC.GENERAL_ERROR)
          : toUserFriendlyError(result.error ?? AC.GENERAL_ERROR),
      );
    } else if ("details" in result.data && result.data.details) {
      setUsernameServerError("");
      dispatchSuccessSnack(dispatch, "User name changed!");
      setNewUsername("");
      await onSessionRefresh?.();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) return;
    setIsSubmitting(true);
    const raw = await patchPassword(oldPassword, newPassword);
    const result = unwrapResponse<{ success: true }>(raw);
    setIsSubmitting(false);
    if (!result.ok) {
      setPasswordServerError(
        result.fromServer === true
          ? (result.error ?? AC.GENERAL_ERROR)
          : toUserFriendlyError(result.error ?? AC.GENERAL_ERROR),
      );
    } else {
      setPasswordServerError("");
      dispatchSuccessSnack(dispatch, "Password updated");
      setOldPassword("");
      setNewPassword("");
    }
  };

  if (!userEmail && !userName) {
    return null;
  }

  return (
    <div className={classes.pfOuter}>
      <div className={classes.tabContainer}>
        <div
          className={classes.tabs}
          role="tablist"
          aria-label="Profile settings"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "user"}
            className={`${classes.tab} ${activeTab === "user" ? classes.tabActive : ""}`}
            onClick={() => setActiveTab("user")}
          >
            <UserTabIcon />
            Username
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pass"}
            className={`${classes.tab} ${activeTab === "pass" ? classes.tabActive : ""}`}
            onClick={() => setActiveTab("pass")}
          >
            <PassTabIcon />
            Password
          </button>
        </div>

        <div className={classes.tabPanel} role="tabpanel">
          {activeTab === "user" && (
            <div className={classes.tabContent}>
              <form onSubmit={handleChangeUsername} noValidate>
                <div className={classes.formField}>
                  <label className={classes.formLabel} htmlFor="newUsername">
                    New Username
                  </label>
                  <input
                    className={`${classes.formInput} ${
                      usernameError || usernameServerError
                        ? classes.inputError
                        : ""
                    }`}
                    type="text"
                    id="newUsername"
                    name="newUsername"
                    value={newUsername}
                    onChange={(ev) => {
                      setNewUsername(ev.target.value);
                      setUsernameServerError("");
                    }}
                    placeholder="Enter new username"
                    autoComplete="username"
                  />
                </div>
                <div className={classes.fieldFeedback}>
                  <div
                    className={`${classes.inlineError} ${
                      usernameServerError || usernameError
                        ? classes.inlineErrorVisible
                        : ""
                    }`}
                  >
                    <ErrorGlyph />
                    <span>{usernameServerError || usernameError}</span>
                  </div>
                  <span
                    className={`${classes.charCounter} ${
                      newUsername.length > AC.USERNAME_MAX
                        ? classes.charCounterOver
                        : ""
                    }`}
                  >
                    {newUsername.length} / {AC.USERNAME_MAX}
                  </span>
                </div>
                <div
                  className={`${classes.btnWrap} ${classes.btnWrapInteractive}`}
                  onClick={suppressTooltip}
                  onKeyDown={handleTooltipKeydown}
                  onMouseLeave={resetTooltip}
                  role="button"
                  tabIndex={0}
                >
                  {!usernameValid && !tooltipSuppressed && (
                    <div className={classes.btnTooltip}>{usernameTooltip}</div>
                  )}
                  <button
                    type="submit"
                    className={classes.btnSave}
                    disabled={!usernameValid || isSubmitting}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "pass" && (
            <div className={classes.tabContent}>
              <form onSubmit={handleChangePassword} noValidate>
                <div className={classes.formField}>
                  <label className={classes.formLabel} htmlFor="oldPassword">
                    Current Password
                  </label>
                  <input
                    className={`${classes.formInput} ${
                      passwordServerError ? classes.inputError : ""
                    }`}
                    type="password"
                    id="oldPassword"
                    name="oldPassword"
                    value={oldPassword}
                    onChange={(ev) => {
                      setOldPassword(ev.target.value);
                      setPasswordServerError("");
                    }}
                    placeholder="Current password"
                    autoComplete="current-password"
                  />
                </div>
                <div className={classes.fieldFeedback}>
                  <div
                    className={`${classes.inlineError} ${
                      passwordServerError ? classes.inlineErrorVisible : ""
                    }`}
                  >
                    <ErrorGlyph />
                    <span>{passwordServerError}</span>
                  </div>
                </div>

                <div className={classes.formField}>
                  <label className={classes.formLabel} htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    className={`${classes.formInput} ${
                      passwordError ? classes.inputError : ""
                    }`}
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(ev) => setNewPassword(ev.target.value)}
                    placeholder={`Min. ${AC.PASSWORD_MIN} characters`}
                    autoComplete="new-password"
                  />
                </div>
                <div className={classes.strengthRow} aria-hidden>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`${classes.barSeg} ${
                        i <= strengthScore && strengthClass === "weak"
                          ? classes.barSegWeak
                          : ""
                      } ${
                        i <= strengthScore && strengthClass === "ok"
                          ? classes.barSegOk
                          : ""
                      } ${
                        i <= strengthScore && strengthClass === "good"
                          ? classes.barSegGood
                          : ""
                      }`}
                    />
                  ))}
                </div>
                <div className={classes.fieldFeedback}>
                  <div
                    className={`${classes.inlineError} ${
                      passwordError ? classes.inlineErrorVisible : ""
                    }`}
                  >
                    <ErrorGlyph />
                    <span>{passwordError}</span>
                  </div>
                </div>
                <div
                  className={`${classes.btnWrap} ${classes.btnWrapInteractive}`}
                  onClick={suppressTooltip}
                  onKeyDown={handleTooltipKeydown}
                  onMouseLeave={resetTooltip}
                  role="button"
                  tabIndex={0}
                >
                  {!passwordValid && !tooltipSuppressed && (
                    <div className={classes.btnTooltip}>{passwordTooltip}</div>
                  )}
                  <button
                    type="submit"
                    className={classes.btnSave}
                    disabled={!passwordValid || isSubmitting}
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
