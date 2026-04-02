"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import { MascotBubble } from "./Mascot";

interface Chapter {
  id: number;
  unit_id: number;
  title: string;
  sort_order: number;
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

interface Stage {
  id: number;
  label: string;
  emoji: string;
  color: string;
  unitRange: [number, number];
}

const defaultStages: Stage[] = [
  { id: 0, label: "基礎篇", emoji: "🌱", color: "#FF6B35", unitRange: [0, 32] },
  { id: 1, label: "進階篇", emoji: "🔥", color: "#1CB0F6", unitRange: [33, 65] },
  { id: 2, label: "大師篇", emoji: "🚀", color: "#CE82FF", unitRange: [66, 99] },
];

function getStageForUnit(sortOrder: number, stageList: Stage[]): Stage {
  return stageList.find((s) => sortOrder >= s.unitRange[0] && sortOrder <= s.unitRange[1]) || stageList[0] || defaultStages[0];
}

// ─── Progress Ring ───

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg width={52} height={52} viewBox="0 0 44 44" className="flex-shrink-0">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={radius} fill="none"
        stroke="white" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        className="transition-all duration-700"
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="800">
        {completed}/{total}
      </text>
    </svg>
  );
}

// ─── Current Unit Card ───

function CurrentUnitCard({ unit, stageColor }: { unit: Unit; stageColor: string }) {
  const completed = unit.chapters.filter((c) => c.status === "complete").length;
  const total = unit.chapters.length;
  const currentChapter = unit.chapters.find((c) => c.status === "unlocked");
  const chapterNum = currentChapter ? currentChapter.sort_order + 1 : completed + 1;

  return (
    <Link href={`/?unit=${unit.id}`} className="block mb-6 active:scale-[0.98] transition-transform">
      <div className="rounded-[22px] overflow-hidden shadow-lg">
        {/* Top gradient section */}
        <div
          className="relative p-5 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${stageColor}, ${stageColor}CC)` }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-white/70 text-xs font-bold">單元 {unit.sort_order + 1}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl">{unit.emoji}</span>
                <h2 className="text-xl font-extrabold text-white">{unit.title}</h2>
              </div>
              <p className="text-white/70 text-sm mt-1">{completed}/{total} 課完成</p>
            </div>
            <ProgressRing completed={completed} total={total} />
          </div>
        </div>

        {/* Bottom white strip */}
        <div className="bg-white px-5 py-3 flex items-center justify-between border-t border-[#F0E8E0]">
          <p className="text-sm text-[#A0907E] font-medium">
            {currentChapter ? (
              <>繼續第{chapterNum}課：<span className="text-[#2D2D2D] font-bold">{currentChapter.title}</span></>
            ) : (
              <span className="text-success font-bold">✅ 已完成所有課程</span>
            )}
          </p>
          {currentChapter && (
            <span
              className="text-white text-xs font-extrabold px-3 py-1.5 rounded-full"
              style={{ background: stageColor }}
            >
              繼續 ▶
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Stage Section ───

function StageSection({
  stage,
  units,
  defaultExpanded,
}: {
  stage: Stage;
  units: Unit[];
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const hasUnits = units.length > 0;

  return (
    <div className="mb-6">
      {/* Stage header / divider */}
      <button
        onClick={() => hasUnits && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 py-3 group ${!hasUnits ? "opacity-50" : ""}`}
      >
        <div className="flex-1 h-px bg-[#FFE8D9]" />
        <div className="flex items-center gap-2 text-sm font-extrabold" style={{ color: stage.color }}>
          <span>{stage.emoji}</span>
          <span>{stage.label}</span>
          {!hasUnits && <span className="text-xs text-[#C4B5A5] font-medium">（即將推出）</span>}
          {hasUnits && (
            <span className="text-[#C4B5A5] text-xs transition-transform" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
              ▼
            </span>
          )}
        </div>
        <div className="flex-1 h-px bg-[#FFE8D9]" />
      </button>

      {/* Collapsible unit grid */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? `${units.length * 200}px` : "0px" }}
      >
        <div className="grid grid-cols-2 gap-3 pt-2">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} stageColor={stage.color} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Unit Card (grid item) ───

function UnitCard({ unit, stageColor }: { unit: Unit; stageColor: string }) {
  const completed = unit.chapters.filter((c) => c.status === "complete").length;
  const total = unit.chapters.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;
  const isLocked = !unit.chapters.some((c) => c.status !== "locked");
  const isCurrent = unit.chapters.some((c) => c.status === "unlocked");

  const card = (
    <div
      className={`rounded-2xl overflow-hidden transition-all ${isCurrent ? "ring-2" : ""}`}
      style={{
        ...(isCurrent ? { "--tw-ring-color": stageColor } as React.CSSProperties : {}),
        boxShadow: "0 6px 18px rgba(0,0,0,0.08), 0 3px 0 rgba(0,0,0,0.04)",
      }}
    >
      {/* Top section with gradient */}
      <div
        className="p-3 pb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${stageColor}, ${stageColor}BB)` }}
      >
        <p className="text-white/60 text-xs font-bold">Unit {unit.sort_order + 1}</p>
        <span className="text-2xl block mt-1">{unit.emoji}</span>
        <p className="text-white font-extrabold text-sm mt-1 leading-tight line-clamp-2">{unit.title}</p>
      </div>

      {/* Bottom section */}
      <div className="bg-white p-3 border-t border-[#F0E8E0]">
        {isLocked ? (
          <p className="text-xs font-bold text-[#C4B5A5]">🔒 未解鎖</p>
        ) : isComplete ? (
          <p className="text-xs font-bold text-success">✅ 已完成</p>
        ) : (
          <>
            <div className="h-2 bg-[#FFE8D9] rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: stageColor }}
              />
            </div>
            <p className="text-xs font-bold" style={{ color: stageColor }}>{progress}%</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Link href={`/?unit=${unit.id}`} className="block active:scale-95 transition-transform">
      {card}
    </Link>
  );
}

// ─── Main CoreCourse ───

export default function CoreCourse() {
  const { user, stats, loading: userLoading } = useUser();
  const [units, setUnits] = useState<Unit[]>([]);
  const [stages, setStages] = useState<Stage[]>(defaultStages);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Fetch stages from DB (fall back to defaults if empty)
      const { data: stagesData } = await supabase.from("stages").select("*").order("sort_order");
      if (stagesData && stagesData.length > 0) {
        setStages(stagesData.map((s) => ({
          id: s.id,
          label: s.label,
          emoji: s.emoji,
          color: s.color,
          unitRange: [s.unit_from, s.unit_to] as [number, number],
        })));
      }

      const { data: unitsData } = await supabase.from("units").select("*").order("sort_order");
      const { data: chaptersData } = await supabase.from("chapters").select("id, unit_id, title, sort_order").order("sort_order");
      const { data: progressData } = await supabase.from("user_progress").select("chapter_id, status").eq("user_id", user.id);

      if (unitsData && chaptersData) {
        const progressMap = new Map((progressData || []).map((p) => [p.chapter_id, p.status]));
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
      }

      setLoading(false);
    }

    if (!userLoading) fetchData();
  }, [user, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <MascotBubble message="載入中..." mood="thinking" mascotSize={64} />
      </div>
    );
  }

  // Find current unit (first with an unlocked chapter)
  const currentUnit = units.find((u) => u.chapters.some((c) => c.status === "unlocked"));
  const currentStage = currentUnit ? getStageForUnit(currentUnit.sort_order, stages) : stages[0];

  // Group units by stage
  const unitsByStage = stages.map((stage) => ({
    stage,
    units: units.filter((u) => u.sort_order >= stage.unitRange[0] && u.sort_order <= stage.unitRange[1]),
  }));

  // Determine which stage the user is currently in
  const currentStageIndex = stages.indexOf(currentStage);

  return (
    <div className="px-4 pt-2">
      {/* Welcome */}
      <MascotBubble
        message={
          stats?.streak && stats.streak > 1
            ? `歡迎回來！🎉 連續學習 ${stats.streak} 天了！`
            : "歡迎來到智學AI！🐬 開始你的AI學習之旅吧！"
        }
        mood={stats?.streak && stats.streak > 1 ? "waving" : "happy"}
        className="mb-4 animate-slide-up"
      />

      {/* Current unit card (pinned) */}
      {currentUnit && (
        <CurrentUnitCard unit={currentUnit} stageColor={currentStage.color} />
      )}

      {/* Stage sections */}
      {unitsByStage.map(({ stage, units: stageUnits }, idx) => (
        <StageSection
          key={stage.label}
          stage={stage}
          units={stageUnits}
          defaultExpanded={idx === currentStageIndex}
        />
      ))}
    </div>
  );
}
