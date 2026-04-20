"use client";

import { useState, useEffect, useCallback } from "react";
import Mascot from "./Mascot";

const TUTORIAL_KEY = "tutorial_done";

interface TutorialStep {
  message: string;
  emoji: string;
  mood: "happy" | "waving" | "thinking" | "celebrating" | "encouraging" | "excited" | "proud" | "learning" | "surprised" | "sleeping";
  targetId: string; // data-tutorial="xxx" on the target element
  tooltipPosition: "above" | "below";
  action?: () => void; // optional action to perform (e.g. switch tab)
}

const steps: TutorialStep[] = [
  {
    message: "歡迎嚟到智學AI！我係 AI-fin 🐬，帶你認識人工智能嘅世界！",
    emoji: "👋",
    mood: "waving",
    targetId: "tutorial-mascot-welcome",
    tooltipPosition: "below",
  },
  {
    message: "呢個係你而家學緊嘅單元，撳入去就可以開始學習！",
    emoji: "📚",
    mood: "excited",
    targetId: "tutorial-hero-card",
    tooltipPosition: "below",
  },
  {
    message: "所有單元都喺下面，完成上一個就會自動解鎖下一個！",
    emoji: "📖",
    mood: "learning",
    targetId: "tutorial-first-unit",
    tooltipPosition: "above",
  },
  {
    message: "撳呢度切換到「每日挑戰」！四個類別輪流出場，每日都有新題目 ⚡",
    emoji: "🎯",
    mood: "celebrating",
    targetId: "tutorial-daily-tab",
    tooltipPosition: "below",
  },
  {
    message: "排行榜可以睇到邊個學得最叻！同朋友仔比賽吧 🏆",
    emoji: "🏆",
    mood: "proud",
    targetId: "tutorial-nav-leaderboard",
    tooltipPosition: "above",
  },
  {
    message: "個人頁面可以睇你嘅成績、成就同設定！",
    emoji: "👤",
    mood: "happy",
    targetId: "tutorial-nav-profile",
    tooltipPosition: "above",
  },
  {
    message: "經驗值同連續天數會顯示喺呢度！答啱題目就會得到 XP 🔥 準備好未？開始學習啦！",
    emoji: "🚀",
    mood: "excited",
    targetId: "tutorial-stats-pills",
    tooltipPosition: "below",
  },
];

export default function TutorialOverlay() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(TUTORIAL_KEY);
    if (!done) {
      setTimeout(() => setShow(true), 300);
    }
  }, []);

  const updateSpotlight = useCallback(() => {
    if (!show) return;
    const current = steps[step];
    const el = document.querySelector(`[data-tutorial="${current.targetId}"]`);
    if (el) {
      el.scrollIntoView({ block: "center" });
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSpotlightRect(rect);
      } else {
        setSpotlightRect(null);
      }
    } else {
      setSpotlightRect(null);
    }
  }, [step, show]);

  useEffect(() => {
    updateSpotlight();
  }, [updateSpotlight]);

  const handleNext = () => {
    if (step + 1 >= steps.length) {
      handleDismiss();
    } else {
      const nextStep = steps[step + 1];
      if (nextStep.action) nextStep.action();
      setStep(step + 1);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(TUTORIAL_KEY, "true");
  };

  if (!show) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const padding = 8;

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {};
  if (spotlightRect) {
    const viewH = window.innerHeight;
    if (current.tooltipPosition === "below") {
      const top = spotlightRect.bottom + padding + 12;
      // If tooltip would go off bottom, show above instead
      tooltipStyle = top > viewH - 200
        ? { position: "fixed", bottom: viewH - spotlightRect.top + padding + 12, left: "50%", transform: "translateX(-50%)" }
        : { position: "fixed", top, left: "50%", transform: "translateX(-50%)" };
    } else {
      const bottom = viewH - spotlightRect.top + padding + 12;
      // If tooltip would go off top, show below instead
      tooltipStyle = bottom > viewH - 200
        ? { position: "fixed", top: spotlightRect.bottom + padding + 12, left: "50%", transform: "translateX(-50%)" }
        : { position: "fixed", bottom, left: "50%", transform: "translateX(-50%)" };
    }
  } else {
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* SVG overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" onClick={handleNext}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - padding}
                y={spotlightRect.top - padding}
                width={spotlightRect.width + padding * 2}
                height={spotlightRect.height + padding * 2}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border glow */}
      {spotlightRect && (
        <div
          className="absolute rounded-2xl border-2 border-white/40 pointer-events-none animate-pulse"
          style={{
            left: spotlightRect.left - padding,
            top: spotlightRect.top - padding,
            width: spotlightRect.width + padding * 2,
            height: spotlightRect.height + padding * 2,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="w-[85vw] max-w-sm animate-slide-up"
        style={{ ...tooltipStyle, zIndex: 110 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-[20px] p-5 text-center" style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
          <div className="flex items-center gap-3 mb-3">
            <Mascot size={50} mood={current.mood} />
            <p className="text-sm font-bold text-[#2D2D2D] leading-relaxed text-left flex-1">
              {current.emoji} {current.message}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-5 bg-[#2196F3]" : i < step ? "w-1.5 bg-[#2196F3]/40" : "w-1.5 bg-[#E0EAF0]"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step === 0 ? (
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-[#A0907E] border-2 border-[#E0EAF0]"
              >
                跳過
              </button>
            ) : (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-[#A0907E] border-2 border-[#E0EAF0]"
              >
                ← 上一步
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-2 rounded-xl text-xs font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #2196F3, #64B5F6)", boxShadow: "0 3px 0 0 #1565C0" }}
            >
              {isLast ? "開始學習 🚀" : `下一步 (${step + 1}/${steps.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
