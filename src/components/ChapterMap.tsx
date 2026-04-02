"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import { MascotBubble } from "./Mascot";

interface Chapter {
  id: number;
  unit_id: number;
  title: string;
  description: string;
  sort_order: number;
  xp_reward: number;
  status: "locked" | "unlocked" | "complete";
}

interface Unit {
  id: number;
  title: string;
  description: string;
  emoji: string;
  sort_order: number;
  chapters: Chapter[];
}

// Theme colours per unit index
const unitThemes = [
  { from: "#FF6B35", to: "#FF9500" }, // orange
  { from: "#1CB0F6", to: "#0099CC" }, // blue
  { from: "#CE82FF", to: "#9B59B6" }, // purple
  { from: "#58CC02", to: "#3daa00" }, // green
  { from: "#FF4B4B", to: "#CC0000" }, // red
  { from: "#FFB800", to: "#FF9500" }, // yellow
];

function getTheme(index: number) {
  return unitThemes[index % unitThemes.length];
}

function isUnitUnlocked(unit: Unit): boolean {
  return unit.chapters.some((c) => c.status !== "locked");
}

// ─── Progress Ring SVG ───

function ProgressRing({ completed, total, size = 52 }: { completed: number; total: number; size?: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="flex-shrink-0">
      {/* Track */}
      <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      {/* Fill */}
      <circle
        cx="22" cy="22" r={radius} fill="none"
        stroke="white" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        className="transition-all duration-700"
      />
      {/* Center text */}
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="800">
        {completed}/{total}
      </text>
    </svg>
  );
}

// ─── Unit Tabs ───

function UnitTabs({
  units,
  activeIndex,
  onSelect,
}: {
  units: Unit[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative mb-4">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#FFF8F0] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#FFF8F0] to-transparent z-10 pointer-events-none" />

      <div ref={scrollRef} className="flex gap-2 overflow-x-auto px-4 py-1 no-scrollbar">
        {units.map((unit, idx) => {
          const active = idx === activeIndex;
          const unlocked = isUnitUnlocked(unit);
          const theme = getTheme(idx);
          const completed = unit.chapters.filter((c) => c.status === "complete").length;
          const total = unit.chapters.length;

          return (
            <button
              key={unit.id}
              onClick={() => onSelect(idx)}
              className={`flex-shrink-0 rounded-2xl p-3 min-w-[130px] transition-all ${
                !unlocked ? "opacity-[0.38]" : ""
              }`}
              style={active && unlocked ? {
                background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                boxShadow: `0 4px 0 0 ${theme.to}`,
              } : {
                background: "#FFFFFF",
                border: "2px solid #F0E8E0",
              }}
            >
              <div className="text-left">
                <span className="text-xl">{unit.emoji}</span>
                <p className={`text-sm font-extrabold mt-1 leading-tight ${
                  active && unlocked ? "text-white" : "text-[#2D2D2D]"
                }`}>
                  {unit.title}
                </p>
                <p className={`text-xs mt-0.5 ${
                  active && unlocked ? "text-white/70" : "text-[#C4B5A5]"
                }`}>
                  {unlocked ? `${completed}/${total} 完成` : "🔒 未解鎖"}
                </p>

                {/* Mini dot indicators for active unlocked unit */}
                {active && unlocked && (
                  <div className="flex gap-1 mt-1.5">
                    {unit.chapters.map((ch) => (
                      <div
                        key={ch.id}
                        className={`w-2 h-2 rounded-full ${
                          ch.status === "complete" ? "bg-white" : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Unit Hero Banner ───

function UnitHeroBanner({ unit, index }: { unit: Unit; index: number }) {
  const theme = getTheme(index);
  const unlocked = isUnitUnlocked(unit);
  const completed = unit.chapters.filter((c) => c.status === "complete").length;
  const total = unit.chapters.length;

  return (
    <div
      className={`relative rounded-[22px] p-5 mb-6 overflow-hidden ${!unlocked ? "opacity-60" : ""}`}
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex-1">
          <span className="text-3xl">{unit.emoji}</span>
          <h2 className="text-xl font-extrabold text-white mt-1">{unit.title}</h2>
          <p className="text-white/70 text-sm mt-0.5">{unit.description}</p>
        </div>
        <ProgressRing completed={completed} total={total} />
      </div>
    </div>
  );
}

// ─── Locked Unit View ───

function LockedUnitView({ unit, index, prevUnitTitle, prevRemaining }: {
  unit: Unit;
  index: number;
  prevUnitTitle: string;
  prevRemaining: number;
}) {
  return (
    <div className="px-4 pb-8">
      <UnitHeroBanner unit={unit} index={index} />

      {/* Locked message card */}
      <div className="border-2 border-dashed border-[#F0E8E0] rounded-2xl p-6 text-center mb-8">
        <span className="text-4xl block mb-3">🔒</span>
        <h3 className="text-lg font-extrabold text-[#2D2D2D] mb-2">
          Unit {index + 1} 仲未解鎖
        </h3>
        <p className="text-sm text-[#A0907E] mb-3">
          完成「{prevUnitTitle}」的所有課，就可以解鎖！
        </p>
        {prevRemaining > 0 && (
          <span className="inline-block text-xs font-bold text-primary bg-primary/15 px-3 py-1.5 rounded-full">
            還差 {prevRemaining} 課 →
          </span>
        )}
      </div>

      {/* Ghost teaser of first 3 chapters */}
      <div className="opacity-20 pointer-events-none flex flex-col items-center">
        {unit.chapters.slice(0, 3).map((chapter, idx) => (
          <div key={chapter.id}>
            {idx > 0 && <PathConnector />}
            <div className="py-3 flex flex-col items-center">
              <div className="w-[72px] h-[72px] rounded-full bg-[#FFE8D9] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#C4B5A5]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <p className="mt-2 text-sm font-bold text-[#C4B5A5] text-center max-w-[100px]">{chapter.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chapter Path Components ───

function ChapterNode({ chapter, index, theme }: { chapter: Chapter; index: number; theme: { from: string; to: string } }) {
  const isComplete = chapter.status === "complete";
  const isUnlocked = chapter.status === "unlocked";
  const isLocked = chapter.status === "locked";

  const positions = ["self-center", "self-start ml-8", "self-center", "self-end mr-8", "self-center"];
  const pos = positions[index % 5];

  const node = (
    <div className={`flex flex-col items-center ${pos} transition-all`}>
      {/* "Start learning" bubble for current chapter */}
      {isUnlocked && (
        <div className="mb-2 px-3 py-1.5 rounded-full text-white text-xs font-bold animate-bounce"
          style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
          ▶ 而家學習
        </div>
      )}

      <div
        className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-extrabold transition-all"
        style={
          isComplete
            ? { background: `linear-gradient(135deg, #06D6A0, #04B386)`, boxShadow: "0 6px 0 0 #04B386" }
            : isUnlocked
            ? { background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, boxShadow: `0 6px 0 0 ${theme.to}` }
            : { background: "#FFE8D9", boxShadow: "0 4px 0 0 #F0E8E0" }
        }
      >
        {isComplete ? (
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : isUnlocked ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-[#C4B5A5]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        )}
        {isComplete && <div className="absolute -top-2 -right-1 text-lg">👑</div>}
        {isUnlocked && (
          <div className="absolute inset-0 rounded-full border-4 animate-ping" style={{ borderColor: `${theme.from}50`, animationDuration: "2s" }} />
        )}
      </div>

      <p className={`mt-2 text-sm font-bold text-center max-w-[100px] leading-tight ${
        isLocked ? "text-[#C4B5A5]" : isComplete ? "text-success" : "text-[#2D2D2D]"
      }`}>
        {chapter.title}
      </p>

      {isComplete && (
        <span className="text-xs font-bold text-xp bg-xp/15 px-2 py-0.5 rounded-full mt-1">
          +{chapter.xp_reward} XP
        </span>
      )}
    </div>
  );

  if (isLocked) return <div className="py-3">{node}</div>;

  return (
    <Link href={`/lesson/${chapter.id}`} className="py-3 block active:scale-95 transition-transform">
      {node}
    </Link>
  );
}

function PathConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-[#FFE8D9]" />
        ))}
      </div>
    </div>
  );
}

// ─── Main ChapterMap ───

export default function ChapterMap({ focusUnitId }: { focusUnitId?: number } = {}) {
  const { user, stats, loading: userLoading } = useUser();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [wrongCount, setWrongCount] = useState(0);
  const [activeUnitIndex, setActiveUnitIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const { data: unitsData } = await supabase.from("units").select("*").order("sort_order");
      const { data: chaptersData } = await supabase.from("chapters").select("*").order("sort_order");
      const { data: progressData } = await supabase.from("user_progress").select("chapter_id, status").eq("user_id", user.id);

      if (unitsData && chaptersData) {
        const progressMap = new Map(
          (progressData || []).map((p) => [p.chapter_id, p.status])
        );
        const mapped: Unit[] = unitsData.map((u) => ({
          ...u,
          chapters: chaptersData
            .filter((c) => c.unit_id === u.id)
            .map((c) => ({
              ...c,
              status: (progressMap.get(c.id) as Chapter["status"]) || "locked",
            })),
        }));
        setUnits(mapped);

        // If focusUnitId is set, select that unit; otherwise auto-select current
        if (focusUnitId) {
          const idx = mapped.findIndex((u) => u.id === focusUnitId);
          if (idx >= 0) setActiveUnitIndex(idx);
        } else {
          const currentIdx = mapped.findIndex((u) =>
            u.chapters.some((c) => c.status === "unlocked")
          );
          if (currentIdx >= 0) setActiveUnitIndex(currentIdx);
        }
      }

      const { data: wrongData } = await supabase.rpc("get_unresolved_wrong_questions", { p_user_id: user.id });
      setWrongCount(wrongData?.length || 0);

      setLoading(false);
    }

    if (!userLoading) fetchData();
  }, [user, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <MascotBubble message="載入中..." mood="thinking" mascotSize={64} />
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <MascotBubble message="暫時沒有課程內容，請稍後再來！" mood="thinking" mascotSize={64} />
      </div>
    );
  }

  const activeUnit = units[activeUnitIndex];
  const unlocked = isUnitUnlocked(activeUnit);
  const theme = getTheme(activeUnitIndex);

  // For locked units, find the previous unit info
  const prevUnit = activeUnitIndex > 0 ? units[activeUnitIndex - 1] : null;
  const prevRemaining = prevUnit
    ? prevUnit.chapters.filter((c) => c.status !== "complete").length
    : 0;

  const currentChapter = units.flatMap((u) => u.chapters).find((c) => c.status === "unlocked");
  const welcomeMessage = stats?.streak && stats.streak > 1
    ? `歡迎回來！🎉 你已經連續學習 ${stats.streak} 天了！${currentChapter ? `繼續挑戰「${currentChapter.title}」吧！` : ""}`
    : currentChapter
    ? `歡迎來到智學AI！🐬 點擊「${currentChapter.title}」開始學習吧！`
    : "歡迎來到智學AI！🐬";

  return (
    <div className="pb-28 pt-2">
      {/* When focused on a single unit, show back button */}
      {focusUnitId ? (
        <div className="px-4 mb-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[#A0907E] hover:text-[#2D2D2D] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold">返回課程列表</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Welcome mascot */}
          <div className="px-4 mb-4">
            <MascotBubble
              message={welcomeMessage}
              mood={stats?.streak && stats.streak > 1 ? "waving" : "happy"}
              className="animate-slide-up"
            />
          </div>

          {/* Review wrong answers */}
          {wrongCount > 0 && (
            <div className="px-4 mb-4">
              <Link href="/review" className="block active:scale-95 transition-transform">
                <div className="bg-accent/10 border-2 border-accent/30 rounded-3xl p-4 shadow-[0_4px_0_0] shadow-accent/20 flex items-center gap-3">
                  <span className="text-3xl">🔄</span>
                  <div className="flex-1">
                    <p className="font-extrabold text-base text-[#2D2D2D]">複習錯題</p>
                    <p className="text-sm text-[#A0907E]">你有 {wrongCount} 題需要複習</p>
                  </div>
                  <div className="btn-3d-accent px-4 py-2 text-sm">開始</div>
                </div>
              </Link>
            </div>
          )}

          {/* Unit tabs */}
          <UnitTabs units={units} activeIndex={activeUnitIndex} onSelect={setActiveUnitIndex} />
        </>
      )}

      {/* Content area: hero banner + path OR locked view */}
      {unlocked ? (
        <div className="px-4">
          <UnitHeroBanner unit={activeUnit} index={activeUnitIndex} />
          <div className="flex flex-col">
            {activeUnit.chapters.map((chapter, idx) => (
              <div key={chapter.id}>
                {idx > 0 && <PathConnector />}
                <ChapterNode chapter={chapter} index={idx} theme={theme} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <LockedUnitView
          unit={activeUnit}
          index={activeUnitIndex}
          prevUnitTitle={prevUnit?.title || "上一單元"}
          prevRemaining={prevRemaining}
        />
      )}
    </div>
  );
}
