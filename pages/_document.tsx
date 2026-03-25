import Document, { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

class myDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head>
          <meta name="theme-color" content="#1b3d29" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link
            href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Lato:ital,wght@0,400;0,700;1,400;1,700&family=Lora:ital,wght@0,400..700;1,400..700&family=Permanent+Marker&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          <Script
            src={`${process.env.NEXTSCRIPT_URL}/browser.js`}
            strategy="lazyOnload"
          />
          <div id="notifications"></div>
        </body>
      </Html>
    );
  }
}

export default myDocument;
