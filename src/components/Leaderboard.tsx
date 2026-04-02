"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import Mascot from "./Mascot";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  xp: number;
  level: number;
  streak: number;
}

const medals = ["🥇", "🥈", "🥉"];

type Tab = "alltime" | "monthly";

function EntryRow({ entry, rank, isMe }: { entry: LeaderboardEntry; rank: number; isMe: boolean }) {
  const isTop3 = rank <= 3;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
        isMe
          ? "bg-primary/15 border-2 border-primary/30 shadow-[0_3px_0_0] shadow-primary/20"
          : isTop3
          ? "bg-white border-2 border-xp/20 shadow-[0_3px_0_0] shadow-xp/20"
          : "bg-white border-2 border-[#F0E8E0] shadow-[0_3px_0_0_#F0E8E0]"
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm ${
        isTop3 ? "bg-xp/15 text-xp" : "bg-[#FFE8D9] text-[#A0907E]"
      }`}>
        {isTop3 ? medals[rank - 1] : rank}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${isMe ? "text-primary" : "text-[#2D2D2D]"}`}>
          {entry.display_name}
          {isMe && <span className="text-xs text-primary ml-1">（你）</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-[#C4B5A5]">
          <span>等級 {entry.level}</span>
          {entry.streak > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="text-xs">🔥</span>{entry.streak}天
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className={`font-extrabold text-sm ${isTop3 ? "text-xp" : "text-[#A0907E]"}`}>
          {entry.xp}
        </p>
        <p className="text-xs text-[#C4B5A5]">XP</p>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user, loading: userLoading } = useUser();
  const [tab, setTab] = useState<Tab>("alltime");
  const [allTimeEntries, setAllTimeEntries] = useState<LeaderboardEntry[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [nameMap, setNameMap] = useState<Map<string, { name: string; level: number; streak: number }>>(new Map());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Fetch user names + stats once
  useEffect(() => {
    async function fetchNames() {
      if (!user) return;

      const { data: statsData } = await supabase
        .from("user_stats")
        .select("user_id, level, streak");

      const { data: usersData } = await supabase
        .from("users")
        .select("id, display_name, nickname");

      const nickMap = new Map(
        (usersData || []).map((u) => [u.id, u.nickname || u.display_name || "同學仔"])
      );
      const statsMap = new Map(
        (statsData || []).map((s) => [s.user_id, { level: s.level, streak: s.streak }])
      );

      const combined = new Map<string, { name: string; level: number; streak: number }>();
      Array.from(nickMap.entries()).forEach(([id, name]) => {
        const s = statsMap.get(id) || { level: 1, streak: 0 };
        combined.set(id, { name, ...s });
      });
      setNameMap(combined);
    }

    if (!userLoading) fetchNames();
  }, [user, userLoading]);

  // Fetch all-time leaderboard
  useEffect(() => {
    async function fetchAllTime() {
      const { data } = await supabase
        .from("user_stats")
        .select("user_id, xp")
        .order("xp", { ascending: false })
        .limit(50);

      if (data) {
        setAllTimeEntries(data.map((d) => {
          const info = nameMap.get(d.user_id);
          return {
            user_id: d.user_id,
            display_name: info?.name || "同學仔",
            xp: d.xp,
            level: info?.level || 1,
            streak: info?.streak || 0,
          };
        }));
      }
      setLoading(false);
    }

    if (nameMap.size > 0) fetchAllTime();
  }, [nameMap]);

  // Fetch monthly leaderboard (re-fetch when selectedMonth changes)
  useEffect(() => {
    async function fetchMonthly() {
      setMonthlyLoading(true);
      const dateStr = selectedMonth.toISOString().split("T")[0];
      const { data } = await supabase.rpc("get_monthly_xp", { p_month: dateStr });

      if (data) {
        setMonthlyEntries(data.map((d: { user_id: string; monthly_xp: number }) => {
          const info = nameMap.get(d.user_id);
          return {
            user_id: d.user_id,
            display_name: info?.name || "同學仔",
            xp: d.monthly_xp,
            level: info?.level || 1,
            streak: info?.streak || 0,
          };
        }));
      } else {
        setMonthlyEntries([]);
      }
      setMonthlyLoading(false);
    }

    if (nameMap.size > 0) fetchMonthly();
  }, [nameMap, selectedMonth]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-float"><Mascot size={80} mood="thinking" /></div>
      </div>
    );
  }

  const entries = tab === "alltime" ? allTimeEntries : monthlyEntries;
  const myEntry = entries.find((e) => e.user_id === user?.id);
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;

  const monthLabel = selectedMonth.toLocaleDateString("zh-HK", { year: "numeric", month: "long" });

  const isCurrentMonth = (() => {
    const now = new Date();
    return selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() === now.getMonth();
  })();

  const goToPrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    if (!isCurrentMonth) {
      setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
    }
  };

  return (
    <div className="px-4 pb-28 pt-4 max-w-lg mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-extrabold text-[#2D2D2D]">🏆 排行榜</h1>
        <p className="text-sm text-[#A0907E] mt-1">看看誰學得最多！</p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-[#FFE8D9] rounded-full p-1 mb-5">
        <button
          onClick={() => setTab("alltime")}
          className={`flex-1 py-2 rounded-full text-sm font-extrabold transition-all ${
            tab === "alltime" ? "bg-white text-[#2D2D2D] shadow-sm" : "text-[#A0907E]"
          }`}
        >
          🏅 全部時間
        </button>
        <button
          onClick={() => setTab("monthly")}
          className={`flex-1 py-2 rounded-full text-sm font-extrabold transition-all ${
            tab === "monthly" ? "bg-white text-[#2D2D2D] shadow-sm" : "text-[#A0907E]"
          }`}
        >
          📅 每月
        </button>
      </div>

      {/* Month selector (only when monthly tab is active) */}
      {tab === "monthly" && (
        <div className="flex items-center justify-center gap-4 mb-5">
          <button
            onClick={goToPrevMonth}
            className="w-9 h-9 rounded-full bg-white border-2 border-[#F0E8E0] flex items-center justify-center text-[#A0907E] active:scale-90 transition-all shadow-[0_3px_0_0_#F0E8E0] active:translate-y-0.5 active:shadow-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-extrabold text-[#2D2D2D] min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={`w-9 h-9 rounded-full bg-white border-2 border-[#F0E8E0] flex items-center justify-center active:scale-90 transition-all shadow-[0_3px_0_0_#F0E8E0] active:translate-y-0.5 active:shadow-none ${
              isCurrentMonth ? "opacity-30 cursor-not-allowed" : "text-[#A0907E]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* My rank card */}
      {myRank && user && myEntry && (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 mb-5 text-white shadow-[0_4px_0_0_#5A10D4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-extrabold text-lg backdrop-blur-sm">
              {myRank}
            </div>
            <div className="flex-1">
              <p className="font-extrabold">{user.nickname || user.displayName}</p>
              <p className="text-white/70 text-xs">你的排名</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-xp">{myEntry.xp} XP</p>
            </div>
          </div>
        </div>
      )}

      {/* Entries list */}
      {monthlyLoading && tab === "monthly" ? (
        <div className="flex items-center justify-center py-12">
          <Mascot size={60} mood="thinking" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Mascot size={80} mood="encouraging" />
          <p className="text-[#A0907E] mt-4 font-medium">
            {tab === "monthly" ? `${monthLabel}暫時未有人上榜，成為第一個吧！` : "還沒有人上榜，成為第一個吧！"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <EntryRow
              key={entry.user_id}
              entry={entry}
              rank={idx + 1}
              isMe={user?.id === entry.user_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
