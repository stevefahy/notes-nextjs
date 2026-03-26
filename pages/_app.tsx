import dynamic from "next/dynamic";
import { useEffect } from "react";
import "../styles/material-icons-local.css";
import "../styles/globals.css";
import "../styles/note-shell.css";
import "../styles/login-splash.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Provider as ReduxProvider } from "react-redux";
import Head from "next/head";
import { registerOfflineFallbackServiceWorker } from "../lib/registerOfflineFallbackSw";
import { store } from "../store";

const Layout = dynamic(() => import("../components/layout/layout"), {
  loading: () => null,
});

type PagePropsWithOptionalSession = AppProps["pageProps"] & {
  session?: Session | null;
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const pp = pageProps as PagePropsWithOptionalSession;
  const sessionForProvider = pp.session ?? undefined;

  useEffect(() => {
    registerOfflineFallbackServiceWorker();
  }, []);

  return (
    <ReduxProvider store={store}>
      {/*
        NextAuth treats session={null} as a resolved "no session" and skips the client
        /api/auth/session fetch. Only pass a session object or omit (undefined).
      */}
      <SessionProvider session={sessionForProvider}>
        <Layout>
          <Head>
            <title>Notes NextJS</title>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=5"
            />
            <meta name="description" content="Notes app" />
          </Head>
          {/* Pass full pageProps so pages like /profile keep their `session` prop. */}
          <Component {...pageProps} />
        </Layout>
      </SessionProvider>
    </ReduxProvider>
  );
}
