import dynamic from "next/dynamic";
import { Fragment, useEffect } from "react";
import { useRouter } from "next/router";
import { Props } from "../../types";
import { dispatchErrorSnack } from "../../lib/dispatchSnack";
import { createOfflineAnchorClickCapture } from "../../lib/clientOfflineNav";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { GoogleAnalytics } from "@next/third-parties/google";
import { setScreenHeight } from "../../lib/setScreenHeight";
import MainNavigation from "./main-navigation";
const NotificationView = dynamic(() => import("../ui/notification-view"), {
  ssr: false,
});
const SnackbarView = dynamic(() => import("../ui/snackbar-view"), {
  ssr: false,
});

const Layout = (props: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoginPage = router.pathname === "/auth";

  const notification = useAppSelector((state) => state.ui.notification);

  useEffect(() => {
    if (isLoginPage) return;
    const id = window.setTimeout(() => setScreenHeight(), 0);
    return () => clearTimeout(id);
  }, [isLoginPage, router.pathname]);

  useEffect(() => {
    if (isLoginPage) return;
    const onResize = () => setScreenHeight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isLoginPage]);

  useEffect(() => {
    if (isLoginPage) return;
    const onRouteError = (err: Error & { cancelled?: boolean }) => {
      if (err?.cancelled) return;
      dispatchErrorSnack(dispatch, err, false);
    };
    router.events.on("routeChangeError", onRouteError);
    return () => router.events.off("routeChangeError", onRouteError);
  }, [dispatch, isLoginPage, router]);

  useEffect(() => {
    if (isLoginPage) return;
    const onCaptureClick = createOfflineAnchorClickCapture(dispatch);
    document.addEventListener("click", onCaptureClick, true);
    return () => document.removeEventListener("click", onCaptureClick, true);
  }, [dispatch, isLoginPage]);

  return (
    <Fragment>
      <div className="app-shell">
        {!isLoginPage && <MainNavigation />}
        <main className={isLoginPage ? "login-page" : undefined}>
          {props.children}
        </main>
        {notification.status !== null && (
          <NotificationView
            key={`${notification.status}-${notification.title}-${notification.message}`}
            status={notification.status}
            title={notification.title}
            message={notification.message}
          />
        )}
        <SnackbarView />
        <GoogleAnalytics gaId="G-ES95HM1XLD" />
      </div>
    </Fragment>
  );
};

export default Layout;
