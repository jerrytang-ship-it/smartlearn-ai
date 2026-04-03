"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import Link from "next/link";
import Mascot, { MascotBubble } from "./Mascot";
import ComboCounter from "./ComboCounter";
import XPAnimation from "./XPAnimation";
import { playCorrect, playWrong, playCombo, playComplete, playXP, playTap } from "@/lib/sounds";

export interface QuestionOption {
  id: number;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface Question {
  id: number;
  chapter_id: number;
  type: "mcq" | "true_false" | "fill_blank" | "ordering" | "match";
  prompt: string;
  explanation: string | null;
  options: QuestionOption[];
}

// ─── Shared Components ───

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-3 bg-[#FFF8F0] rounded-full overflow-hidden border border-[#F0E8E0]">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500"
        style={{ width: `${((current + 1) / total) * 100}%` }}
      />
    </div>
  );
}

function QuestionTypeBadge({ type }: { type: Question["type"] }) {
  const labels: Record<Question["type"], { text: string; emoji: string; color: string }> = {
    mcq: { text: "選擇題", emoji: "🔵", color: "bg-primary/10 text-primary-dark border-primary/20" },
    true_false: { text: "是非題", emoji: "⚖️", color: "bg-success/10 text-success-dark border-success/20" },
    fill_blank: { text: "填充題", emoji: "✏️", color: "bg-secondary/10 text-secondary-dark border-secondary/20" },
    ordering: { text: "排序題", emoji: "🔢", color: "bg-streak/10 text-streak border-streak/20" },
    match: { text: "配對題", emoji: "🧩", color: "bg-accent/10 text-accent-dark border-accent/20" },
  };
  const label = labels[type];
  return (
    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${label.color}`}>
      {label.emoji} {label.text}
    </span>
  );
}

function FeedbackBox({ correct, explanation }: { correct: boolean; explanation: string | null }) {
  if (!explanation) return null;
  return (
    <div className={`rounded-2xl p-4 animate-slide-up ${correct ? "bg-success/10 border-2 border-success/20" : "bg-accent/10 border-2 border-accent/20"}`}>
      <MascotBubble
        message={explanation}
        mood={correct ? "celebrating" : "encouraging"}
        mascotSize={40}
      />
    </div>
  );
}

// ─── 1. Multiple Choice ───

function MCQQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (correct: boolean, optionId: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const isCorrect = selected !== null && question.options.find((o) => o.id === selected)?.is_correct;

  const handleSelect = (optionId: number) => {
    if (answered) return;
    playTap();
    setSelected(optionId);
    setAnswered(true);
    const correct = question.options.find((o) => o.id === optionId)?.is_correct || false;
    onAnswer(correct, optionId);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-relaxed">{question.prompt}</p>
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          let style = "option-btn";
          if (answered && option.is_correct) style = "option-btn option-btn-correct";
          else if (answered && option.id === selected && !option.is_correct) style = "option-btn option-btn-wrong";

          return (
            <button key={option.id} onClick={() => handleSelect(option.id)} className={style}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-extrabold ${
                  answered && option.is_correct ? "border-success bg-success text-white"
                    : answered && option.id === selected ? "border-accent bg-accent text-white"
                    : "border-[#F0E8E0] text-[#C4B5A5]"
                }`}>
                  {answered && option.is_correct ? "✓" : answered && option.id === selected ? "✗" : String.fromCharCode(65 + idx)}
                </div>
                <span className="font-medium">{option.option_text}</span>
              </div>
            </button>
          );
        })}
      </div>
      {answered && <FeedbackBox correct={!!isCorrect} explanation={question.explanation} />}
    </div>
  );
}

// ─── 2. True / False ───
// Options in DB: one with is_correct=true (option_text = "正確" or "錯誤")
// If no options, falls back to: statement is false

function TrueFalseQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (correct: boolean, optionId: number) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // Determine the correct answer from options or default to false
  const correctOption = question.options.find((o) => o.is_correct);
  const correctValue = correctOption
    ? (correctOption.option_text === "正確" || correctOption.option_text === "TRUE" || correctOption.option_text === "true")
    : false;

  const handleSelect = (val: boolean) => {
    if (answered) return;
    const label = val ? "正確" : "錯誤";
    setSelected(label);
    setAnswered(true);
    const correct = val === correctValue;
    const optionId = correctOption?.id || -1;
    onAnswer(correct, correct ? optionId : -1);
  };

  const isCorrect = selected !== null && (selected === "正確") === correctValue;

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-relaxed">{question.prompt}</p>
      <div className="flex gap-4">
        {[true, false].map((val) => {
          const isThisCorrect = val === correctValue;
          let style = "flex-1 p-6 rounded-2xl text-center border-2 border-[#F0E8E0] bg-white shadow-[0_4px_0_0_#F0E8E0] active:translate-y-1 active:shadow-none transition-all";
          if (answered && isThisCorrect) {
            style = "flex-1 p-6 rounded-2xl text-center border-2 border-success bg-success/10 shadow-[0_4px_0_0_#04B386]";
          } else if (answered && !isThisCorrect && selected === (val ? "正確" : "錯誤")) {
            style = "flex-1 p-6 rounded-2xl text-center border-2 border-accent bg-accent/10 shadow-[0_4px_0_0_#D01070]";
          }
          return (
            <button key={val.toString()} onClick={() => handleSelect(val)} className={style}>
              <span className="text-4xl block mb-2">{val ? "⭕" : "❌"}</span>
              <span className="font-extrabold text-lg">{val ? "正確" : "錯誤"}</span>
            </button>
          );
        })}
      </div>
      {answered && <FeedbackBox correct={isCorrect} explanation={question.explanation} />}
    </div>
  );
}

// ─── 3. Fill in the Blank (MC style) ───
// Prompt contains ___ as the blank. Options are choices to fill it.

function FillBlankQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (correct: boolean, optionId: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const isCorrect = selected !== null && question.options.find((o) => o.id === selected)?.is_correct;
  const correctOption = question.options.find((o) => o.is_correct);

  const handleSelect = (optionId: number) => {
    if (answered) return;
    playTap();
    setSelected(optionId);
    setAnswered(true);
    const correct = question.options.find((o) => o.id === optionId)?.is_correct || false;
    onAnswer(correct, optionId);
  };

  // Split prompt at ___ to show the blank
  const parts = question.prompt.split("___");

  return (
    <div className="space-y-4">
      {/* Sentence with blank */}
      <div className="bg-white rounded-2xl p-5 border-2 border-[#F0E8E0]">
        <p className="text-lg font-bold leading-relaxed">
          {parts[0]}
          <span className={`inline-block min-w-[80px] mx-1 px-3 py-1 rounded-xl border-2 border-dashed text-center ${
            answered && isCorrect
              ? "border-success bg-success/10 text-success font-extrabold"
              : answered && !isCorrect
              ? "border-accent bg-accent/10 text-accent font-extrabold"
              : "border-primary bg-primary/10 text-primary"
          }`}>
            {answered
              ? (isCorrect ? question.options.find(o => o.id === selected)?.option_text : correctOption?.option_text)
              : "？？？"}
          </span>
          {parts[1] || ""}
        </p>
      </div>

      {/* Options as pills */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          let style = "p-3 rounded-2xl text-center border-2 border-[#F0E8E0] bg-white shadow-[0_3px_0_0_#F0E8E0] active:translate-y-0.5 active:shadow-none transition-all font-bold";
          if (answered && option.is_correct) {
            style = "p-3 rounded-2xl text-center border-2 border-success bg-success/10 shadow-[0_3px_0_0_#04B386] font-bold text-success";
          } else if (answered && option.id === selected && !option.is_correct) {
            style = "p-3 rounded-2xl text-center border-2 border-accent bg-accent/10 shadow-[0_3px_0_0_#D01070] font-bold text-accent line-through";
          }

          return (
            <button key={option.id} onClick={() => handleSelect(option.id)} className={style}>
              {option.option_text}
            </button>
          );
        })}
      </div>

      {answered && <FeedbackBox correct={!!isCorrect} explanation={question.explanation} />}
    </div>
  );
}

// ─── 4. Ordering ───
// Options are items to arrange. sort_order = correct position.
// User taps items to build the sequence.

function OrderingQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (correct: boolean, optionId: number) => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [shuffled] = useState(() =>
    [...question.options].sort(() => Math.random() - 0.5)
  );

  const remaining = shuffled.filter((o) => !selectedOrder.includes(o.id));
  const correctOrder = [...question.options].sort((a, b) => a.sort_order - b.sort_order).map((o) => o.id);

  const handleTap = (optionId: number) => {
    if (answered) return;
    const newOrder = [...selectedOrder, optionId];
    setSelectedOrder(newOrder);

    // Auto-submit when all items placed
    if (newOrder.length === question.options.length) {
      setAnswered(true);
      const isCorrect = newOrder.every((id, i) => id === correctOrder[i]);
      onAnswer(isCorrect, -1);
    }
  };

  const handleUndo = () => {
    if (answered || selectedOrder.length === 0) return;
    setSelectedOrder((prev) => prev.slice(0, -1));
  };

  const getOptionById = (id: number) => question.options.find((o) => o.id === id);

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-relaxed">{question.prompt}</p>

      {/* Placed items */}
      <div className="bg-white rounded-2xl p-4 border-2 border-[#F0E8E0] min-h-[60px]">
        {selectedOrder.length === 0 ? (
          <p className="text-[#C4B5A5] text-sm text-center py-2">點擊下方選項排列正確順序</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedOrder.map((id, idx) => {
              const opt = getOptionById(id);
              let style = "px-4 py-2 rounded-xl border-2 font-bold text-sm";
              if (!answered) {
                style += " border-primary bg-primary/10 text-primary-dark";
              } else if (id === correctOrder[idx]) {
                style += " border-success bg-success/10 text-success";
              } else {
                style += " border-accent bg-accent/10 text-accent";
              }
              return (
                <div key={id} className={style}>
                  <span className="text-xs opacity-60 mr-1">{idx + 1}.</span>
                  {opt?.option_text}
                </div>
              );
            })}
          </div>
        )}
        {!answered && selectedOrder.length > 0 && (
          <button onClick={handleUndo} className="text-xs text-[#C4B5A5] mt-2 hover:text-[#A0907E]">
            ← 撤銷上一個
          </button>
        )}
      </div>

      {/* Remaining choices */}
      {!answered && (
        <div className="flex flex-wrap gap-2">
          {remaining.map((option) => (
            <button
              key={option.id}
              onClick={() => handleTap(option.id)}
              className="px-4 py-2 rounded-xl border-2 border-[#F0E8E0] bg-white shadow-[0_3px_0_0_#F0E8E0] active:translate-y-0.5 active:shadow-none transition-all font-bold text-sm"
            >
              {option.option_text}
            </button>
          ))}
        </div>
      )}

      {/* Show correct order if wrong */}
      {answered && !selectedOrder.every((id, i) => id === correctOrder[i]) && (
        <div className="bg-primary/5 rounded-2xl p-4 border-2 border-primary/10">
          <p className="text-xs font-bold text-primary-dark mb-2">正確順序：</p>
          <div className="flex flex-wrap gap-2">
            {correctOrder.map((id, idx) => {
              const opt = getOptionById(id);
              return (
                <div key={id} className="px-3 py-1.5 rounded-xl border-2 border-success bg-success/10 text-success font-bold text-sm">
                  <span className="text-xs opacity-60 mr-1">{idx + 1}.</span>
                  {opt?.option_text}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {answered && <FeedbackBox correct={selectedOrder.every((id, i) => id === correctOrder[i])} explanation={question.explanation} />}
    </div>
  );
}

// ─── 5. Match Pairs ───
// Options stored as "term|definition" in option_text.
// User taps one from left, then one from right to make pairs.

function MatchQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (correct: boolean, optionId: number) => void;
}) {
  // Parse "term|definition" pairs
  const pairs = question.options.map((o) => {
    const [left, right] = o.option_text.split("|").map((s) => s.trim());
    return { id: o.id, left, right };
  });

  const [shuffledRight] = useState(() =>
    [...pairs].sort(() => Math.random() - 0.5).map((p) => ({ id: p.id, text: p.right }))
  );

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Map<number, { rightId: number; correct: boolean }>>(new Map());
  const [answered, setAnswered] = useState(false);

  const handleLeftTap = (pairId: number) => {
    if (answered || matched.has(pairId)) return;
    setSelectedLeft(pairId);
  };

  const handleRightTap = (rightItem: { id: number; text: string }) => {
    if (answered || selectedLeft === null) return;

    // Check if this right item is already matched
    const alreadyMatched = Array.from(matched.values()).some((m) => m.rightId === rightItem.id);
    if (alreadyMatched) return;

    const isCorrect = selectedLeft === rightItem.id;
    const newMatched = new Map(matched);
    newMatched.set(selectedLeft, { rightId: rightItem.id, correct: isCorrect });
    setMatched(newMatched);
    setSelectedLeft(null);

    // Auto-submit when all matched
    if (newMatched.size === pairs.length) {
      setAnswered(true);
      const allCorrect = Array.from(newMatched.values()).every((m) => m.correct);
      onAnswer(allCorrect, -1);
    }
  };

  const allCorrect = Array.from(matched.values()).every((m) => m.correct);
  const matchedRightIds = new Set(Array.from(matched.values()).map((m) => m.rightId));

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-relaxed">{question.prompt}</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair) => {
            const m = matched.get(pair.id);
            let style = "w-full p-3 rounded-xl border-2 text-left font-medium text-sm transition-all ";
            if (m?.correct) {
              style += "border-success bg-success/10 text-success";
            } else if (m && !m.correct) {
              style += "border-accent bg-accent/10 text-accent";
            } else if (selectedLeft === pair.id) {
              style += "border-primary bg-primary/10 text-primary-dark ring-2 ring-primary/30";
            } else if (matched.has(pair.id)) {
              style += "border-[#F0E8E0] bg-white text-[#C4B5A5]";
            } else {
              style += "border-[#F0E8E0] bg-white shadow-[0_3px_0_0_#F0E8E0] active:translate-y-0.5 active:shadow-none";
            }
            return (
              <button key={pair.id} onClick={() => handleLeftTap(pair.id)} className={style}>
                {pair.left}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map((item) => {
            const isMatched = matchedRightIds.has(item.id);
            const matchEntry = Array.from(matched.entries()).find(([, v]) => v.rightId === item.id);
            const isCorrectMatch = matchEntry ? matchEntry[1].correct : false;

            let style = "w-full p-3 rounded-xl border-2 text-left font-medium text-sm transition-all ";
            if (isMatched && isCorrectMatch) {
              style += "border-success bg-success/10 text-success";
            } else if (isMatched && !isCorrectMatch) {
              style += "border-accent bg-accent/10 text-accent";
            } else if (isMatched) {
              style += "border-[#F0E8E0] bg-white text-[#C4B5A5]";
            } else {
              style += "border-[#F0E8E0] bg-white shadow-[0_3px_0_0_#F0E8E0] active:translate-y-0.5 active:shadow-none";
            }
            return (
              <button key={item.id} onClick={() => handleRightTap(item)} className={style}>
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {!answered && selectedLeft !== null && (
        <p className="text-xs text-center text-primary font-bold animate-pulse">
          現在點擊右邊配對的選項
        </p>
      )}

      {answered && <FeedbackBox correct={allCorrect} explanation={question.explanation} />}
    </div>
  );
}

// ─── Completion Screen ───

function CompletionScreen({ score, total, wrongIds, isReview }: { score: number; total: number; wrongIds: number[]; isReview?: boolean }) {
  const percentage = Math.round((score / total) * 100);
  const xpEarned = isReview ? score * 5 : score * 15;
  const passed = percentage >= 60;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <div className="mb-4 animate-bounce-in">
        <Mascot size={120} mood={passed ? "celebrating" : "encouraging"} />
      </div>
      <h2 className="text-3xl font-extrabold mb-1 animate-slide-up">
        {isReview
          ? (passed ? "複習得好！🎉" : "再多練習！💪")
          : (passed ? "太棒了！🎉" : "繼續加油！💪")}
      </h2>
      <p className="text-[#A0907E] mb-6 font-medium">你答對了 {score}/{total} 題</p>
      <div className="bg-xp/20 border-2 border-xp rounded-3xl p-6 mb-6 w-full max-w-xs shadow-[0_4px_0_0_#F5B800] animate-bounce-in">
        <p className="text-4xl font-extrabold text-xp-dark">+{xpEarned} XP</p>
        <p className="text-sm text-xp-dark/70 font-bold mt-1">{isReview ? "複習獎勵！" : "經驗值已獲得！"}</p>
      </div>
      <div className="flex gap-4 mb-8 w-full max-w-xs">
        <div className="flex-1 bg-success/10 rounded-2xl p-3 border-2 border-success/20">
          <p className="text-2xl font-extrabold text-success">{score}</p>
          <p className="text-xs font-bold text-success/70">答對</p>
        </div>
        <div className="flex-1 bg-accent/10 rounded-2xl p-3 border-2 border-accent/20">
          <p className="text-2xl font-extrabold text-accent">{total - score}</p>
          <p className="text-xs font-bold text-accent/70">答錯</p>
        </div>
        <div className="flex-1 bg-primary/10 rounded-2xl p-3 border-2 border-primary/20">
          <p className="text-2xl font-extrabold text-primary-dark">{percentage}%</p>
          <p className="text-xs font-bold text-primary-dark/70">準確率</p>
        </div>
      </div>

      {/* Review mistakes button */}
      {wrongIds.length > 0 && !isReview && (
        <Link href={`/review?questions=${wrongIds.join(",")}`} className="btn-3d-accent w-full max-w-xs text-center text-base mb-3">
          🔄 複習錯題（{wrongIds.length} 題）
        </Link>
      )}

      <Link href="/" className="btn-3d-primary w-full max-w-xs text-center text-lg">
        返回地圖
      </Link>
    </div>
  );
}

// ─── Main LessonPlayer ───

export default function LessonPlayer({ chapterId, reviewQuestionIds, preloadedQuestions, isReview }: { chapterId?: number; reviewQuestionIds?: number[]; preloadedQuestions?: Question[]; isReview?: boolean }) {
  const { user, refreshStats } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showNext, setShowNext] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [xpTrigger, setXpTrigger] = useState(0);
  const [wrongIds, setWrongIds] = useState<number[]>([]);
  const [originalCount, setOriginalCount] = useState(0);
  const [isRetry, setIsRetry] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{ current_index: number; score: number; wrong_ids: string } | null>(null);

  // Save progress to Supabase
  const saveProgress = useCallback(async (idx: number, sc: number, wrongs: number[]) => {
    if (!user || !chapterId || isReview) return;
    await supabase.from("quiz_progress").upsert({
      user_id: user.id,
      chapter_id: chapterId,
      current_index: idx,
      score: sc,
      wrong_ids: JSON.stringify(wrongs),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,chapter_id" });
  }, [user, chapterId, isReview]);

  // Delete progress on completion
  const clearProgress = useCallback(async () => {
    if (!user || !chapterId) return;
    await supabase.from("quiz_progress").delete()
      .eq("user_id", user.id)
      .eq("chapter_id", chapterId);
  }, [user, chapterId]);

  useEffect(() => {
    async function fetchQuestions() {
      // If preloaded questions are provided, use them directly
      if (preloadedQuestions && preloadedQuestions.length > 0) {
        setQuestions(preloadedQuestions);
        setOriginalCount(preloadedQuestions.length);
        setLoading(false);
        return;
      }

      let questionsData;
      if (reviewQuestionIds && reviewQuestionIds.length > 0) {
        const { data } = await supabase
          .from("questions")
          .select("*")
          .in("id", reviewQuestionIds);
        questionsData = data;
      } else if (chapterId) {
        const { data } = await supabase
          .from("questions")
          .select("*")
          .eq("chapter_id", chapterId)
          .order("sort_order");
        questionsData = data;
      }

      if (questionsData && questionsData.length > 0) {
        const questionIds = questionsData.map((q) => q.id);
        const { data: optionsData } = await supabase
          .from("question_options")
          .select("*")
          .in("question_id", questionIds)
          .order("sort_order");

        const mapped: Question[] = questionsData.map((q) => ({
          ...q,
          options: (optionsData || []).filter((o) => o.question_id === q.id),
        }));

        setQuestions(mapped);
        setOriginalCount(mapped.length);

        // Check for saved progress (only for chapter quizzes, not reviews)
        if (user && chapterId && !isReview) {
          const { data: progress } = await supabase
            .from("quiz_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("chapter_id", chapterId)
            .single();

          if (progress && progress.current_index > 0) {
            setSavedProgress(progress);
            setShowResume(true);
          }
        }
      }
      setLoading(false);
    }

    fetchQuestions();
  }, [chapterId, user, isReview]);

  const handleAnswer = useCallback(async (correct: boolean, optionId: number) => {
    if (correct) {
      const newCombo = combo + 1;
      if (!isRetry) {
        setScore((s) => s + 1);
        setXpTrigger((t) => t + 1); // XP animation only on first attempt
      }
      setCombo(newCombo);
      setShowCombo(true);
      if (newCombo >= 3) {
        playCombo(newCombo);
      } else {
        playCorrect();
      }
      playXP();
    } else {
      setCombo(0);
      setShowCombo(false);
      setWrongIds((prev) => [...prev, questions[currentIndex].id]);
      // Append this question to the end for retry
      setQuestions((prev) => [...prev, prev[currentIndex]]);
      playWrong();
    }
    setShowNext(true);

    if (user && questions[currentIndex]) {
      await supabase.from("user_answers").insert({
        user_id: user.id,
        question_id: questions[currentIndex].id,
        selected_option_id: optionId > 0 ? optionId : null,
        is_correct: correct,
      });

      await supabase.rpc("record_answer", {
        p_user_id: user.id,
        p_is_correct: correct,
      });
    }

    // Save progress after each answer (only track original question progress, not retries)
    if (!isRetry) {
      const origCompleted = Math.min(currentIndex + 1, originalCount);
      const newScore = correct ? score + 1 : score;
      saveProgress(origCompleted, newScore, []);
    }
  }, [user, questions, currentIndex, combo, score, isRetry, saveProgress, originalCount]);

  const handleNext = async () => {
    playTap();
    if (currentIndex + 1 >= questions.length) {
      playComplete();
      if (user && !isReview && chapterId) {
        await supabase.rpc("complete_chapter", {
          p_user_id: user.id,
          p_chapter_id: chapterId,
          p_score: score,
        });
        await refreshStats();
        await clearProgress();
      }
      setCompleted(true);
    } else {
      const nextIdx = currentIndex + 1;
      // Check if next question is a retry (index beyond original count)
      setIsRetry(nextIdx >= originalCount);
      setCurrentIndex(nextIdx);
      setShowNext(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <MascotBubble message="準備題目中..." mood="thinking" mascotSize={64} />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <MascotBubble message="這個章節暫時還沒有題目，快回去看看其他章節吧！" mood="thinking" mascotSize={64} />
        <Link href="/" className="btn-3d-primary mt-6 text-center">返回地圖</Link>
      </div>
    );
  }

  // Resume prompt
  if (showResume && savedProgress) {
    const savedIdx = savedProgress.current_index;
    const allOriginalDone = savedIdx >= originalCount;
    const displayIndex = Math.min(savedIdx, originalCount);
    const resumeTotal = originalCount;

    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6 text-center">
        <Mascot size={100} mood="waving" />
        <h2 className="text-xl font-extrabold text-[#2D2D2D] mt-4 mb-2">歡迎返嚟！</h2>
        <p className="text-[#A0907E] mb-1">
          {allOriginalDone
            ? `你已完成所有 ${resumeTotal} 題`
            : `你上次做到第 ${displayIndex}/${resumeTotal} 題`
          }
        </p>
        <p className="text-[#A0907E] mb-6">得分：{savedProgress.score}/{resumeTotal}</p>

        <button
          onClick={() => {
            // If all original questions were done, restart from 0 (they were in retry loop)
            // Otherwise resume from where they left off
            const safeIndex = allOriginalDone ? 0 : Math.min(savedIdx, originalCount - 1);
            setCurrentIndex(safeIndex);
            setScore(allOriginalDone ? 0 : savedProgress.score);
            setWrongIds([]);
            setIsRetry(false);
            setShowResume(false);
            if (allOriginalDone) {
              clearProgress();
            }
          }}
          className="btn-3d-primary w-full max-w-xs text-lg mb-3"
        >
          {allOriginalDone ? "重新開始 ▶" : "繼續上次進度 ▶"}
        </button>
        <button
          onClick={async () => {
            await clearProgress();
            setShowResume(false);
          }}
          className="w-full max-w-xs py-3 rounded-2xl border-2 border-[#F0E8E0] text-[#A0907E] font-bold"
        >
          重新開始
        </button>
        <Link href="/" className="text-sm text-[#C4B5A5] mt-4 font-medium">
          返回課程
        </Link>
      </div>
    );
  }

  if (completed) {
    return <CompletionScreen score={score} total={originalCount} wrongIds={[]} isReview={isReview} />;
  }

  const question = questions[currentIndex];

  const renderQuestion = () => {
    const key = `${question.id}-${currentIndex}`;
    switch (question.type) {
      case "mcq":
        return <MCQQuestion key={key} question={question} onAnswer={handleAnswer} />;
      case "true_false":
        return <TrueFalseQuestion key={key} question={question} onAnswer={handleAnswer} />;
      case "fill_blank":
        return <FillBlankQuestion key={key} question={question} onAnswer={handleAnswer} />;
      case "ordering":
        return <OrderingQuestion key={key} question={question} onAnswer={handleAnswer} />;
      case "match":
        return <MatchQuestion key={key} question={question} onAnswer={handleAnswer} />;
      default:
        return <MCQQuestion key={key} question={question} onAnswer={handleAnswer} />;
    }
  };

  const xpPerQuestion = 15;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* XP fly animation */}
      <XPAnimation xp={xpPerQuestion} trigger={xpTrigger} combo={combo} />

      <div className="sticky top-0 bg-[#FFF8F0] z-40 px-4 pt-4 pb-3 border-b-2 border-[#F0E8E0]">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="text-[#C4B5A5] hover:text-[#A0907E] active:scale-90 transition-all">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          <div className="flex-1">
            <ProgressBar current={currentIndex} total={questions.length} />
          </div>
          <div className="flex items-center gap-1 bg-xp/20 px-2 py-1 rounded-full">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-extrabold text-xp-dark">{score * xpPerQuestion}</span>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto animate-slide-up" key={`q-${currentIndex}`}>
        {/* Retry badge */}
        {isRetry && (
          <div className="flex items-center justify-center gap-2 mb-3 animate-bounce-in">
            <span className="text-xs font-bold text-accent bg-accent/15 px-3 py-1.5 rounded-full">
              🔄 再試一次！答啱先可以繼續
            </span>
          </div>
        )}

        {/* Combo counter */}
        <ComboCounter combo={combo} show={showCombo} />

        {/* Mascot + question type badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-float">
            <Mascot
              size={52}
              mood={
                showNext
                  ? (wrongIds.includes(question.id) ? "encouraging" : "celebrating")
                  : question.type === "ordering" || question.type === "match"
                  ? "thinking"
                  : "happy"
              }
            />
          </div>
          <div>
            <QuestionTypeBadge type={question.type} />
            <p className="text-xs text-[#C4B5A5] mt-1 font-medium">
              {showNext
                ? (wrongIds.includes(question.id) ? "下次一定得！💪" : "做得好！🎉")
                : question.type === "ordering"
                ? "拖動排列正確順序 👆"
                : question.type === "match"
                ? "點擊左右配對 👆"
                : question.type === "fill_blank"
                ? "揀選正確答案填空 ✏️"
                : question.type === "true_false"
                ? "呢句說話啱定錯？🤔"
                : "揀選正確答案 👇"
              }
            </p>
          </div>
        </div>

        {renderQuestion()}

        {showNext && (
          <button
            onClick={handleNext}
            className="w-full mt-6 btn-3d-primary text-lg animate-bounce-in"
          >
            {currentIndex + 1 >= questions.length ? "查看結果 🎉" : "下一題 →"}
          </button>
        )}
      </div>
    </div>
  );
}
