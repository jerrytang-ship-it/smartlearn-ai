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
      <div className="px-4 pt-3 pb-2 sticky top-14 z-30 bg-[#F0F7FF]">
        <div className="flex bg-[#DCEEFB] rounded-[16px] p-1">
          <button
            onClick={() => setActiveTab("course")}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-extrabold transition-all ${
              activeTab === "course"
                ? "text-white"
                : "text-[#2196F3]/60"
            }`}
            style={activeTab === "course" ? { background: "#2196F3", boxShadow: "0 3px 12px rgba(33,150,243,0.4)" } : {}}
          >
            🎓 核心課程
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-extrabold transition-all relative ${
              activeTab === "daily"
                ? "text-white"
                : "text-[#2196F3]/60"
            }`}
            style={activeTab === "daily" ? { background: "#2196F3", boxShadow: "0 3px 12px rgba(33,150,243,0.4)" } : {}}
          >
            ⚡ 每日挑戰
            {activeTab !== "daily" && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-white text-[9px] font-extrabold">
                  NEW
                </span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "course" ? <CoreCourse /> : <DailyChallenge />}
    </div>
  );
}
