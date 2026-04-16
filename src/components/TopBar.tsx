"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/lib/user";
import Mascot from "./Mascot";

export default function TopBar() {
  const pathname = usePathname();
  const { stats, loading } = useUser();

  if (pathname.startsWith("/lesson") || pathname.startsWith("/review")) return null;

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#F0F7FF]/95 backdrop-blur-sm z-50">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Mascot size={36} mood="happy" />
          <span className="font-extrabold text-xl text-[#2196F3]">智學AI</span>
        </div>

        {!loading && stats && (
          <div className="flex items-center gap-2" data-tutorial="tutorial-stats-pills">
            <div className="flex items-center gap-1 bg-[#2196F3]/12 px-2.5 py-1.5 rounded-full">
              <span className="text-xs font-extrabold text-[#2196F3]">Lv {stats.level}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#2196F3]/12 px-3 py-1.5 rounded-full">
              <span className="text-sm animate-flame">🔥</span>
              <span className="text-sm font-extrabold text-[#2196F3]">{stats.streak}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#2196F3]/12 px-3 py-1.5 rounded-full">
              <span className="text-sm">⚡</span>
              <span className="text-sm font-extrabold text-[#2196F3]">{stats.xp} XP</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
