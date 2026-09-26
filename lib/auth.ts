import { getSupabaseClient } from "@/lib/supabase/client";

export type SignUpResult = "signed-in" | "confirm-email";

// Turns Supabase's error messages into short, friendly ones for the screen.
export function friendlyAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid login credentials/i.test(message)) return "Wrong email or password.";
  if (/already registered|already been registered|already exists/i.test(message))
    return "That email already has an account. Try logging in instead.";
  if (/password should be at least|weak password/i.test(message))
    return "Your password needs at least 6 characters.";
  if (/email not confirmed/i.test(message))
    return "Please confirm your email first. Check your inbox for the link.";
  if (/rate limit|too many/i.test(message)) return "Too many tries. Wait a minute and try again.";
  if (/provider is not enabled|unsupported provider/i.test(message))
    return "Google sign-in isn't turned on yet. Ask the team to enable it in Supabase.";
  if (/manual linking is disabled/i.test(message))
    return "Linking a guest to Google is turned off. Ask the team to enable manual linking in Supabase.";
  if (/valid email|invalid email|unable to validate email/i.test(message))
    return "Please enter a valid email address.";
  return message;
}

// Creates an account.
// If this browser is using the anonymous guest account, that SAME account gets the email and
// password (same user id), so the person's profile, schedule and reports stay with them.
export async function createAccount(email: string, password: string): Promise<SignUpResult> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user.is_anonymous) {
    const { data, error } = await supabase.auth.updateUser({ email, password });
    if (error) throw error;
    // With "Confirm email" turned on in Supabase, the email only counts after the link is clicked.
    return data.user.email === email && !data.user.new_email ? "signed-in" : "confirm-email";
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.session ? "signed-in" : "confirm-email";
}

// Continues with a Google account. The browser leaves for Google and comes back to the app signed in.
// If this browser is using the anonymous guest account, Google is linked to that SAME account (same
// user id), so the person's profile, schedule and reports stay with them. That needs
// "Manual linking" turned on in Supabase. Google itself must be enabled as a provider there too.
export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabaseClient();

  // If Google isn't enabled in Supabase, the browser would land on a raw error page. Check first.
  const settings = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
  }).then((response) => response.json() as Promise<{ external?: { google?: boolean } }>);
  if (!settings.external?.google) throw new Error("Unsupported provider: provider is not enabled");
  const redirectTo = `${window.location.origin}/`;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user.is_anonymous) {
    const { error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo } });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  if (error) throw error;
}

// Logs in to an existing account. This switches to that account's user id,
// so what the person did as a guest stays with the guest account.
export async function logIn(email: string, password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// Logs out. AnonymousAuth then signs in a fresh guest so the app keeps working.
export async function logOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}
