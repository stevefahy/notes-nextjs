import { useEffect, useState } from "react";
import classes from "./notification-view.module.css";
import { NotificationInterface } from "../../types";

const DISMISS_MS = 5000;

const NotificationView = (props: NotificationInterface) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDismissed(true), DISMISS_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (dismissed) return null;

  let specialClasses = "";

  if (props.status === "error") {
    specialClasses = classes.error;
  }
  if (props.status === "success") {
    specialClasses = classes.success;
  }

  const cssClasses = `${classes.notification} ${specialClasses}`;

  return (
    <div className={classes.notification_outer}>
      <section className={cssClasses}>
        <h2>{props.title}</h2>
        <p>{props.message}</p>
      </section>
    </div>
  );
};

export default NotificationView;
