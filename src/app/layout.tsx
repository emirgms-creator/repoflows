import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://repoflows.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RepoFlows — Instant GitHub Architecture Visualizer",
    template: "%s | RepoFlows",
  },
  description:
    "Visualize the runtime architecture of any GitHub repository instantly into an interactive, animated system map powered by AI and Archify vector engine.",
  keywords: [
    "architecture visualizer",
    "github architecture diagram",
    "system architecture visualizer",
    "codebase diagram generator",
    "software architecture AI",
    "repoflows",
    "archify",
    "runtime topology",
    "github repo to diagram",
  ],
  authors: [{ name: "RepoFlows" }],
  creator: "RepoFlows",
  publisher: "RepoFlows",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "RepoFlows — Instant GitHub Architecture Visualizer",
    description:
      "Visualize the runtime architecture of any GitHub repository instantly into an interactive, animated system map.",
    siteName: "RepoFlows",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoFlows — Instant GitHub Architecture Visualizer",
    description:
      "Visualize the runtime architecture of any GitHub repository instantly into an interactive, animated system map.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
