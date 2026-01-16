import Alert from "@mui/material/Alert";
import classes from "./error-alert.module.css";
import { AlertInterface } from "../../types";

const ErrorAlert = (props: AlertInterface) => {
  return (
    <div className={classes.error_alert_position}>
      <Alert
        severity={`${props.error_severity ? props.error_severity : "error"}`}
      >
        {props.children}
      </Alert>
    </div>
  );
};

export default ErrorAlert;
