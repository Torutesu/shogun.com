import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-mono",
  display: "swap",
});

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
    <div
      className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      {children}
    </div>
  );
}
