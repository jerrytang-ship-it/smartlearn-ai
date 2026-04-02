"use client";

/**
 * AI-fin — The mascot for 智學AI
 * Uses individual pose images from /public/mascot/
 */

type MascotMood = "happy" | "thinking" | "celebrating" | "encouraging" | "waving" | "excited" | "proud" | "sleeping" | "surprised" | "learning";

interface MascotProps {
  size?: number;
  mood?: MascotMood;
  className?: string;
}

const moodToImage: Record<MascotMood, string> = {
  happy: "/mascot/happy.png",
  waving: "/mascot/waving.png",
  thinking: "/mascot/thinking.png",
  celebrating: "/mascot/celebrating.png",
  encouraging: "/mascot/encouraging.png",
  learning: "/mascot/learning.png",
  excited: "/mascot/excited.png",
  proud: "/mascot/proud.png",
  sleeping: "/mascot/sleeping.png",
  surprised: "/mascot/surprised.png",
};

export default function Mascot({ size = 80, mood = "happy", className = "" }: MascotProps) {
  return (
    <img
      src={moodToImage[mood]}
      alt="AI-fin mascot"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Speech bubble with mascot */
export function MascotBubble({
  message,
  mood = "happy",
  mascotSize = 48,
  className = "",
}: {
  message: string;
  mood?: MascotMood;
  mascotSize?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex-shrink-0 animate-float">
        <Mascot size={mascotSize} mood={mood} />
      </div>
      <div className="relative bg-white rounded-[18px] rounded-tl-md px-4 py-3 flex-1" style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.08), 0 3px 0 rgba(0,0,0,0.04)" }}>
        <p className="text-sm font-semibold text-[#2D2D2D] leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
