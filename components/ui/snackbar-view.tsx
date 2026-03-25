import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { snackActions, SnackVariant } from "../../store/snack-slice";

const SNACK_MS = 4000;

const SnackbarView = () => {
  const dispatch = useAppDispatch();
  const { status, message, variant } = useAppSelector(
    (state) => state.snack.snackbar,
  );

  useEffect(() => {
    if (!status || !message) return;
    const t = window.setTimeout(() => {
      dispatch(snackActions.hideSnack());
    }, SNACK_MS);
    return () => clearTimeout(t);
  }, [status, message, dispatch]);

  const v: SnackVariant = variant ?? "success";
  const multi = message.includes("\n");
  const classNames = [
    "snackbar",
    status ? "show" : "",
    `snackbar-${v}`,
    multi ? "snackbar-multi" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} id="snackbar" role="status" aria-live="polite">
      {v === "success" && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="snackbar-icon"
          aria-hidden
        >
          <circle
            cx="8"
            cy="8"
            r="7.5"
            fill="rgba(255,255,255,0.2)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />
          <path
            d="M4.5 8l2.5 2.5 4.5-4.5"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {v === "error" && (
        <div className="snackbar-dot snackbar-dot-error" aria-hidden />
      )}
      {v === "warning" && (
        <div className="snackbar-dot snackbar-dot-warning" aria-hidden />
      )}
      <span id="snackbar-msg" className="snackbar-msg">
        {message}
      </span>
    </div>
  );
};

export default SnackbarView;
