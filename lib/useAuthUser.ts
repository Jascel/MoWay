"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

// The current Supabase user, kept up to date. `user` is null when nobody is signed in
// (or Supabase isn't set up). Anonymous guests have user.is_anonymous === true.
export function useAuthUser() {
  const [state, setState] = useState<{ loading: boolean; user: User | null }>({
    loading: true,
    user: null,
  });

  useEffect(() => {
    let stopListening = () => {};
    let fallback: ReturnType<typeof setTimeout> | undefined;

    try {
      const supabase = getSupabaseClient();
      // Also fires once right away with the session saved in this browser.
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({ loading: false, user: session?.user ?? null });
      });
      stopListening = () => data.subscription.unsubscribe();
    } catch {
      fallback = setTimeout(() => setState({ loading: false, user: null }), 0);
    }

    return () => {
      stopListening();
      if (fallback) clearTimeout(fallback);
    };
  }, []);

  return state;
}
