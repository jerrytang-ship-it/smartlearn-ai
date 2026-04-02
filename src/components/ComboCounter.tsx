"use client";

import { useEffect, useState } from "react";

interface ComboCounterProps {
  combo: number;
  show: boolean;
}

const comboMessages = [
  "", // 0
  "", // 1
  "不錯！", // 2
  "厲害！", // 3
  "太強了！", // 4
  "無敵！🔥", // 5+
];

export default function ComboCounter({ combo, show }: ComboCounterProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (combo >= 2 && show) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(t);
    }
  }, [combo, show]);

  if (!show || combo < 2) return null;

  const message = comboMessages[Math.min(combo, 5)];
  const fireCount = Math.min(combo - 1, 4); // 1-4 fire emojis

  return (
    <div className={`flex items-center justify-center gap-2 py-2 ${animate ? "animate-combo-grow" : ""}`}>
      {/* Fire emojis */}
      <div className="flex">
        {Array.from({ length: fireCount }).map((_, i) => (
          <span
            key={i}
            className="text-xl animate-flame"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            🔥
          </span>
        ))}
      </div>

      {/* Combo badge */}
      <div className={`
        px-4 py-1.5 rounded-full font-extrabold text-sm
        ${combo >= 5
          ? "bg-gradient-to-r from-accent to-streak text-white shadow-[0_3px_0_0_#D01070]"
          : combo >= 3
          ? "bg-streak/20 text-streak border-2 border-streak/30"
          : "bg-xp/20 text-xp-dark border-2 border-xp/30"
        }
        ${animate && combo >= 5 ? "animate-combo-shake" : ""}
      `}>
        {combo}x 連續答對！{message}
      </div>

      {/* Sparkles for 5+ combo */}
      {combo >= 5 && animate && (
        <span className="text-lg animate-sparkle">✨</span>
      )}
    </div>
  );
}
