import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SHOGUN — The only AI that knows your work",
  description:
    "Personal AI Cloud Computer + Work Memory. Remembers everything. Does everything. Built by Select KK, Tokyo.",
  metadataBase: new URL("https://syogun.com"),
  openGraph: {
    title: "SHOGUN — The only AI that knows your work",
    description:
      "Personal AI Cloud Computer with Work Memory. Remembers everything. Does everything.",
    siteName: "SHOGUN",
    type: "website",
  },
};

export default function LPLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Load fonts via link tags — gracefully degrades if unavailable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <div>{children}</div>
    </>
  );
}
