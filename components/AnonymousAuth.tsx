"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AnonymousAuth() {
  useEffect(() => {
    async function ensureUser() {
      try {
        const supabase = getSupabaseClient();

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Could not check auth:", error);
          return;
        }

        // Already signed in, so nothing else is needed.
        if (user) {
          return;
        }

        const { error: signInError } =
          await supabase.auth.signInAnonymously();

        if (signInError) {
          console.error(
            "Anonymous sign-in failed:",
            signInError
          );
        }
      } catch (error) {
        console.error(
          "Could not initialize Supabase:",
          error
        );
      }
    }

    ensureUser();
  }, []);

  return null;
}