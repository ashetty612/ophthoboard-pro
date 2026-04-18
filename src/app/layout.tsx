import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020a13',
};

export const metadata: Metadata = {
  title: "OphthoBoard Pro - Ophthalmology Oral Boards Study Tool",
  description: "Interactive ophthalmology oral board exam preparation with ABO-style scoring, 350+ cases, AI examiner, PPP guidelines, and progress tracking",
  openGraph: {
    title: "OphthoBoard Pro",
    description: "Master your ophthalmology oral boards with 350+ interactive cases, AI examiner, and ABO-style scoring",
    type: "website",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👁</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
