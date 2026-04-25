import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuroraBackground from "@/components/AuroraBackground";
import { AuthProvider } from "@/lib/auth-context";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Fraunces: editorial serif for the italic-emph word in display headings —
// signature Clear Vision treatment. Uses the variable font's optical-size
// axis for larger hero display.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020a13',
};

export const metadata: Metadata = {
  title: "Clear Vision Boards — Clear the Boards.",
  description:
    "The ABO oral boards prep system, by Clear Vision Education. 432 interactive cases, real-time AI examiner, 25 AAO PPPs, 46 landmark trials, and 27 fatal-flaw safety nets — all tuned to the 8-element PMP framework.",
  openGraph: {
    title: "Clear Vision Boards",
    description: "Clear the Boards. The definitive ABO oral boards prep, by Clear Vision Education.",
    type: "website",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23047962'/><stop offset='100%' stop-color='%23347896'/></linearGradient></defs><circle cx='50' cy='50' r='45' fill='url(%23g)'/><circle cx='50' cy='50' r='16' fill='%23020a13'/><circle cx='44' cy='44' r='5' fill='%23ffffff' opacity='0.7'/></svg>",
    apple: "/mascots/cve-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CVB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}>
      <body className="antialiased">
        <AuroraBackground />
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
