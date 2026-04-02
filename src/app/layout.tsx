import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { UserProvider } from "@/lib/user";

export const metadata: Metadata = {
  title: "智學AI — AI素養學習平台",
  description: "專為香港10-13歲學生設計的AI素養互動學習平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body className="antialiased">
        <UserProvider>
          <TopBar />
          <main className="pt-14 pb-16 max-w-lg mx-auto min-h-screen">
            {children}
          </main>
          <BottomNav />
        </UserProvider>
      </body>
    </html>
  );
}
