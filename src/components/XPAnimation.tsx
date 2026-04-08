"use client";

import { useEffect, useState } from "react";

interface XPAnimationProps {
  xp: number;
  trigger: number;
}

interface FlyingXP {
  id: number;
  xp: number;
  x: number;
  bonus: boolean;
}

export default function XPAnimation({ xp, trigger }: XPAnimationProps) {
  const [particles, setParticles] = useState<FlyingXP[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    const id = Date.now();

    const newParticles: FlyingXP[] = [
      { id, xp, x: 40 + Math.random() * 20, bonus: false },
    ];

    setParticles((prev) => [...prev, ...newParticles]);

    const t = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 2000);

    return () => clearTimeout(t);
  // ONLY trigger on `trigger` changes — not combo or xp
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

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
