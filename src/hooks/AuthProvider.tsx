import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext, type LxpProfile } from "@/hooks/auth-context";
import { shouldRefetchAuthProfile } from "@/hooks/auth-events";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LxpProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileForUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("lxp_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[use-auth] Erro ao buscar lxp_profiles:", error.message);
    }

    return (data as LxpProfile) ?? null;
  }, []);

  const refetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const nextProfile = await loadProfileForUser(user.id);
    setProfile(nextProfile);
  }, [user, loadProfileForUser]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const nextProfile = await loadProfileForUser(currentSession.user.id);
        setProfile(nextProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || !shouldRefetchAuthProfile(event)) {
        return;
      }

      setLoading(true);
      void (async () => {
        try {
          const nextProfile = await loadProfileForUser(nextSession.user.id);
          setProfile(nextProfile);
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileForUser]);

  const value = {
    user,
    session,
    profile,
    loading,
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
