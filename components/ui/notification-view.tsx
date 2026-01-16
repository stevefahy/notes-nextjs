import classes from "./notification-view.module.css";
import { NotificationInterface } from "../../types";

const NotificationView = (props: NotificationInterface) => {
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
