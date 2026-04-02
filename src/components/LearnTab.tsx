"use client";

import { useState } from "react";
import CoreCourse from "./CoreCourse";
import DailyChallenge from "./DailyChallenge";

type SubTab = "course" | "daily";

export default function LearnTab() {
  const [activeTab, setActiveTab] = useState<SubTab>("course");

  return (
    <div className="pb-28">
      {/* Pill toggle */}
      <div className="px-4 pt-3 pb-2 sticky top-14 z-30 bg-[#FFF8F0]">
        <div className="flex bg-[#FFE8D9] rounded-[16px] p-1">
          <button
            onClick={() => setActiveTab("course")}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-extrabold transition-all ${
              activeTab === "course"
                ? "text-white"
                : "text-[#FF6B35]/60"
            }`}
            style={activeTab === "course" ? { background: "#FF6B35", boxShadow: "0 3px 12px rgba(255,107,53,0.4)" } : {}}
          >
            🎓 核心課程
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-extrabold transition-all ${
              activeTab === "daily"
                ? "text-white"
                : "text-[#FF6B35]/60"
            }`}
            style={activeTab === "daily" ? { background: "#FF6B35", boxShadow: "0 3px 12px rgba(255,107,53,0.4)" } : {}}
          >
            ⚡ 每日挑戰
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "course" ? <CoreCourse /> : <DailyChallenge />}
    </div>
  );
}
