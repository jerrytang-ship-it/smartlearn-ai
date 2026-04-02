"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user";
import Mascot from "@/components/Mascot";

const LOCAL_STORAGE_KEY = "zhixue_user_id";

export default function AuthCallback() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const [status, setStatus] = useState("正在處理登入...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase implicit flow: tokens are in the URL hash
        // supabase.auth.getSession() will pick them up automatically
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          // Try to exchange hash params
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");

          if (!accessToken) {
            console.error("No session or access token found");
            setStatus("登入失敗，請重試");
            setTimeout(() => router.push("/profile"), 2000);
            return;
          }
        }

        // Get the session (should be set now after hash parse)
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!currentSession) {
          setStatus("登入失敗，請重試");
          setTimeout(() => router.push("/profile"), 2000);
          return;
        }

        const googleUser = currentSession.user;
        const googleId = googleUser.user_metadata?.sub || googleUser.id;
        const email = googleUser.email || "";
        const displayName = googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || "";
        const avatarUrl = googleUser.user_metadata?.avatar_url || "";

        const userId = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (!userId) {
          setStatus("找不到用戶資料，請重試");
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        // Check if this Google account is already linked to a different user
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("google_id", googleId)
          .single();

        if (existingUser && existingUser.id !== userId) {
          // Switch to the existing Google user
          localStorage.setItem(LOCAL_STORAGE_KEY, existingUser.id);
          await refreshUser();
          setStatus("歡迎回來！正在載入你的進度...");
          setTimeout(() => router.push("/"), 1000);
          return;
        }

        // Attach Google account to current anonymous user
        const { error: rpcError } = await supabase.rpc("attach_google_account", {
          p_user_id: userId,
          p_google_id: googleId,
          p_email: email,
          p_display_name: displayName || null,
          p_avatar_url: avatarUrl || null,
        });

        if (rpcError) {
          console.error("Failed to attach Google account:", rpcError);
          setStatus("連結失敗，請重試");
          setTimeout(() => router.push("/profile"), 2000);
          return;
        }

        await refreshUser();
        setStatus("帳號連結成功！🎉");
        setTimeout(() => router.push("/"), 1500);
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("登入失敗，請重試");
        setTimeout(() => router.push("/profile"), 2000);
      }
    }

    handleCallback();
  }, [router, refreshUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="animate-float mb-6">
        <Mascot size={100} mood="celebrating" />
      </div>
      <p className="text-lg font-bold text-gray-700">{status}</p>
    </div>
  );
}
