import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import TutorialOverlay from "@/components/TutorialOverlay";
import { UserProvider } from "@/lib/user";

export const metadata: Metadata = {
  title: "智學AI — AI素養學習平台",
  description: "專為香港10-13歲學生設計的AI素養互動學習平台",
  manifest: "/manifest.json",
  icons: {
    icon: "/app_logo/app_logo.png",
    apple: "/app_logo/app_logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "智學AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/app_logo/app_logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="智學AI" />
        <meta name="theme-color" content="#2196F3" />
      </head>
      <body className="antialiased">
        <UserProvider>
          <TopBar />
          <main className="pt-14 pb-24 max-w-lg mx-auto min-h-screen">
            {children}
          </main>
          <BottomNav />
          <TutorialOverlay />
        </UserProvider>
      </body>
    </html>
  );
}
