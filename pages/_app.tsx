import dynamic from "next/dynamic";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { Provider as ReduxProvider } from "react-redux";
import Head from "next/head";
import { store } from "../store";
// MUI
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider, EmotionCache } from "@emotion/react";
import theme from "../utils/theme";
import createEmotionCache from "../utils/createEmotionCache";

const Layout = dynamic(() => import("../components/layout/layout"), {});

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
  session: Session;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <ReduxProvider store={store}>
      <SessionProvider session={props.session}>
        <ThemeProvider theme={theme}>
          <Layout>
            <CacheProvider value={emotionCache}>
              <Head>
                <title>Notes NextJS</title>
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1, maximum-scale=5"
                />
                <meta name="description" content="Notes app" />
              </Head>
              {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
              <CssBaseline />
              <Component {...pageProps} />
            </CacheProvider>
          </Layout>
        </ThemeProvider>
      </SessionProvider>
    </ReduxProvider>
  );
}
