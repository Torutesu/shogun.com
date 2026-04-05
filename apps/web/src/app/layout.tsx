import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHOGUN — The only AI that knows your work",
  description:
    "Personal AI Cloud Computer + Work Memory. Remembers everything. Does everything.",
  metadataBase: new URL("https://syogun.com"),
  openGraph: {
    title: "SHOGUN",
    description: "The only AI that knows your work.",
    siteName: "SHOGUN",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "SHOGUN — The only AI that knows your work",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SHOGUN",
    description: "The only AI that knows your work.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ToastProvider />
        {process.env.NEXT_PUBLIC_REWARDFUL_API_KEY && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`,
              }}
            />
            <script async src="https://r.wdfl.co/rw.js" data-rewardful={process.env.NEXT_PUBLIC_REWARDFUL_API_KEY} />
          </>
        )}
      </body>
    </html>
  );
}
