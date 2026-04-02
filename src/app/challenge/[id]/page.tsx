"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LessonPlayer, { type Question } from "@/components/LessonPlayer";
import Mascot from "@/components/Mascot";
import Link from "next/link";

export default function ChallengePage() {
  const params = useParams();
  const challengeId = parseInt(params.id as string, 10);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }

    fetchQuestions();
  }, [challengeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Mascot size={80} mood="thinking" />
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

  return <LessonPlayer preloadedQuestions={questions} isReview />;
}
