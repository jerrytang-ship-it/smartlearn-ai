"use client";

import Mascot from "./Mascot";
import { useUser } from "@/lib/user";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { loginWithGoogle } = useUser();

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 pb-8 animate-slide-up relative border-t-2 sm:border-2 border-[#E0EAF0]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#DCEEFB] flex items-center justify-center text-[#A0907E] hover:bg-[#DCEEFB] transition-colors"
        >
          ✕
        </button>

        <div className="flex justify-center mb-2 -mt-2">
          <Mascot size={90} mood="celebrating" />
        </div>

        <div className="text-center mb-5">
          <h2 className="text-xl font-extrabold mb-1 text-[#2D2D2D]">想保存你的進度嗎？</h2>
          <p className="text-[#A0907E] text-sm font-medium">
            登入後換裝置也不會丟失學習紀錄！
          </p>
        </div>

        <div className="space-y-2.5 mb-6">
          {[
            "跨裝置同步學習進度",
            "永久保存 XP 和連續學習紀錄",
            "解鎖排行榜和成就系統",
          ].map((b) => (
            <div key={b} className="flex items-center gap-3 bg-success/10 rounded-xl px-3 py-2.5">
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                ✓
              </div>
              <span className="text-sm font-medium text-[#2D2D2D]">{b}</span>
            </div>
          ))}
        </div>

        <button
          onClick={loginWithGoogle}
          className="w-full bg-[#F0F7FF] border-2 border-[#E0EAF0] shadow-[0_4px_0_0_#E0EAF0] active:translate-y-1 active:shadow-none font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-3 mb-3 text-[#2D2D2D]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          使用 Google 帳號登入
        </button>

        <button
          onClick={onClose}
          className="w-full text-[#C4B5A5] text-sm font-bold py-2 hover:text-[#A0907E]"
        >
          暫時跳過
        </button>
      </div>
    </div>
  );
}
