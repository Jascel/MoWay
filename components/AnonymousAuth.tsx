"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AnonymousAuth() {
  useEffect(() => {
    async function ensureUser() {
      try {
        const supabase = getSupabaseClient();

        // Check whether this browser already has a session.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Already signed in.
        if (session?.user) {
          console.log(
            "Existing Supabase user:",
            session.user.id
          );
          return;
        }

        // No session yet, so create an anonymous user.
        const {
          data,
          error: signInError,
        } = await supabase.auth.signInAnonymously();

        if (signInError) {
          console.error(
            "Anonymous sign-in failed:",
            signInError
          );
          return;
        }

        console.log(
          "Anonymous Supabase user created:",
          data.user?.id
        );
      } catch (error) {
        console.error(
          "Could not initialize Supabase:",
          error
        );
      }
    }

    ensureUser();
  }, []);

  // After someone logs out there is no session left. Sign in a fresh guest so saving,
  // reporting and confirming keep working (the identity underneath the whole app).
  useEffect(() => {
    try {
      const supabase = getSupabaseClient();
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          // Wait a tick: Supabase asks callbacks not to call auth methods directly.
          setTimeout(() => {
            void supabase.auth.signInAnonymously();
          }, 0);
        }
      });
      return () => data.subscription.unsubscribe();
    } catch {
      return undefined;
    }
  }, []);

  return null;
}