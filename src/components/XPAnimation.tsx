"use client";

import { useEffect, useState } from "react";

interface XPAnimationProps {
  xp: number;
  trigger: number; // increment this to trigger a new animation
  combo: number;
}

interface FlyingXP {
  id: number;
  xp: number;
  x: number;
  bonus: boolean;
}

export default function XPAnimation({ xp, trigger, combo }: XPAnimationProps) {
  const [particles, setParticles] = useState<FlyingXP[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    const bonusXP = combo >= 3 ? Math.floor(xp * 0.5) : 0;
    const id = Date.now();

    // Main XP particle
    const newParticles: FlyingXP[] = [
      { id, xp, x: 40 + Math.random() * 20, bonus: false },
    ];

    // Bonus XP particle for combos
    if (bonusXP > 0) {
      newParticles.push({
        id: id + 1,
        xp: bonusXP,
        x: 50 + Math.random() * 20,
        bonus: true,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    // Clean up after animation
    const t = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id && p.id !== id + 1));
    }, 2000);

    return () => clearTimeout(t);
  }, [trigger, xp, combo]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-xp-fly"
          style={{
            left: `${p.x}%`,
            top: "50%",
          }}
        >
          <div className={`
            px-3 py-1.5 rounded-full font-extrabold text-sm whitespace-nowrap shadow-lg
            ${p.bonus
              ? "bg-gradient-to-r from-streak to-accent text-white"
              : "bg-xp text-xp-dark"
            }
          `}>
            {p.bonus ? `🔥 +${p.xp} 連擊獎勵` : `⚡ +${p.xp} XP`}
          </div>
        </div>
      ))}
    </div>
  );
}
