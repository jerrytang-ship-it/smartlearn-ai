"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import { validateNickname } from "@/lib/nicknames";

export default function EditNickname({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useUser();
  const [name, setName] = useState(user?.nickname || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const result = validateNickname(name);
    if (!result.valid) {
      setError(result.reason || "暱稱無效");
      return;
    }

    setSaving(true);
    setError("");

    const { error: dbError } = await supabase
      .from("users")
      .update({ nickname: name.trim() })
      .eq("id", user?.id);

    if (dbError) {
      setError("儲存失敗，請重試");
      setSaving(false);
      return;
    }

    await refreshUser();
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-slide-up border-2 border-[#E0EAF0]">
        <h2 className="text-lg font-extrabold text-[#2D2D2D] mb-1">✏️ 修改暱稱</h2>
        <p className="text-xs text-[#C4B5A5] mb-4">此暱稱會顯示在排行榜上</p>

        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          maxLength={12}
          placeholder="輸入新暱稱..."
          className="w-full bg-[#F0F7FF] border-2 border-[#E0EAF0] rounded-xl px-4 py-3 text-[#2D2D2D] font-bold placeholder-[#C4B5A5] focus:border-primary focus:outline-none transition-colors"
        />

        <div className="flex justify-between items-center mt-2 mb-4">
          <span className="text-xs text-[#C4B5A5]">{name.trim().length}/12</span>
          {error && <span className="text-xs text-accent font-bold">{error}</span>}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-[#E0EAF0] text-[#A0907E] font-bold text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-3d-primary text-sm py-2.5"
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}
