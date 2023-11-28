import Document, { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";
import createEmotionServer from "@emotion/server/create-instance";
import createEmotionCache from "../utils/createEmotionCache";
import theme from "../utils/theme";

class myDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          <link
            href="https://fonts.googleapis.com/css?family=Permanent+Marker&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/icon?family=Material+Icons"
            rel="stylesheet"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          />
          <meta name="emotion-insertion-point" content="" />
          {(this.props as any).emotionStyleTags}
        </Head>

        <div className="container">
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-S8H3MZ1K57"
          ></Script>
          <Script id="google-analytics">
            {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-S8H3MZ1K57');
        `}
          </Script>
        </div>

        <body>
          <Main />
          <NextScript />
          {/* browser.js renames heading id's so that links continue to work with rehype sanitize
          https://github.com/rehypejs/rehype-sanitize#example-headings-dom-clobbering  */}
          <Script
            src={`${process.env.NEXTSCRIPT_URL}/browser.js`}
            strategy="beforeInteractive"
          />
          <div id="notifications"></div>
        </body>
      </Html>
    );
  }
}

export default myDocument;

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
myDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  const originalRenderPage = ctx.renderPage;

  // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: any) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />;
        },
    });

  const initialProps = await Document.getInitialProps(ctx);
  // This is important. It prevents Emotion to render invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(" ")}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags,
  };
};
