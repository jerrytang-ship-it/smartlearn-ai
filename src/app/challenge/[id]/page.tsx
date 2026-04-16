"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import LessonPlayer, { type Question } from "@/components/LessonPlayer";
import Mascot from "@/components/Mascot";
import { MascotBubble } from "@/components/Mascot";
import Link from "next/link";

export default function ChallengePage() {
  const params = useParams();
  const challengeId = parseInt(params.id as string, 10);
  const { user, refreshStats } = useUser();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      const { data: qData } = await supabase
        .from("daily_challenge_q")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("sort_order");

      if (qData && qData.length > 0) {
        const qIds = qData.map((q) => q.id);
        const { data: optData } = await supabase
          .from("daily_challenge_opts")
          .select("*")
          .in("question_id", qIds)
          .order("sort_order");

        setQuestions(qData.map((q) => ({
          id: q.id,
          chapter_id: 0,
          type: q.type as Question["type"],
          prompt: q.prompt,
          explanation: q.explanation,
          options: (optData || []).filter((o) => o.question_id === q.id).map((o) => ({
            id: o.id,
            option_text: o.option_text,
            is_correct: o.is_correct,
            sort_order: o.sort_order,
          })),
        })));
      } else {
        setQuestions([]);
      }

      // Check if user already completed this challenge
      if (user) {
        const { data: record } = await supabase
          .from("daily_challenge_records")
          .select("id")
          .eq("user_id", user.id)
          .eq("challenge_id", challengeId)
          .single();

        if (record) setAlreadyCompleted(true);
      }

      setLoading(false);
    }

    fetchQuestions();
  }, [challengeId, user]);

  const handleComplete = async (score: number) => {
    if (!user) return;
    await supabase.from("daily_challenge_records").upsert({
      user_id: user.id,
      challenge_id: challengeId,
      score,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,challenge_id" });
    await refreshStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <MascotBubble message="載入中..." mood="thinking" mascotSize={64} />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Mascot size={80} mood="thinking" />
        <p className="text-[#A0907E] mt-4">此挑戰暫時沒有題目</p>
        <Link href="/" className="btn-3d-primary mt-4 text-center">返回</Link>
      </div>
    );
  }

  // First time: earn XP (isReview=false). Already completed: no XP (isReview=true).
  return <LessonPlayer preloadedQuestions={questions} isReview={alreadyCompleted} onComplete={handleComplete} />;
}
