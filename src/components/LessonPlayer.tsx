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

// ─── Confirm Button ───

function ConfirmButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;
  return (
    <button
      onClick={onClick}
      className="w-full py-3.5 rounded-[16px] font-extrabold text-white text-base transition-all active:translate-y-1 active:shadow-none animate-slide-up"
      style={{ background: "linear-gradient(135deg, #FF6B35, #FF9A5C)", boxShadow: "0 4px 0 0 #E05520, 0 6px 16px rgba(255,107,53,0.3)" }}
    >
      確認 ✓
    </button>
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
  };

  const handleConfirm = () => {
    if (selected === null || answered) return;
    setAnswered(true);
    const correct = question.options.find((o) => o.id === selected)?.is_correct || false;
    onAnswer(correct, selected);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-relaxed">{question.prompt}</p>
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          let style = "option-btn";
          if (answered && option.is_correct) style = "option-btn option-btn-correct";
          else if (answered && option.id === selected && !option.is_correct) style = "option-btn option-btn-wrong";
          else if (!answered && option.id === selected) style = "option-btn option-btn-selected";

          return (
            <button key={option.id} onClick={() => handleSelect(option.id)} className={style}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-extrabold ${
                  answered && option.is_correct ? "border-success bg-success text-white"
                    : answered && option.id === selected ? "border-accent bg-accent text-white"
                    : option.id === selected ? "border-[#FF6B35] text-[#FF6B35]"
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
      <ConfirmButton show={selected !== null && !answered} onClick={handleConfirm} />
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
    setSelected(val ? "正確" : "錯誤");
  };

  const handleConfirm = () => {
    if (selected === null || answered) return;
    setAnswered(true);
    const correct = (selected === "正確") === correctValue;
    const optionId = correctOption?.id || -1;
    onAnswer(correct, correct ? optionId : -1);
  };

  const isCorrect = selected !== null && (selected === "正確") === correctValue;

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-relaxed">{question.prompt}</p>
      <div className="flex gap-4">
        {[true, false].map((val) => {
          const label = val ? "正確" : "錯誤";
          const isThisCorrect = val === correctValue;
          let style = "flex-1 p-6 rounded-2xl text-center border-2 border-[#F0E8E0] bg-white shadow-[0_4px_0_0_#F0E8E0] active:translate-y-1 active:shadow-none transition-all";
          if (answered && isThisCorrect) {
            style = "flex-1 p-6 rounded-2xl text-center border-2 border-success bg-success/10 shadow-[0_4px_0_0_#04B386]";
          } else if (answered && !isThisCorrect && selected === label) {
            style = "flex-1 p-6 rounded-2xl text-center border-2 border-accent bg-accent/10 shadow-[0_4px_0_0_#D01070]";
          } else if (!answered && selected === label) {
            style = "flex-1 p-6 rounded-2xl text-center border-2 border-[#FF6B35] bg-[#FFF3EC] shadow-[0_4px_0_0_#FF6B35]";
          }
          return (
            <button key={val.toString()} onClick={() => handleSelect(val)} className={style}>
              <span className="text-4xl block mb-2">{val ? "⭕" : "❌"}</span>
              <span className="font-extrabold text-lg">{label}</span>
            </button>
          );
        })}
      </div>
      <ConfirmButton show={selected !== null && !answered} onClick={handleConfirm} />
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
  };

  const handleConfirm = () => {
    if (selected === null || answered) return;
    setAnswered(true);
    const correct = question.options.find((o) => o.id === selected)?.is_correct || false;
    onAnswer(correct, selected);
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
          } else if (!answered && option.id === selected) {
            style = "p-3 rounded-2xl text-center border-2 border-[#FF6B35] bg-[#FFF3EC] shadow-[0_3px_0_0_#FF6B35] font-bold text-[#FF6B35]";
          }

          return (
            <button key={option.id} onClick={() => handleSelect(option.id)} className={style}>
              {option.option_text}
            </button>
          );
        })}
      </div>

      <ConfirmButton show={selected !== null && !answered} onClick={handleConfirm} />
      {answered && <FeedbackBox correct={!!isCorrect} explanation={question.explanation} />}
    </div>
  );
}

// ─── 4. Ordering ───
// Options are items to arrange. sort_order = correct position.
// User taps items to place them into numbered slots.

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
  const totalSlots = question.options.length;
  const allPlaced = selectedOrder.length === totalSlots;

  const handleTap = (optionId: number) => {
    if (answered) return;
    playTap();
    setSelectedOrder((prev) => [...prev, optionId]);
  };

  const handleRemove = (idx: number) => {
    if (answered) return;
    setSelectedOrder((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    if (!allPlaced || answered) return;
    setAnswered(true);
    const isCorrect = selectedOrder.every((id, i) => id === correctOrder[i]);
    onAnswer(isCorrect, -1);
  };

  const getOptionById = (id: number) => question.options.find((o) => o.id === id);

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-relaxed">{question.prompt}</p>

      {/* Numbered slots */}
      <div className="space-y-2">
        {Array.from({ length: totalSlots }).map((_, idx) => {
          const placedId = selectedOrder[idx];
          const opt = placedId !== undefined ? getOptionById(placedId) : null;
          const isCorrectSlot = answered && placedId === correctOrder[idx];
          const isWrongSlot = answered && placedId !== undefined && placedId !== correctOrder[idx];

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-[16px] border-2 transition-all min-h-[52px] ${
                isCorrectSlot
                  ? "border-success bg-success/10"
                  : isWrongSlot
                  ? "border-accent bg-accent/10"
                  : opt
                  ? "border-[#FF6B35] bg-[#FFF3EC]"
                  : "border-dashed border-[#F0E8E0] bg-white"
              }`}
            >
              {/* Number badge */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${
                isCorrectSlot
                  ? "bg-success text-white"
                  : isWrongSlot
                  ? "bg-accent text-white"
                  : opt
                  ? "bg-[#FF6B35] text-white"
                  : "bg-[#F0E8E0] text-[#C4B5A5]"
              }`}>
                {isCorrectSlot ? "✓" : isWrongSlot ? "✗" : idx + 1}
              </div>

              {opt ? (
                <div className="flex-1 flex items-center justify-between">
                  <span className={`font-bold text-sm ${
                    isCorrectSlot ? "text-success" : isWrongSlot ? "text-accent" : "text-[#2D2D2D]"
                  }`}>{opt.option_text}</span>
                  {!answered && (
                    <button onClick={() => handleRemove(idx)} className="text-[#C4B5A5] text-xs ml-2">✕</button>
                  )}
                </div>
              ) : (
                <span className="text-sm text-[#C4B5A5]">點擊下方選項</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Remaining choices */}
      {!answered && remaining.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {remaining.map((option) => (
            <button
              key={option.id}
              onClick={() => handleTap(option.id)}
              className="px-4 py-2.5 rounded-[14px] border-2 border-[#F0E8E0] bg-white shadow-[0_3px_0_0_#F0E8E0] active:translate-y-0.5 active:shadow-none transition-all font-bold text-sm"
            >
              {option.option_text}
            </button>
          ))}
        </div>
      )}

      <ConfirmButton show={allPlaced && !answered} onClick={handleConfirm} />

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
// Slot-based UI: left term is fixed, right side is a slot to fill.

function MatchQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (correct: boolean, optionId: number) => void;
}) {
  const pairs = question.options.map((o) => {
    const [left, right] = o.option_text.split("|").map((s) => s.trim());
    return { id: o.id, left, right };
  });

  const [shuffledRight] = useState(() =>
    [...pairs].sort(() => Math.random() - 0.5).map((p) => ({ id: p.id, text: p.right }))
  );

  // assignments[pairId] = rightId
  const [assignments, setAssignments] = useState<Map<number, number>>(new Map());
  const [activePairId, setActivePairId] = useState<number | null>(pairs[0]?.id || null);
  const [answered, setAnswered] = useState(false);

  const assignedRightIds = new Set(Array.from(assignments.values()));
  const allAssigned = assignments.size === pairs.length;
  const remainingRight = shuffledRight.filter((r) => !assignedRightIds.has(r.id));

  const handleSlotTap = (pairId: number) => {
    if (answered) return;
    playTap();
    // If already assigned, remove it
    if (assignments.has(pairId)) {
      setAssignments((prev) => {
        const next = new Map(prev);
        next.delete(pairId);
        return next;
      });
      setActivePairId(null);
      return;
    }
    setActivePairId(pairId);
  };

  const handleRightTap = (rightItem: { id: number; text: string }) => {
    if (answered || activePairId === null) return;
    if (assignedRightIds.has(rightItem.id)) return;
    playTap();

    const newAssignments = new Map(assignments);
    newAssignments.set(activePairId, rightItem.id);
    setAssignments(newAssignments);

    // Auto-select next unassigned pair
    const nextPair = pairs.find((p) => !newAssignments.has(p.id));
    setActivePairId(nextPair?.id || null);
  };

  const handleConfirm = () => {
    if (!allAssigned || answered) return;
    setAnswered(true);
    const allCorrect = pairs.every((p) => assignments.get(p.id) === p.id);
    onAnswer(allCorrect, -1);
  };

  const getRightTextById = (id: number) => shuffledRight.find((r) => r.id === id)?.text || "";
  const allCorrect = answered && pairs.every((p) => assignments.get(p.id) === p.id);

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-relaxed">{question.prompt}</p>

      {/* Match slots */}
      <div className="space-y-2">
        {pairs.map((pair) => {
          const assignedId = assignments.get(pair.id);
          const hasAssignment = assignedId !== undefined;
          const isActive = activePairId === pair.id;
          const isCorrectMatch = answered && assignedId === pair.id;
          const isWrongMatch = answered && hasAssignment && assignedId !== pair.id;

          return (
            <div
              key={pair.id}
              onClick={() => handleSlotTap(pair.id)}
              className={`flex items-center gap-3 p-3 rounded-[16px] border-2 transition-all cursor-pointer ${
                isCorrectMatch
                  ? "border-success bg-success/10"
                  : isWrongMatch
                  ? "border-accent bg-accent/10"
                  : isActive
                  ? "border-[#FF6B35] bg-[#FFF3EC] ring-2 ring-[#FF6B35]/30"
                  : hasAssignment
                  ? "border-[#FF6B35] bg-[#FFF3EC]"
                  : "border-[#F0E8E0] bg-white"
              }`}
            >
              {/* Left term (fixed) */}
              <div className={`flex-1 font-bold text-sm ${
                isCorrectMatch ? "text-success" : isWrongMatch ? "text-accent" : "text-[#2D2D2D]"
              }`}>
                {pair.left}
              </div>

              {/* Arrow */}
              <span className="text-[#C4B5A5] text-xs">→</span>

              {/* Right slot */}
              <div className={`flex-1 text-right ${hasAssignment ? "" : "min-h-[24px]"}`}>
                {hasAssignment ? (
                  <div className="flex items-center justify-end gap-1">
                    <span className={`font-bold text-sm ${
                      isCorrectMatch ? "text-success"
                        : isWrongMatch ? "text-accent"
                        : "text-[#FF6B35]"
                    }`}>
                      {getRightTextById(assignedId)}
                    </span>
                    {!answered && (
                      <span className="text-[#C4B5A5] text-xs">✕</span>
                    )}
                    {isCorrectMatch && <span className="text-success text-xs">✓</span>}
                    {isWrongMatch && <span className="text-accent text-xs">✗</span>}
                  </div>
                ) : (
                  <span className={`text-sm ${isActive ? "text-[#FF6B35] font-bold" : "text-[#C4B5A5]"}`}>
                    {isActive ? "選擇 ↓" : "點擊配對"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Available right options */}
      {!answered && remainingRight.length > 0 && activePairId !== null && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#A0907E] mb-2">選擇配對：</p>
          <div className="flex flex-wrap gap-2">
            {remainingRight.map((item) => (
              <button
                key={item.id}
                onClick={() => handleRightTap(item)}
                className="px-4 py-2.5 rounded-[14px] border-2 border-[#F0E8E0] bg-white shadow-[0_3px_0_0_#F0E8E0] active:translate-y-0.5 active:shadow-none transition-all font-bold text-sm"
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {!answered && activePairId === null && !allAssigned && assignments.size > 0 && (
        <p className="text-xs text-center text-[#A0907E] font-medium">
          點擊左邊選項繼續配對
        </p>
      )}

      {/* Show correct answers if wrong */}
      {answered && !allCorrect && (
        <div className="bg-[#FF6B35]/5 rounded-2xl p-4 border-2 border-[#FF6B35]/10">
          <p className="text-xs font-bold text-[#FF6B35] mb-2">正確配對：</p>
          <div className="space-y-1">
            {pairs.map((p) => (
              <p key={p.id} className="text-sm text-[#2D2D2D]">
                <span className="font-bold">{p.left}</span>
                <span className="text-[#C4B5A5] mx-2">→</span>
                <span className="font-bold text-success">{p.right}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <ConfirmButton show={allAssigned && !answered} onClick={handleConfirm} />
      {answered && <FeedbackBox correct={allCorrect} explanation={question.explanation} />}
    </div>
  );
}

// ─── Completion Screen ───

function CompletionScreen({ score, total, wrongIds, isReview, unitId }: { score: number; total: number; wrongIds: number[]; isReview?: boolean; unitId?: number }) {
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

      <Link href={unitId ? `/?unit=${unitId}` : "/"} className="btn-3d-primary w-full max-w-xs text-center text-lg">
        繼續
      </Link>
    </div>
  );
}

// ─── Main LessonPlayer ───

export default function LessonPlayer({ chapterId, reviewQuestionIds, preloadedQuestions, isReview }: { chapterId?: number; reviewQuestionIds?: number[]; preloadedQuestions?: Question[]; isReview?: boolean }) {
  const { user, refreshStats } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [unitId, setUnitId] = useState<number | null>(null);
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
  const [savedProgress, setSavedProgress] = useState<{
    current_index: number; score: number; original_count: number;
    question_order: string; xp_earned_ids: string;
  } | null>(null);
  const [xpEarnedIds, setXpEarnedIds] = useState<number[]>([]); // track which question IDs already earned XP

  // Save full progress to Supabase
  const saveProgress = useCallback(async (
    idx: number, sc: number, qOrder: number[], earnedIds: number[]
  ) => {
    if (!user || !chapterId || isReview) return;
    await supabase.from("quiz_progress").upsert({
      user_id: user.id,
      chapter_id: chapterId,
      current_index: idx,
      score: sc,
      original_count: originalCount,
      question_order: JSON.stringify(qOrder),
      xp_earned_ids: JSON.stringify(earnedIds),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,chapter_id" });
  }, [user, chapterId, isReview, originalCount]);

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

        // Get unit_id for navigation after completion
        if (chapterId) {
          const { data: chapterData } = await supabase
            .from("chapters")
            .select("unit_id")
            .eq("id", chapterId)
            .single();
          if (chapterData) setUnitId(chapterData.unit_id);
        }

        if (user && chapterId && !isReview) {
          // Check if chapter already completed
          const { data: chapterProgress } = await supabase
            .from("user_progress")
            .select("status")
            .eq("user_id", user.id)
            .eq("chapter_id", chapterId)
            .single();

          if (chapterProgress?.status === "complete") {
            setAlreadyCompleted(true);
          }

          // Check for saved quiz progress
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
    const qId = questions[currentIndex].id;
    const alreadyEarnedXP = xpEarnedIds.includes(qId);
    const shouldEarnXP = correct && !isRetry && !alreadyEarnedXP && !alreadyCompleted;

    if (correct) {
      const newCombo = combo + 1;
      if (!isRetry) {
        setScore((s) => s + 1);
      }
      if (shouldEarnXP) {
        setXpTrigger((t) => t + 1);
        playXP();
        setXpEarnedIds((prev) => [...prev, qId]);
      }
      setCombo(newCombo);
      setShowCombo(true);
      if (newCombo >= 3) {
        playCombo(newCombo);
      } else {
        playCorrect();
      }
    } else {
      setCombo(0);
      setShowCombo(false);
      setWrongIds((prev) => [...prev, qId]);
      setQuestions((prev) => [...prev, prev[currentIndex]]);
      playWrong();
    }
    setShowNext(true);

    if (user && questions[currentIndex]) {
      await supabase.from("user_answers").insert({
        user_id: user.id,
        question_id: qId,
        selected_option_id: optionId > 0 ? optionId : null,
        is_correct: correct,
      });

      // Only update DB stats if XP was earned
      if (shouldEarnXP) {
        await supabase.rpc("record_answer", {
          p_user_id: user.id,
          p_is_correct: true,
        });
      }
    }

    // Save full progress after each answer
    const newScore = correct && !isRetry ? score + 1 : score;
    const newEarnedIds = shouldEarnXP
      ? [...xpEarnedIds, qId]
      : [...xpEarnedIds];
    const questionOrder = questions.map((q) => q.id);
    // If wrong, append the retry
    if (!correct) questionOrder.push(qId);
    saveProgress(currentIndex + 1, newScore, questionOrder, newEarnedIds);
  }, [user, questions, currentIndex, combo, score, isRetry, saveProgress, originalCount, xpEarnedIds, alreadyCompleted]);

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
        <Link href="/" className="btn-3d-primary mt-6 text-center">返回</Link>
      </div>
    );
  }

  // Resume prompt
  if (showResume && savedProgress) {
    const savedIdx = savedProgress.current_index;
    const savedQOrder: number[] = JSON.parse(savedProgress.question_order || "[]");
    const savedEarnedIds: number[] = JSON.parse(savedProgress.xp_earned_ids || "[]");
    const savedOrigCount = savedProgress.original_count || originalCount;
    const canResume = savedIdx < savedQOrder.length && savedQOrder.length > 0;

    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6 text-center">
        <Mascot size={100} mood="waving" />
        <h2 className="text-xl font-extrabold text-[#2D2D2D] mt-4 mb-2">歡迎返嚟！</h2>
        <p className="text-[#A0907E] mb-1">
          {canResume
            ? `你上次做到第 ${Math.min(savedIdx, savedOrigCount)}/${savedOrigCount} 題`
            : `你已完成所有 ${savedOrigCount} 題`
          }
        </p>
        <p className="text-[#A0907E] mb-6">得分：{savedProgress.score}/{savedOrigCount}</p>

        <button
          onClick={async () => {
            if (canResume) {
              // Rebuild the question list from saved order
              const allQuestions = questions;
              const qMap = new Map(allQuestions.map((q) => [q.id, q]));
              const rebuiltQuestions = savedQOrder
                .map((id) => qMap.get(id))
                .filter(Boolean) as Question[];

              if (rebuiltQuestions.length > 0 && savedIdx < rebuiltQuestions.length) {
                setQuestions(rebuiltQuestions);
                setCurrentIndex(savedIdx);
                setScore(savedProgress.score);
                setOriginalCount(savedOrigCount);
                setIsRetry(savedIdx >= savedOrigCount);
                setXpEarnedIds(savedEarnedIds);
                setShowResume(false);
                return;
              }
            }
            // Fallback: start fresh
            setCurrentIndex(0);
            setScore(0);
            setXpEarnedIds([]);
            setShowResume(false);
            await clearProgress();
          }}
          className="btn-3d-primary w-full max-w-xs text-lg mb-3"
        >
          {canResume ? "繼續上次進度 ▶" : "重新開始 ▶"}
        </button>
        {canResume && alreadyCompleted && (
          <button
            onClick={async () => {
              setCurrentIndex(0);
              setScore(0);
              setXpEarnedIds([]);
              setShowResume(false);
              await clearProgress();
            }}
            className="w-full max-w-xs py-3 rounded-2xl border-2 border-[#F0E8E0] text-[#A0907E] font-bold"
          >
            重新開始
          </button>
        )}
        <Link href="/" className="text-sm text-[#C4B5A5] mt-4 font-medium">
          返回課程
        </Link>
      </div>
    );
  }

  if (completed) {
    return <CompletionScreen score={score} total={originalCount} wrongIds={[]} isReview={isReview} unitId={unitId || undefined} />;
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
  const showXP = !alreadyCompleted && !isReview;
  const displayQuestionNum = Math.min(currentIndex + 1, originalCount);
  const isInRetrySection = currentIndex >= originalCount;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* XP fly animation — only on first playthrough */}
      {showXP && <XPAnimation xp={xpPerQuestion} trigger={xpTrigger} combo={combo} />}

      <div className="sticky top-0 bg-[#FFF8F0] z-40 px-4 pt-4 pb-3 border-b-2 border-[#F0E8E0]">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/" className="text-[#C4B5A5] hover:text-[#A0907E] active:scale-90 transition-all">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          <div className="flex-1">
            <ProgressBar current={currentIndex} total={questions.length} />
          </div>
          {showXP && (
            <div className="flex items-center gap-1 bg-xp/20 px-2 py-1 rounded-full">
              <span className="text-sm">⚡</span>
              <span className="text-xs font-extrabold text-xp-dark">{score * xpPerQuestion}</span>
            </div>
          )}
        </div>
        {/* Question counter */}
        <p className="text-center text-xs font-bold text-[#A0907E]">
          {isInRetrySection
            ? "🔄 重做錯題"
            : `第 ${displayQuestionNum} / ${originalCount} 題`
          }
        </p>
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
