"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import CertificateViewer from "./CertificateViewer";

interface Certificate {
  certificate_type: "stage_1" | "stage_2" | "stage_3" | "all_complete";
  chapters_completed: number;
  xp_earned: number;
  earned_at: string;
}

const certInfo: Record<string, { emoji: string; label: string; color: string }> = {
  stage_1: { emoji: "🌱", label: "基礎篇", color: "#64B5F6" },
  stage_2: { emoji: "🔥", label: "進階篇", color: "#2C1B9E" },
  stage_3: { emoji: "🚀", label: "大師篇", color: "#CE82FF" },
  all_complete: { emoji: "🏆", label: "全課程畢業", color: "#FFD700" },
};

export default function CertificateSection() {
  const { user, stats } = useUser();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [viewing, setViewing] = useState<Certificate | null>(null);

  useEffect(() => {
    async function fetchCerts() {
      if (!user) return;
      const { data } = await supabase
        .from("user_certificates")
        .select("certificate_type, chapters_completed, xp_earned, earned_at")
        .eq("user_id", user.id)
        .order("earned_at");

      if (data) setCertificates(data as Certificate[]);
    }
    fetchCerts();
  }, [user]);

  if (certificates.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-2xl p-5 border-2 border-[#E0EAF0] shadow-[0_3px_0_0_#E0EAF0] mt-6">
        <h3 className="font-extrabold text-base mb-4 text-[#2D2D2D]">🎓 我嘅證書</h3>
        <div className="grid grid-cols-2 gap-3">
          {certificates.map((cert) => {
            const info = certInfo[cert.certificate_type];
            return (
              <button
                key={cert.certificate_type}
                onClick={() => setViewing(cert)}
                className="rounded-2xl overflow-hidden transition-all active:scale-95"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              >
                <div
                  className="p-3 text-center text-white"
                  style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}CC)` }}
                >
                  <span className="text-2xl block">{info.emoji}</span>
                  <p className="font-extrabold text-sm mt-1">{info.label}</p>
                </div>
                <div className="bg-white p-2 text-center">
                  <p className="text-[10px] text-[#A0907E] font-bold">
                    {new Date(cert.earned_at).toLocaleDateString("zh-HK")}
                  </p>
                  <p className="text-[10px] text-[#2196F3] font-bold">點擊查看 →</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {viewing && user && stats && (
        <CertificateViewer
          type={viewing.certificate_type}
          studentName={user.displayName}
          date={new Date(viewing.earned_at).toLocaleDateString("zh-HK", { year: "numeric", month: "long", day: "numeric" })}
          chaptersCompleted={viewing.chapters_completed}
          xpEarned={viewing.xp_earned}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
