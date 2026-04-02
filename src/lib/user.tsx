"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import { generateNickname } from "./nicknames";

const LOCAL_STORAGE_KEY = "zhixue_user_id";

interface UserStats {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  chaptersCompleted: number;
  totalCorrect: number;
  totalAnswered: number;
  lastActivityDate: string | null;
}

interface UserData {
  id: string;
  displayName: string;
  nickname: string;
  isAnonymous: boolean;
  email: string | null;
  avatarUrl: string | null;
}

interface UserContextType {
  user: UserData | null;
  stats: UserStats | null;
  loading: boolean;
  refreshStats: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  stats: null,
  loading: true,
  refreshStats: async () => {},
  refreshUser: async () => {},
  loginWithGoogle: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setStats({
        xp: data.xp,
        level: data.level,
        streak: data.streak,
        longestStreak: data.longest_streak,
        chaptersCompleted: data.chapters_completed,
        totalCorrect: data.total_correct,
        totalAnswered: data.total_answered,
        lastActivityDate: data.last_activity_date,
      });
    }
  }, []);

  const fetchUser = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setUser({
        id: data.id,
        displayName: data.display_name,
        nickname: data.nickname || data.display_name || "同學仔",
        isAnonymous: data.is_anonymous,
        email: data.email,
        avatarUrl: data.avatar_url,
      });
      return data;
    }
    return null;
  }, []);

  const refreshStats = useCallback(async () => {
    if (user?.id) {
      await fetchStats(user.id);
    }
  }, [user?.id, fetchStats]);

  const refreshUser = useCallback(async () => {
    const userId = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (userId) {
      await fetchUser(userId);
      await fetchStats(userId);
    }
  }, [fetchUser, fetchStats]);

  const loginWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  useEffect(() => {
    async function init() {
      try {
        let userId = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (userId) {
          const existingUser = await fetchUser(userId);

          if (existingUser) {
            await fetchStats(existingUser.id);
            await supabase
              .from("users")
              .update({ last_seen_at: new Date().toISOString() })
              .eq("id", userId);
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            userId = null;
          }
        }

        if (!userId) {
          const { data, error } = await supabase.rpc("create_anonymous_user", {
            p_device_info: navigator.userAgent,
            p_nickname: generateNickname(),
          });

          if (error) {
            console.error("Failed to create anonymous user:", error);
            setLoading(false);
            return;
          }

          const newUserId = data as string;
          localStorage.setItem(LOCAL_STORAGE_KEY, newUserId);
          await fetchUser(newUserId);
          await fetchStats(newUserId);
        }
      } catch (err) {
        console.error("User init error:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [fetchUser, fetchStats]);

  return (
    <UserContext.Provider value={{ user, stats, loading, refreshStats, refreshUser, loginWithGoogle }}>
      {children}
    </UserContext.Provider>
  );
}
