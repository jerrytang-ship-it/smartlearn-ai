"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import Mascot from "@/components/Mascot";

const LOCAL_STORAGE_KEY = "zhixue_user_id";

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useUser();
  const [status, setStatus] = useState("正在連結你的帳號...");

  useEffect(() => {
    async function handleAuth() {
      const userId = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existingUserId = searchParams.get("user_id");
      const googleId = searchParams.get("google_id");
      const email = searchParams.get("email");
      const displayName = searchParams.get("display_name");
      const avatarUrl = searchParams.get("avatar_url");

      if (existingUserId) {
        // Returning Google user — switch to their account
        localStorage.setItem(LOCAL_STORAGE_KEY, existingUserId);
        await refreshUser();
        setStatus("歡迎回來！正在載入你的進度...");
        setTimeout(() => router.push("/"), 1000);
        return;
      }

      if (googleId && userId) {
        // Attach Google account to existing anonymous user
        const { error } = await supabase.rpc("attach_google_account", {
          p_user_id: userId,
          p_google_id: googleId,
          p_email: email || "",
          p_display_name: displayName || null,
          p_avatar_url: avatarUrl || null,
        });

        if (error) {
          console.error("Failed to attach Google account:", error);
          setStatus("連結失敗，請重試");
          setTimeout(() => router.push("/profile"), 2000);
          return;
        }

        // Re-fetch user data so the whole app updates
        await refreshUser();
        setStatus("帳號連結成功！🎉");
        setTimeout(() => router.push("/"), 1000);
        return;
      }

      router.push("/");
    }

    handleAuth();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="animate-float mb-6">
        <Mascot size={100} mood="celebrating" />
      </div>
      <p className="text-lg font-bold text-gray-700">{status}</p>
    </div>
  );
}

export default function AuthSuccess() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Mascot size={80} mood="thinking" />
        <p className="text-lg font-bold text-gray-500 mt-4">載入中...</p>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
