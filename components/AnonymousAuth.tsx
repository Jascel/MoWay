"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AnonymousAuth() {
  useEffect(() => {
    async function ensureUser() {
      console.log("1. AnonymousAuth is running");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log("2. Existing session:", session);

      if (sessionError) {
        console.error("Session error:", sessionError);
        return;
      }

      if (session) {
        console.log("3. User is already signed in");
        return;
      }

      console.log("3. No user found. Creating anonymous user...");

      const { data, error } =
        await supabase.auth.signInAnonymously();

      if (error) {
        console.error("4. Anonymous sign-in failed:", error);
        return;
      }

      console.log("4. Anonymous sign-in worked:", data.user);
    }

    ensureUser();
  }, []);

  return null;
}