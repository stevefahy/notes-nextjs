import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import { signInCredentials } from "../../lib/credentialsSignIn";
import { showErrorMessage } from "../../lib/errorMessageMap";
import { createUser } from "../../lib/fetch-helpers";

const AC = APPLICATION_CONSTANTS;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignupErrorResult = { error: string };
type SignupSuccessResult = {
  message?: string;
  data: { notebookID: string; noteID: string };
};
type SignupApiResult = SignupErrorResult | SignupSuccessResult;

const AuthForm = () => {
  const router = useRouter();

  const getRedirectPath = useCallback(() => {
    const q = router.query.redirect;
    return typeof q === "string" && q.startsWith("/") ? q : AC.DEFAULT_PAGE;
  }, [router.query.redirect]);

  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [tooltipSuppressed, setTooltipSuppressed] = useState(false);

  const switchAuthModeHandler = () => {
    setFieldErrors({ username: "", email: "", password: "" });
    setFormError("");
    setIsLogin((v) => !v);
    setUsername("");
    setEmail("");
    setPassword("");
    setTooltipSuppressed(false);
  };

  const usernameError = useMemo((): string => {
    const t = username.trim();
    const len = t.length;
    if (len === 0) return "";
    if (len < AC.USERNAME_MIN) return AC.SIGNUP_INVALID_USERNAME;
    if (username.length > AC.USERNAME_MAX)
      return `Too long — max ${AC.USERNAME_MAX} characters`;
    return "";
  }, [username]);

  const emailError = useMemo((): string => {
    const t = email.trim();
    if (t.length === 0) return "";
    if (!EMAIL_REGEX.test(t)) return AC.EMAIL_INVALID;
    return "";
  }, [email]);

  const passwordError = useMemo((): string => {
    if (!password) return "";
    if (password.length < AC.PASSWORD_MIN) return AC.SIGNUP_INVALID_PASSWORD;
    if (password.length > AC.PASSWORD_MAX)
      return `Max ${AC.PASSWORD_MAX} characters`;
    return "";
  }, [password]);

  const usernameValid =
    username.trim().length >= AC.USERNAME_MIN &&
    username.length <= AC.USERNAME_MAX;
  const emailValid = email.trim().length > 0 && EMAIL_REGEX.test(email.trim());
  const passwordValid =
    password.length >= AC.PASSWORD_MIN && password.length <= AC.PASSWORD_MAX;
  const signupFormValid = usernameValid && emailValid && passwordValid;

  const strengthScore = useMemo(() => {
    let s = 0;
    if (password.length >= AC.PASSWORD_MIN) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthClass =
    strengthScore <= 1 ? "weak" : strengthScore <= 2 ? "ok" : "good";

  const signupTooltip = useMemo((): string => {
    if (!username.trim()) return "Enter a username";
    if (!email.trim()) return AC.EMAIL_INVALID;
    if (!password) return "Enter a password";
    if (usernameError) return usernameError;
    if (emailError) return emailError;
    if (passwordError) return passwordError;
    return "";
  }, [username, email, password, usernameError, emailError, passwordError]);

  const validateLoginForm = () => {
    setFieldErrors({ username: "", email: "", password: "" });
    setFormError("");
    let valid = true;
    const next = { username: "", email: "", password: "" };
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      next.email = AC.SIGNUP_INVALID_EMAIL;
      valid = false;
    }
    if (!password || password.length < AC.PASSWORD_MIN) {
      next.password = AC.SIGNUP_INVALID_PASSWORD;
      valid = false;
    } else if (password.length > AC.PASSWORD_MAX) {
      next.password = AC.CHANGE_PASS_TOO_MANY;
      valid = false;
    }
    setFieldErrors(next);
    return valid;
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    if (isLogin) {
      if (!validateLoginForm()) {
        setIsSubmitting(false);
        return;
      }
      try {
        const result = await signInCredentials({
          email: email.trim(),
          password,
        });
        setIsSubmitting(false);
        if (!result?.error) {
          void router.replace(getRedirectPath());
        } else {
          setFormError(showErrorMessage(result.error, false));
        }
      } catch (error: unknown) {
        setIsSubmitting(false);
        setFormError(showErrorMessage(error, false));
      }
    } else {
      if (!signupFormValid) {
        setIsSubmitting(false);
        return;
      }
      try {
        const result = (await createUser(
          email.trim(),
          password,
          username.trim(),
        )) as SignupApiResult;
        if ("error" in result && result.error) {
          setIsSubmitting(false);
          setFormError(showErrorMessage(result.error, true));
          return;
        }
        const welcome = (result as SignupSuccessResult).data;
        if (!welcome?.notebookID || !welcome?.noteID) {
          setIsSubmitting(false);
          setFormError(AC.CREATE_USER_ERROR);
          return;
        }
        const signin = await signInCredentials({
          email: email.trim(),
          password,
        });
        setIsSubmitting(false);
        if (!signin?.error) {
          void router.replace(
            `/notebook/${welcome.notebookID}/${welcome.noteID}`,
          );
        } else {
          setFormError(showErrorMessage(signin.error, false));
        }
      } catch (error: unknown) {
        setIsSubmitting(false);
        setFormError(showErrorMessage(error, false));
      }
    }
  };

  const suppressTooltip = useCallback(() => setTooltipSuppressed(true), []);
  const resetTooltip = useCallback(() => setTooltipSuppressed(false), []);
  const handleTooltipKeydown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      suppressTooltip();
    }
  };

  return (
    <div className="splash-login">
      <div className="splash-top">
        <div className="splash-logo-row">
          <div className="splash-logo-mark">
            <Image
              alt="logo"
              src="/assets/images/edit_white.png"
              width={20}
              height={20}
              priority
            />
          </div>
          <span className="splash-logo-text">Notes</span>
        </div>
        <div className="splash-headline">
          Your notes,
          <br />
          beautifully
          <br />
          organised.
        </div>
        <div className="splash-sub">
          Write freely, stay focused. Everything in one calm, clutter-free
          space.
        </div>
      </div>

      <div className="login-card">
        <h2 className="login-card-title">
          {isLogin ? "Sign in" : "Create account"}
        </h2>
        <form noValidate onSubmit={submitHandler}>
          {!isLogin ? (
            <>
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                className={`form-input${
                  usernameError || fieldErrors.username ? " input-error" : ""
                }`}
                type="text"
                id="username"
                required
                placeholder="Enter username"
                autoComplete="username"
                value={username}
                onChange={(ev) => {
                  setUsername(ev.target.value);
                  setFieldErrors((f) => ({ ...f, username: "" }));
                  setFormError("");
                }}
              />
              <div className="field-feedback">
                <div
                  className={`inline-error${
                    usernameError || fieldErrors.username ? " visible" : ""
                  }`}
                >
                  {usernameError || fieldErrors.username}
                </div>
                <span
                  className={`char-counter${
                    username.length > AC.USERNAME_MAX ? " over" : ""
                  }`}
                >
                  {username.length} / {AC.USERNAME_MAX}
                </span>
              </div>
            </>
          ) : null}

          <label className="form-label" htmlFor="email">
            Email address
          </label>
          <input
            className={`form-input${
              fieldErrors.email || (!isLogin && emailError)
                ? " input-error"
                : ""
            }`}
            type="email"
            id="email"
            required
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              setFieldErrors((f) => ({ ...f, email: "" }));
              setFormError("");
            }}
          />
          <div className="field-feedback">
            <div
              className={`inline-error${
                fieldErrors.email || (!isLogin && emailError) ? " visible" : ""
              }`}
            >
              {fieldErrors.email || (!isLogin ? emailError : "")}
            </div>
          </div>

          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            className={`form-input${
              fieldErrors.password || (!isLogin && passwordError)
                ? " input-error"
                : ""
            }`}
            type="password"
            id="password"
            required
            placeholder={
              isLogin ? "Password" : `Min. ${AC.PASSWORD_MIN} Characters`
            }
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(ev) => {
              setPassword(ev.target.value);
              setFieldErrors((f) => ({ ...f, password: "" }));
              setFormError("");
            }}
          />
          {!isLogin ? (
            <div className="strength-row">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`bar-seg${
                    i <= strengthScore && strengthClass === "weak"
                      ? " weak"
                      : i <= strengthScore && strengthClass === "ok"
                        ? " ok"
                        : i <= strengthScore && strengthClass === "good"
                          ? " good"
                          : ""
                  }`}
                />
              ))}
            </div>
          ) : null}
          <div className="field-feedback">
            <div
              className={`inline-error${
                fieldErrors.password || (!isLogin && passwordError)
                  ? " visible"
                  : ""
              }`}
            >
              {fieldErrors.password || (!isLogin ? passwordError : "")}
            </div>
          </div>

          {isLogin ? (
            <button className="btn-login" type="submit" disabled={isSubmitting}>
              Sign in
            </button>
          ) : (
            <div
              className="btn-wrap"
              onClick={suppressTooltip}
              onKeyDown={handleTooltipKeydown}
              onMouseLeave={resetTooltip}
              role="button"
              tabIndex={0}
            >
              {!signupFormValid && !tooltipSuppressed ? (
                <div className="btn-tooltip">{signupTooltip}</div>
              ) : null}
              <button
                className="btn-login"
                type="submit"
                disabled={!signupFormValid || isSubmitting}
              >
                Create Account
              </button>
            </div>
          )}

          <div className="login-alt">
            {isLogin ? "No account? " : ""}
            <button
              type="button"
              className="login-alt-link"
              onClick={switchAuthModeHandler}
            >
              {isLogin ? "Create one" : "Login with existing account"}
            </button>
          </div>

          <div className={`form-error${formError ? " visible" : ""}`}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              style={{ flexShrink: 0 }}
              className="form-error-icon"
              aria-hidden
            >
              <circle cx="6" cy="6" r="5.5" fill="#b91c1c" />
              <path
                d="M6 3.5v3M6 8v.5"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            {formError}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
