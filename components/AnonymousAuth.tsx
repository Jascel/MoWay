"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AnonymousAuth() {
  useEffect(() => {
    async function ensureUser() {
      try {
        const supabase = getSupabaseClient();

        // getSession() reads the saved session from this browser. (getUser() returns the error
        // "Auth session missing!" for a brand-new visitor, which used to stop the sign-in below.)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Could not check auth:", error);
          return;
        }

        // Already signed in, so nothing else is needed.
        if (session) {
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