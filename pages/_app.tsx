import dynamic from "next/dynamic";
import { useEffect } from "react";
import "../styles/material-icons-local.css";
import "../styles/globals.css";
import "../styles/login-splash.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { Provider as ReduxProvider } from "react-redux";
import Head from "next/head";
import { registerOfflineFallbackServiceWorker } from "../lib/registerOfflineFallbackSw";
import { store } from "../store";

const Layout = dynamic(() => import("../components/layout/layout"), {
  loading: () => null,
});

interface MyAppProps extends AppProps {
  session: Session;
}

export default function MyApp(props: MyAppProps) {
  const { Component, pageProps } = props;

  useEffect(() => {
    registerOfflineFallbackServiceWorker();
  }, []);

  return (
    <ReduxProvider store={store}>
      <SessionProvider session={props.session}>
        <Layout>
          <Head>
            <title>Notes NextJS</title>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=5"
            />
            <meta name="description" content="Notes app" />
          </Head>
          <Component {...pageProps} />
        </Layout>
      </SessionProvider>
    </ReduxProvider>
  );
}
