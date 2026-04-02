"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import Mascot from "./Mascot";
import Link from "next/link";

interface RecentAnswer {
  question_id: number;
  is_correct: boolean;
  answered_at: string;
  prompt: string;
  chapter_title: string;
}

interface ChapterProgress {
  chapter_id: number;
  title: string;
  unit_title: string;
  status: string;
  score: number | null;
  best_score: number | null;
}

interface WeeklyActivity {
  date: string;
  count: number;
  correct: number;
}

export default function ParentDashboard() {
  const { user, stats, loading: userLoading } = useUser();
  const [recentAnswers, setRecentAnswers] = useState<RecentAnswer[]>([]);
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Fetch recent answers with question text
      const { data: answers } = await supabase
        .from("user_answers")
        .select("question_id, is_correct, answered_at")
        .eq("user_id", user.id)
        .order("answered_at", { ascending: false })
        .limit(20);

      if (answers && answers.length > 0) {
        const qIds = [...Array.from(new Set(answers.map((a) => a.question_id)))];
        const { data: questions } = await supabase
          .from("questions")
          .select("id, prompt, chapter_id")
          .in("id", qIds);

        const chapterIds = [...Array.from(new Set((questions || []).map((q) => q.chapter_id)))];
        const { data: chapters } = await supabase
          .from("chapters")
          .select("id, title")
          .in("id", chapterIds);

        const qMap = new Map((questions || []).map((q) => [q.id, q]));
        const cMap = new Map((chapters || []).map((c) => [c.id, c]));

        setRecentAnswers(
          answers.map((a) => {
            const q = qMap.get(a.question_id);
            const c = q ? cMap.get(q.chapter_id) : null;
            return {
              ...a,
              prompt: q?.prompt || "",
              chapter_title: c?.title || "",
            };
          })
        );
      }

      // Fetch chapter progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("chapter_id, status, score, best_score")
        .eq("user_id", user.id);

      if (progress) {
        const chapIds = progress.map((p) => p.chapter_id);
        const { data: chapData } = await supabase
          .from("chapters")
          .select("id, title, unit_id")
          .in("id", chapIds);

        const unitIds = Array.from(new Set((chapData || []).map((c) => c.unit_id)));
        const { data: unitData } = await supabase
          .from("units")
          .select("id, title")
          .in("id", unitIds);

        const chapMap = new Map((chapData || []).map((c) => [c.id, c]));
        const unitMap = new Map((unitData || []).map((u) => [u.id, u]));

        setChapterProgress(
          progress
            .filter((p) => p.status === "complete")
            .map((p) => {
              const ch = chapMap.get(p.chapter_id);
              const u = ch ? unitMap.get(ch.unit_id) : null;
              return {
                ...p,
                title: ch?.title || "",
                unit_title: u?.title || "",
              };
            })
        );
      }

      // Compute weekly activity from answers
      const { data: weekAnswers } = await supabase
        .from("user_answers")
        .select("is_correct, answered_at")
        .eq("user_id", user.id)
        .gte("answered_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (weekAnswers) {
        const dayMap = new Map<string, { count: number; correct: number }>();
        for (const a of weekAnswers) {
          const day = a.answered_at.split("T")[0];
          const entry = dayMap.get(day) || { count: 0, correct: 0 };
          entry.count++;
          if (a.is_correct) entry.correct++;
          dayMap.set(day, entry);
        }

        // Fill in last 7 days
        const days: WeeklyActivity[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split("T")[0];
          const entry = dayMap.get(key) || { count: 0, correct: 0 };
          days.push({ date: key, ...entry });
        }
        setWeeklyActivity(days);
      }

      setLoading(false);
    }

    if (!userLoading) fetchData();
  }, [user, userLoading]);

  if (loading || userLoading || !user || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Mascot size={80} mood="thinking" />
      </div>
    );
  }

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  const weekDayLabels = ["日", "一", "二", "三", "四", "五", "六"];
  const maxDayCount = Math.max(...weeklyActivity.map((d) => d.count), 1);

  return (
    <div className="px-4 pb-28 pt-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="text-[#C4B5A5] hover:text-[#A0907E]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-[#2D2D2D]">📊 學習報告</h1>
          <p className="text-xs text-[#A0907E]">{user.displayName} 的學習進度</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30 rounded-3xl p-5 mb-6">
        <h2 className="font-extrabold text-base text-[#2D2D2D] mb-4">📊 學習概覽</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFF3EC]/50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-xp">{stats.xp}</p>
            <p className="text-xs text-[#A0907E]">總經驗值</p>
          </div>
          <div className="bg-[#FFF3EC]/50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-success">{accuracy}%</p>
            <p className="text-xs text-[#A0907E]">準確率</p>
          </div>
          <div className="bg-[#FFF3EC]/50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-streak">{stats.streak} 天</p>
            <p className="text-xs text-[#A0907E]">連續學習</p>
          </div>
          <div className="bg-[#FFF3EC]/50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-primary">{stats.chaptersCompleted}</p>
            <p className="text-xs text-[#A0907E]">完成章節</p>
          </div>
        </div>
        <div className="mt-3 bg-[#FFF3EC]/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-extrabold text-[#2D2D2D]">{stats.totalAnswered}</p>
          <p className="text-xs text-[#A0907E]">已回答題目（答對 {stats.totalCorrect} 題）</p>
        </div>
      </div>

      {/* Weekly activity chart */}
      <div className="bg-white border-2 border-[#F0E8E0] rounded-2xl p-5 mb-6 shadow-[0_3px_0_0_#F0E8E0]">
        <h2 className="font-extrabold text-base text-[#2D2D2D] mb-4">📅 本週活動</h2>
        <div className="flex items-end justify-between gap-1 h-32 mb-2">
          {weeklyActivity.map((day) => {
            const height = day.count > 0 ? Math.max((day.count / maxDayCount) * 100, 8) : 4;
            const correctRatio = day.count > 0 ? day.correct / day.count : 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-[#A0907E]">
                  {day.count > 0 ? day.count : ""}
                </span>
                <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${height}%`,
                      background: day.count > 0
                        ? `linear-gradient(to top, ${correctRatio > 0.7 ? "#06D6A0" : correctRatio > 0.4 ? "#FFD166" : "#F72585"}, ${correctRatio > 0.7 ? "#3DE4BA" : correctRatio > 0.4 ? "#FFDF8E" : "#F95FAA"})`
                        : "#2A2850",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between">
          {weeklyActivity.map((day) => {
            const d = new Date(day.date);
            return (
              <div key={day.date} className="flex-1 text-center">
                <span className="text-xs text-[#C4B5A5]">
                  週{weekDayLabels[d.getDay()]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-[#C4B5A5]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> 準確率 &gt;70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-xp inline-block" /> 40-70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> &lt;40%</span>
        </div>
      </div>

      {/* Completed chapters */}
      <div className="bg-white border-2 border-[#F0E8E0] rounded-2xl p-5 mb-6 shadow-[0_3px_0_0_#F0E8E0]">
        <h2 className="font-extrabold text-base text-[#2D2D2D] mb-4">✅ 已完成章節</h2>
        {chapterProgress.length === 0 ? (
          <p className="text-sm text-[#C4B5A5] text-center py-4">還未完成任何章節</p>
        ) : (
          <div className="space-y-2">
            {chapterProgress.map((cp) => (
              <div key={cp.chapter_id} className="flex items-center gap-3 bg-[#FFF3EC] rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center text-success text-sm font-bold">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2D2D2D] truncate">{cp.title}</p>
                  <p className="text-xs text-[#C4B5A5]">{cp.unit_title}</p>
                </div>
                {cp.best_score !== null && (
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-xp">{cp.best_score}</p>
                    <p className="text-xs text-[#C4B5A5]">最高分</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent answers */}
      <div className="bg-white border-2 border-[#F0E8E0] rounded-2xl p-5 shadow-[0_3px_0_0_#F0E8E0]">
        <h2 className="font-extrabold text-base text-[#2D2D2D] mb-4">📝 最近答題記錄</h2>
        {recentAnswers.length === 0 ? (
          <p className="text-sm text-[#C4B5A5] text-center py-4">還未回答任何題目</p>
        ) : (
          <div className="space-y-2">
            {recentAnswers.slice(0, 10).map((a, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-[#FFF3EC] rounded-xl p-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                  a.is_correct ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
                }`}>
                  {a.is_correct ? "✓" : "✗"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#2D2D2D] leading-snug line-clamp-2">{a.prompt}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#C4B5A5]">{a.chapter_title}</span>
                    <span className="text-xs text-[#C4B5A5]">
                      {new Date(a.answered_at).toLocaleDateString("zh-HK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
