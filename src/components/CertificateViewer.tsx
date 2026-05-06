"use client";

import { useRef, useEffect, useState } from "react";

interface CertificateViewerProps {
  type: "stage_1" | "stage_2" | "stage_3" | "all_complete";
  studentName: string;
  date: string;
  chaptersCompleted: number;
  xpEarned: number;
  onClose: () => void;
}

const templateMap: Record<string, string> = {
  stage_1: "/certificates/cert_stage1.png",
  stage_2: "/certificates/cert_stage2.png",
  stage_3: "/certificates/cert_stage3.png",
  all_complete: "/certificates/cert_graduate.png",
};

const titleMap: Record<string, string> = {
  stage_1: "🌱 基礎篇完成證書",
  stage_2: "🔥 進階篇完成證書",
  stage_3: "🚀 大師篇完成證書",
  all_complete: "🏆 全課程畢業證書",
};

export default function CertificateViewer({
  type,
  studentName,
  date,
  xpEarned,
  onClose,
}: CertificateViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Positions derived from certificate-positions.json (center of each box)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Name
      ctx.fillStyle = "#2D5A8E";
      ctx.font = "bold 64px sans-serif";
      ctx.fillText(studentName, canvas.width * 0.50005, canvas.height * 0.5000);

      // Date (left-aligned, positioned at left edge of box)
      ctx.fillStyle = "#6B9BC4";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(date, canvas.width * 0.4793, canvas.height * 0.6735);
      ctx.textAlign = "center";

      // XP
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(`${xpEarned} XP`, canvas.width * 0.6114, canvas.height * 0.8930);

      // Use the canvas as the preview image
      setPreviewUrl(canvas.toDataURL("image/png"));
    };

    img.src = templateMap[type] || templateMap.stage_1;
  }, [type, studentName, date, xpEarned]);

  const handleDownload = () => {
    if (!previewUrl) return;
    // On mobile, open image in new tab so user can long-press to save
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const w = window.open();
      if (w) {
        w.document.write(`<img src="${previewUrl}" style="width:100%;max-width:600px;" />`);
        w.document.title = "長按圖片保存證書";
      }
    } else {
      const link = document.createElement("a");
      link.download = `智學AI_${titleMap[type]}_${studentName}.png`;
      link.href = previewUrl;
      link.click();
    }
  };

  const handleShare = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      if (navigator.share) {
        try {
          const file = new File([blob], `智學AI_證書.png`, { type: "image/png" });
          await navigator.share({
            title: `${titleMap[type]}`,
            text: `我完成咗智學AI嘅${titleMap[type]}！🎉`,
            files: [file],
          });
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") {
            handleDownload();
          }
        }
      } else {
        handleDownload();
      }
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-bounce-in">
        <div className="bg-white rounded-[24px] overflow-hidden" style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#64B5F6] to-[#90CAF9] px-5 py-3 flex items-center justify-between">
            <h2 className="text-white font-extrabold text-base">{titleMap[type]}</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">
              ✕
            </button>
          </div>

          {/* Certificate preview — rendered from canvas */}
          <div className="p-4 bg-[#F0F7FF]">
            <div className="rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Certificate" className="w-full" />
              ) : (
                <div className="w-full aspect-[1490/1056] bg-[#E8F0FE] flex items-center justify-center">
                  <p className="text-[#A0907E] text-sm font-bold">生成中...</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 rounded-[14px] font-extrabold text-sm text-[#2196F3] border-2 border-[#2196F3] transition-all active:scale-95"
            >
              📥 保存證書
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-[14px] font-extrabold text-sm text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #06D6A0, #04B386)", boxShadow: "0 3px 0 0 #039B70" }}
            >
              📤 分享
            </button>
          </div>
        </div>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
