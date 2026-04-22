"use client";

import Mascot from "./Mascot";

export default function MaintenanceScreen() {
  if (process.env.NEXT_PUBLIC_MAINTENANCE !== "true") return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#F0F7FF] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <Mascot size={120} mood="sleeping" />
        <h1 className="text-2xl font-extrabold text-[#2D2D2D] mt-4 mb-2">🔧 系統維護中</h1>
        <p className="text-[#A0907E] text-sm leading-relaxed mb-6">
          我哋正在進行系統更新，請稍後再試。
          <br />
          唔好意思，好快就會恢復！
        </p>
        <div className="bg-white rounded-2xl p-4 border-2 border-[#E0EAF0]">
          <p className="text-xs text-[#C4B5A5]">
            如有緊急查詢，請電郵至
            <br />
            <a href="mailto:support@smartlearn-ai.com" className="text-[#2196F3] font-bold">
              support@smartlearn-ai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
