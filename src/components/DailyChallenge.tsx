"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import Link from "next/link";
import Mascot, { MascotBubble } from "./Mascot";

interface Challenge {
  id: number;
  date: string;
  category: "ai_in" | "history" | "who_am_i" | "odd_one";
  title_zh: string;
  description_zh: string | null;
}

interface ChallengeRecord {
  challenge_id: number;
  score: number;
  completed_at: string;
}

const categories = [
  { key: "ai_in" as const, label: "AI 通識", emoji: "🌍", color: "#FF6B35", filterLabel: "🌍 AI 通識" },
  { key: "history" as const, label: "AI 歷史館", emoji: "📜", color: "#F59E0B", filterLabel: "📜 AI 歷史館" },
  { key: "who_am_i" as const, label: "猜猜我是誰", emoji: "🕵️", color: "#CE82FF", filterLabel: "🕵️ 猜猜我是誰" },
  { key: "odd_one" as const, label: "搵出異類", emoji: "🔎", color: "#EC4899", filterLabel: "🔎 搵出異類" },
];

function getCategoryInfo(key: string) {
  return categories.find((c) => c.key === key) || categories[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-HK", { month: "long", day: "numeric" });
}

// ─── Today's Challenge Hero Card ───

function TodayHeroCard({ challenge, completed, score }: { challenge: Challenge | null; completed: boolean; score: number }) {
  if (!challenge) {
    return (
      <div className="bg-white border-2 border-[#E0EAF0] rounded-[22px] p-6 text-center mb-4">
        <Mascot size={80} mood="thinking" />
        <p className="text-[#A0907E] mt-3 font-medium">今日暫時沒有挑戰，明天再來！</p>
      </div>
    );
  }

  const cat = getCategoryInfo(challenge.category);

  return (
    <div className="mb-4">
      <div className="rounded-[22px] overflow-hidden shadow-lg">
        {/* Top gradient section */}
        <div
          className="relative p-5 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}CC)` }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

          <div className="relative z-10">
            {/* Date badge */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-white/80 text-xs font-bold">今日 · {formatDate(challenge.date)}</span>
            </div>

            <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{cat.label}</p>
            <h2 className="text-xl font-extrabold text-white mt-1">{challenge.title_zh}</h2>
            {challenge.description_zh && (
              <p className="text-white/70 text-sm mt-1">{challenge.description_zh}</p>
            )}

            {completed && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/25 rounded-full px-3 py-1.5 backdrop-blur-sm">
                <span className="text-sm">✅</span>
                <span className="text-white text-xs font-extrabold">今日已完成 · {score}/4</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="bg-white px-5 py-3 flex items-center justify-between border-t border-[#E0EAF0]">
          <div className="flex items-center gap-2 text-[#A0907E] text-xs font-medium">
            <span>{cat.emoji}</span>
            <span>{completed ? "你已經完成今日挑戰！" : "4題 · 約3分鐘 · 每日更新"}</span>
          </div>
          <Link
            href={`/challenge/${challenge.id}`}
            className="text-white text-xs font-extrabold px-4 py-2 rounded-full whitespace-nowrap bg-success shadow-[0_3px_0_0_#04B386]"
          >
            {completed ? "🔄 重做" : "立即開始 ▶"}
          </Link>
        </div>
      </div>

      {/* Completion success banner */}
      {completed && (
        <div className="bg-success/10 border-2 border-success/30 rounded-xl p-3 mt-3 flex items-center gap-2">
          <span className="text-xl">🎉</span>
          <p className="text-xs text-success font-bold flex-1">你已經完成今日挑戰，點擊上面可以重做！</p>
        </div>
      )}

    </div>
  );
}

// ─── Category Filter Tabs ───

function CategoryTabs({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            active === cat.key
              ? "text-white"
              : "text-[#C4B5A5] bg-white"
          }`}
          style={active === cat.key ? { background: cat.color } : {}}
        >
          {cat.filterLabel}
        </button>
      ))}
    </div>
  );
}

// ─── Past Challenge List Item ───

function PastChallengeItem({ challenge, record }: { challenge: Challenge; record?: ChallengeRecord }) {
  const cat = getCategoryInfo(challenge.category);
  const completed = !!record;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl mb-2 border-2 transition-all ${
        completed
          ? "bg-success/5 border-success/20"
          : "bg-white border-[#E0EAF0]"
      }`}
    >
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}BB)` }}
      >
        {cat.emoji}
      </div>

      {/* Title + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#2D2D2D] truncate">{challenge.title_zh}</p>
        <p className="text-xs text-[#C4B5A5]">{formatDate(challenge.date)}</p>
      </div>

      {/* Score + replay */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {completed && (
          <span className="text-xs font-extrabold text-success">
            {challenge.category === "who_am_i"
              ? (record!.score >= 3 ? "✅ 猜中" : "❌ 未猜中")
              : `${record!.score}/4 ${record!.score === 4 ? "✨" : ""}`
            }
          </span>
        )}
        <Link
          href={`/challenge/${challenge.id}`}
          className="text-xs font-bold text-white bg-success px-3 py-1.5 rounded-full shadow-[0_2px_0_0_#04B386]"
        >
          重玩
        </Link>
      </div>
    </div>
  );
}

// ─── Main DailyChallenge ───

export default function DailyChallenge() {
  const { user, loading: userLoading } = useUser();
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null);
  const [todayRecord, setTodayRecord] = useState<ChallengeRecord | null>(null);
  const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
  const [records, setRecords] = useState<Map<number, ChallengeRecord>>(new Map());
  const [activeCategory, setActiveCategory] = useState("ai_in");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      // Fetch today's challenge
      const { data: todayData } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("date", today)
        .single();

      if (todayData) {
        setTodayChallenge(todayData);

        // Check if user completed it
        const { data: recordData } = await supabase
          .from("daily_challenge_records")
          .select("*")
          .eq("user_id", user.id)
          .eq("challenge_id", todayData.id)
          .single();

        if (recordData) setTodayRecord(recordData);
      }

      // Fetch all past challenges
      const { data: pastData } = await supabase
        .from("daily_challenges")
        .select("*")
        .lt("date", today)
        .order("date", { ascending: false })
        .limit(30);

      if (pastData) setPastChallenges(pastData);

      // Fetch all user records
      const { data: allRecords } = await supabase
        .from("daily_challenge_records")
        .select("challenge_id, score, completed_at")
        .eq("user_id", user.id);

      if (allRecords) {
        const map = new Map<number, ChallengeRecord>();
        for (const r of allRecords) map.set(r.challenge_id, r);
        setRecords(map);
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

  const filteredPast = pastChallenges.filter((c) => c.category === activeCategory);

  return (
    <div className="px-4 pt-2">
      {/* Today's challenge */}
      <TodayHeroCard
        challenge={todayChallenge}
        completed={!!todayRecord}
        score={todayRecord?.score || 0}
      />

      {/* Past challenges */}
      <h3 className="font-extrabold text-base text-[#2D2D2D] mb-3 mt-6">過往挑戰記錄</h3>

      <CategoryTabs active={activeCategory} onSelect={setActiveCategory} />

      {filteredPast.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#C4B5A5] text-sm">暫時沒有此類別的過往挑戰</p>
        </div>
      ) : (
        <div>
          {filteredPast.map((challenge) => (
            <PastChallengeItem
              key={challenge.id}
              challenge={challenge}
              record={records.get(challenge.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
