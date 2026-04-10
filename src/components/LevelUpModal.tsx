"use client";

import Mascot from "./Mascot";

export default function LevelUpModal({
  newLevel,
  onClose,
}: {
  newLevel: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center px-6 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-sm p-6 pt-8 text-center animate-bounce-in relative overflow-hidden">
        {/* Decorative sparkles */}
        <div className="absolute top-4 left-4 text-2xl animate-pulse">✨</div>
        <div className="absolute top-4 right-4 text-2xl animate-pulse" style={{ animationDelay: "0.3s" }}>✨</div>
        <div className="absolute bottom-20 left-4 text-xl animate-pulse" style={{ animationDelay: "0.6s" }}>⭐</div>
        <div className="absolute bottom-20 right-4 text-xl animate-pulse" style={{ animationDelay: "0.9s" }}>⭐</div>

        {/* Mascot */}
        <div className="relative z-10 mb-4">
          <Mascot size={130} mood="excited" />
        </div>

        {/* Title */}
        <div className="relative z-10">
          <p className="text-sm font-bold text-[#FF6B35] uppercase tracking-wider">Level Up!</p>
          <h2 className="text-3xl font-extrabold text-[#2D2D2D] mt-1">升級喇！🎉</h2>
          <p className="text-[#A0907E] mt-2 text-sm font-medium">你已經升到</p>

          {/* Level badge */}
          <div className="my-5 inline-flex items-center justify-center">
            <div
              className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #FF6B35, #FF9A5C, #FFB347)",
                boxShadow: "0 8px 24px rgba(255,107,53,0.5)",
              }}
            >
              <div className="text-center">
                <p className="text-white text-xs font-bold opacity-80">LEVEL</p>
                <p className="text-white text-4xl font-extrabold leading-none">{newLevel}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-[#A0907E] font-medium mb-6">繼續加油，下一個等級等緊你！</p>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-[16px] font-extrabold text-white text-base transition-all active:translate-y-1"
            style={{
              background: "linear-gradient(135deg, #FF6B35, #FF9A5C)",
              boxShadow: "0 4px 0 0 #E05520, 0 6px 16px rgba(255,107,53,0.3)",
            }}
          >
            繼續 ▶
          </button>
        </div>
      </div>
    </div>
  );
}
