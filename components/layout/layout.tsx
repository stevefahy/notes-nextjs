import dynamic from "next/dynamic";
import { Fragment, useEffect, useState } from "react";
import { Props } from "../../types";
import { useAppSelector } from "../../store/hooks";
import { GoogleAnalytics } from "@next/third-parties/google";

const MainNavigation = dynamic(() => import("./main-navigation"), {});
const NotificationView = dynamic(() => import("../ui/notification-view"), {});
const SnackbarView = dynamic(() => import("../ui/snackbar-view"), {});

// Set the CSS variable --jsvh (Javascript Vertical Height)
// This var is used because on mobile browsers the css: calc(100vh)
// includes the browser address bar area.
// In the /styles/global.css
// height: calc(100vh - var(--header-footer-height));
// becomes:
// height: calc(var(--jsvh) - var(--header-footer-height));
const setScreenHeight = () => {
  let jsvh = global.window && window.innerHeight;
  let header_height =
    global.document &&
    document.getElementById("header_height")?.getBoundingClientRect().height;

  global.document &&
    document.documentElement.style.setProperty("--jsvh", `${jsvh}px`);
  global.document &&
    document.documentElement.style.setProperty(
      "--jsheader-height",
      `${header_height}`
    );
};

const Layout = (props: Props) => {
  const notification = useAppSelector((state) => state.ui.notification);
  const snackbar = useAppSelector((state) => state.snack.snackbar);
  const [status, setStatus] = useState(null);

  // Set the initial screenHeight
  setScreenHeight();

  // Set the screenHeight on window resize (includes orientation change)
  global.window &&
    window.addEventListener("resize", () => {
      setScreenHeight();
    });

  useEffect(() => {
    if (notification.status !== null) {
      setStatus(notification.status);
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setStatus(null);
    }
  }, [notification]);

  return (
    <Fragment>
      <MainNavigation />
      <main>{props.children}</main>
      {status && (
        <NotificationView
          status={notification.status}
          title={notification.title}
          message={notification.message}
        />
      )}
      <SnackbarView status={snackbar.status} message={snackbar.message} />
      <GoogleAnalytics gaId="G-ES95HM1XLD" />
    </Fragment>
  );
};

export default Layout;
