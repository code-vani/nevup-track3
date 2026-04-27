import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NevUp — Trading Psychology Coach",
  description: "Behavioral intelligence platform for retail day traders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* Preconnect first so DNS+TLS is done before the stylesheet fires */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/*
          Load fonts with display=swap so text renders immediately in fallback font.
          Non-render-blocking: browser paints text before webfont arrives.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap"
          media="print"
          // @ts-expect-error — onload trick for non-blocking font load
          onLoad="this.media='all'"
        />
        {/* Fallback for no-JS: noscript swaps media instantly */}
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap"
          />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
