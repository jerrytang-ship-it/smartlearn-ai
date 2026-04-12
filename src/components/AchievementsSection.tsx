"use client";

import { useState } from "react";

interface AchievementItem {
  icon: string;
  name: string;
  unlocked: boolean;
  progress: number;
  detail: string;
  subtitle?: string;
  colorBg: string;
}

interface Category {
  label: string;
  items: AchievementItem[];
}

export default function AchievementsSection({
  stats,
  accuracy,
}: {
  stats: { chaptersCompleted: number; longestStreak: number; totalAnswered: number; xp: number };
  accuracy: number;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories: Category[] = [
    {
      label: "📚 學習進度",
      items: [
        { icon: "🌟", name: "初學者", unlocked: stats.chaptersCompleted >= 1, progress: Math.min(stats.chaptersCompleted / 1, 1), detail: `${Math.min(stats.chaptersCompleted, 1)}/1 章節`, colorBg: "bg-xp/20" },
        { icon: "📖", name: "學習達人", unlocked: stats.chaptersCompleted >= 5, progress: Math.min(stats.chaptersCompleted / 5, 1), detail: `${Math.min(stats.chaptersCompleted, 5)}/5 章節`, colorBg: "bg-xp/20" },
        { icon: "🎓", name: "知識大師", unlocked: stats.chaptersCompleted >= 10, progress: Math.min(stats.chaptersCompleted / 10, 1), detail: `${Math.min(stats.chaptersCompleted, 10)}/10 章節`, colorBg: "bg-xp/20" },
        { icon: "🧠", name: "AI專家", unlocked: stats.chaptersCompleted >= 20, progress: Math.min(stats.chaptersCompleted / 20, 1), detail: `${Math.min(stats.chaptersCompleted, 20)}/20 章節`, colorBg: "bg-xp/20" },
      ],
    },
    {
      label: "🔥 連續學習",
      items: [
        { icon: "🔥", name: "三日不斷", unlocked: stats.longestStreak >= 3, progress: Math.min(stats.longestStreak / 3, 1), detail: `${Math.min(stats.longestStreak, 3)}/3 天`, colorBg: "bg-streak/20" },
        { icon: "🌈", name: "七日達人", unlocked: stats.longestStreak >= 7, progress: Math.min(stats.longestStreak / 7, 1), detail: `${Math.min(stats.longestStreak, 7)}/7 天`, colorBg: "bg-streak/20" },
        { icon: "💎", name: "月度達人", unlocked: stats.longestStreak >= 30, progress: Math.min(stats.longestStreak / 30, 1), detail: `${Math.min(stats.longestStreak, 30)}/30 天`, colorBg: "bg-streak/20" },
      ],
    },
    {
      label: "🎯 準確度",
      items: [
        { icon: "💯", name: "準確射手", unlocked: accuracy >= 80 && stats.totalAnswered >= 20, progress: stats.totalAnswered >= 20 ? Math.min(accuracy / 80, 1) : Math.min(stats.totalAnswered / 20, 1), detail: stats.totalAnswered >= 20 ? `${accuracy}%/80%` : `需答 ${stats.totalAnswered}/20 題`, subtitle: "準確率 ≥80%（至少 20 題）", colorBg: "bg-success/20" },
        { icon: "🎯", name: "神射手", unlocked: accuracy >= 90 && stats.totalAnswered >= 50, progress: stats.totalAnswered >= 50 ? Math.min(accuracy / 90, 1) : Math.min(stats.totalAnswered / 50, 1), detail: stats.totalAnswered >= 50 ? `${accuracy}%/90%` : `需答 ${stats.totalAnswered}/50 題`, subtitle: "準確率 ≥90%（至少 50 題）", colorBg: "bg-success/20" },
        { icon: "👑", name: "精準大師", unlocked: accuracy >= 95 && stats.totalAnswered >= 100, progress: stats.totalAnswered >= 100 ? Math.min(accuracy / 95, 1) : Math.min(stats.totalAnswered / 100, 1), detail: stats.totalAnswered >= 100 ? `${accuracy}%/95%` : `需答 ${stats.totalAnswered}/100 題`, subtitle: "準確率 ≥95%（至少 100 題）", colorBg: "bg-success/20" },
      ],
    },
  ];

  const totalUnlocked = categories.reduce((sum, cat) => sum + cat.items.filter((a) => a.unlocked).length, 0);
  const totalAchievements = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-[#E0EAF0] shadow-[0_3px_0_0_#E0EAF0]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-base text-[#2D2D2D]">🏆 成就</h3>
        <span className="text-xs font-bold text-[#C4B5A5]">{totalUnlocked}/{totalAchievements} 已解鎖</span>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => {
          const isExpanded = expanded === cat.label;
          const catUnlocked = cat.items.filter((a) => a.unlocked).length;

          return (
            <div key={cat.label}>
              {/* Category header — tappable */}
              <button
                onClick={() => setExpanded(isExpanded ? null : cat.label)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#2D2D2D]">{cat.label}</span>
                  <span className="text-xs font-bold text-[#C4B5A5]">{catUnlocked}/{cat.items.length}</span>
                </div>
                <span className="text-[#C4B5A5] text-xs transition-transform" style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
                  ▼
                </span>
              </button>

              {/* Expandable detail */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isExpanded ? `${cat.items.length * 70}px` : "0px" }}
              >
                <div className="space-y-2 pt-2 px-1">
                  {cat.items.map((a) => (
                    <div key={a.name} className={`flex items-center gap-3 ${a.unlocked ? "" : "opacity-60"}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                        a.unlocked ? a.colorBg : "bg-[#E0EAF0]"
                      }`}>
                        {a.unlocked ? a.icon : "🔒"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div>
                            <p className="text-xs font-bold text-[#2D2D2D]">{a.name}</p>
                            {a.subtitle && <p className="text-[10px] text-[#C4B5A5]">{a.subtitle}</p>}
                          </div>
                          <p className="text-xs font-bold text-[#C4B5A5]">{a.detail}</p>
                        </div>
                        <div className="h-2 bg-[#E0EAF0] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${a.progress * 100}%`, background: a.unlocked ? "#FFD166" : "#2196F3" }}
                          />
                        </div>
                      </div>
                      {a.unlocked && <span className="text-sm flex-shrink-0">✅</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
