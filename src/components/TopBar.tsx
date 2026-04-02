"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/lib/user";
import Mascot from "./Mascot";

export default function TopBar() {
  const pathname = usePathname();
  const { stats, loading } = useUser();

  if (pathname.startsWith("/lesson") || pathname.startsWith("/review")) return null;

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#FFF8F0]/95 backdrop-blur-sm z-50">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[13px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B35, #FF9A5C)" }}>
            <Mascot size={28} mood="happy" />
          </div>
          <span className="font-extrabold text-xl text-[#FF6B35]">智學AI</span>
        </div>

        {!loading && stats && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#FF6B35]/12 px-3 py-1.5 rounded-full">
              <span className="text-sm animate-flame">🔥</span>
              <span className="text-sm font-extrabold text-[#FF6B35]">{stats.streak}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#FF6B35]/12 px-3 py-1.5 rounded-full">
              <span className="text-sm">⚡</span>
              <span className="text-sm font-extrabold text-[#FF6B35]">{stats.xp}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
