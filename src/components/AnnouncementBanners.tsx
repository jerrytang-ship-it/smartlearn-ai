"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Announcement {
  id: number;
  message: string;
  emoji: string;
  start_date: string;
  end_date: string;
  link_text: string | null;
  link_url: string | null;
  target_page: string;
  style: "info" | "success" | "warning" | "promo";
  sort_order: number;
}

const styleMap = {
  info: { bg: "bg-[#DCEEFB]", border: "border-[#2196F3]", text: "text-[#1565C0]" },
  success: { bg: "bg-green-50", border: "border-green-400", text: "text-green-700" },
  warning: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700" },
  promo: { bg: "bg-gradient-to-r from-[#2196F3]/10 to-[#64B5F6]/10", border: "border-[#2196F3]", text: "text-[#2196F3]" },
};

export default function AnnouncementBanners({ page }: { page: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchAnnouncements() {
      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("announcements")
        .select("*")
        .lte("start_date", today)
        .gte("end_date", today)
        .order("sort_order");

      if (data) {
        // Filter by target page
        const filtered = data.filter(
          (a) => a.target_page === "all" || a.target_page === page
        );
        setAnnouncements(filtered);
      }
    }

    // Load dismissed IDs from localStorage
    const stored = localStorage.getItem("dismissed_announcements");
    if (stored) {
      try {
        setDismissed(new Set(JSON.parse(stored)));
      } catch {
        // ignore
      }
    }

    fetchAnnouncements();
  }, [page]);

  const dismiss = (id: number) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    localStorage.setItem("dismissed_announcements", JSON.stringify(Array.from(newDismissed)));
  };

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((a) => {
        const s = styleMap[a.style] || styleMap.info;
        return (
          <div key={a.id} className={`relative ${s.bg} border-l-4 ${s.border} rounded-xl p-3 pr-8 animate-slide-up`}>
            <button
              onClick={() => dismiss(a.id)}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[#A0907E] text-xs"
            >
              ✕
            </button>
            <div className="flex items-start gap-2">
              <span className="text-base">{a.emoji}</span>
              <div className="flex-1">
                <p className={`text-sm font-bold ${s.text} leading-relaxed`}>{a.message}</p>
                {a.link_text && a.link_url && (
                  <Link href={a.link_url} className={`text-xs font-extrabold ${s.text} mt-1 inline-block`}>
                    {a.link_text} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
