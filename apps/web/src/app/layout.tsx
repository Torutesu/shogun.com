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
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
