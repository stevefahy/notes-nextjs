import classes from "./error-alert.module.css";
import { AlertInterface } from "../../types";

const severityClass: Record<string, string> = {
  error: classes.severityError,
  warning: classes.severityWarning,
  info: classes.severityInfo,
  success: classes.severitySuccess,
};

const ErrorAlert = (props: AlertInterface) => {
  const raw = props.error_severity ? props.error_severity : "error";
  const severity = raw in severityClass ? raw : "error";

  return (
    <div className={classes.error_alert_position}>
      <div
        className={`${classes.alert} ${severityClass[severity]}`}
        role="alert"
      >
        {props.children}
      </div>
    </div>
  );
};

export default ErrorAlert;
