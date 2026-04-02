"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LessonPlayer from "@/components/LessonPlayer";
import { useUser } from "@/lib/user";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Mascot, { MascotBubble } from "@/components/Mascot";
import Link from "next/link";

function ReviewContent() {
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const [questionIds, setQuestionIds] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestions() {
      // Check if specific questions were passed via URL
      const questionsParam = searchParams.get("questions");
      if (questionsParam) {
        const ids = questionsParam.split(",").map(Number).filter(Boolean);
        setQuestionIds(ids);
        setLoading(false);
        return;
      }

      // Otherwise, load all unresolved wrong questions
      if (user) {
        const { data } = await supabase.rpc("get_unresolved_wrong_questions", {
          p_user_id: user.id,
        });
        setQuestionIds(data || []);
      }
      setLoading(false);
    }

    if (!userLoading) loadQuestions();
  }, [searchParams, user, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <MascotBubble message="準備複習題目..." mood="thinking" mascotSize={64} />
      </div>
    );
  }

  if (!questionIds || questionIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Mascot size={100} mood="celebrating" />
        <h2 className="text-xl font-extrabold mt-4 mb-2">沒有需要複習的題目！🎉</h2>
        <p className="text-gray-500 mb-6">你已經掌握了所有題目，做得好！</p>
        <Link href="/" className="btn-3d-primary text-center">返回地圖</Link>
      </div>
    );
  }

  return <LessonPlayer reviewQuestionIds={questionIds} isReview />;
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Mascot size={80} mood="thinking" />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
