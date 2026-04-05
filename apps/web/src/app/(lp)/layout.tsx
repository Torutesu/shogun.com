import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SHOGUN — The only AI that knows your work",
  description:
    "Personal AI Cloud Computer + Work Memory. Your desktop captures context, AI remembers everything, your own Linux machine executes. Claude, GPT, Gemini in one place.",
  metadataBase: new URL("https://syogun.com"),
  openGraph: {
    title: "SHOGUN — The only AI that knows your work",
    description:
      "Personal AI Cloud Computer + Work Memory. Your desktop captures context, AI remembers everything, your own Linux machine executes.",
    siteName: "SHOGUN",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "SHOGUN — The only AI that knows your work" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SHOGUN — The only AI that knows your work",
    description: "Personal AI Cloud Computer + Work Memory. Never start from zero again.",
    images: ["/og.png"],
  },
  keywords: [
    "AI cloud computer",
    "work memory",
    "personal AI",
    "Claude",
    "GPT",
    "Gemini",
    "multi-model AI",
    "AI productivity",
    "cloud server",
    "BYOK AI",
  ],
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

      {/* Rewardful affiliate tracking */}
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
    </>
  );
}
