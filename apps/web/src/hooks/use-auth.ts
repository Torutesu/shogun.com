"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { api } from "@/lib/api";
import type { UserProfile } from "@shogun/shared/types";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const supabase = createSupabaseBrowser();

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem("shogun_token", session.access_token);
        const user = await api.auth.me();
        setState({ user, session, loading: false });
      } else {
        localStorage.removeItem("shogun_token");
        setState({ user: null, session: null, loading: false });
      }
    } catch {
      localStorage.removeItem("shogun_token");
      setState({ user: null, session: null, loading: false });
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          localStorage.setItem("shogun_token", session.access_token);
          try {
            const user = await api.auth.me();
            setState({ user, session, loading: false });
          } catch {
            setState({ user: null, session, loading: false });
          }
        } else {
          localStorage.removeItem("shogun_token");
          setState({ user: null, session: null, loading: false });
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [fetchUser, supabase]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [supabase],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
    [supabase],
  );

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) throw error;
  }, [supabase]);

  const logout = useCallback(async () => {
    localStorage.removeItem("shogun_token");
    await supabase.auth.signOut();
    setState({ user: null, session: null, loading: false });
  }, [supabase]);

  return {
    ...state,
    login,
    signup,
    loginWithGoogle,
    logout,
    refresh: fetchUser,
  };
}
