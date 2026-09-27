"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ChipGroup from "@/components/ChipGroup";
import { createAccount, friendlyAuthError, isGoogleEnabled, logIn, logOut, signInWithGoogle } from "@/lib/auth";
import { useAuthUser } from "@/lib/useAuthUser";

const modes = [
  { value: "signup", label: "Create account" },
  { value: "login", label: "Log in" },
];

const inputClass = "w-full rounded-2xl border border-ink/15 bg-cream p-3";

export default function LoginPage() {
  const router = useRouter();
  const { loading, user } = useAuthUser();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [googleOn, setGoogleOn] = useState(false);

  // Show the Google button only once Google sign-in really works.
  useEffect(() => {
    let alive = true;
    const check = () => {
      void isGoogleEnabled().then((enabled) => {
        if (alive) setGoogleOn(enabled);
      });
    };
    check();
    // The network can still be settling right after the page loads (especially on
    // phones), so a single failed check shouldn't permanently hide the button.
    const retry = window.setTimeout(check, 3000);
    return () => {
      alive = false;
      window.clearTimeout(retry);
    };
  }, []);

  // A real account (not the anonymous guest) is signed in.
  const signedInEmail = user && !user.is_anonymous ? user.email : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim() || password.length < 6) {
      setError("Enter your email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await createAccount(email.trim(), password);
        if (result === "signed-in") router.push("/");
        else setNotice("Almost there! Check your email for a confirmation link, then log in.");
      } else {
        await logIn(email.trim(), password);
        router.push("/");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await signInWithGoogle(); // leaves for Google, then comes back signed in
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  async function handleLogOut() {
    setBusy(true);
    try {
      await logOut();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Your account" subtitle="Sign up or log in with email" tone="mint" />
      <div className="-mt-6 space-y-6 px-4">
        {loading ? (
          <p className="rounded-3xl bg-white p-5 text-sm text-ink/60 shadow-sm">Checking your account...</p>
        ) : signedInEmail ? (
          <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-ink/70">You&apos;re signed in as</p>
            <p className="font-display text-xl font-bold break-all">{signedInEmail}</p>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
                Open MoWay
              </Link>
              <button
                onClick={handleLogOut}
                disabled={busy}
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {busy ? "Logging out..." : "Log out"}
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
            <ChipGroup options={modes} selected={[mode]} onToggle={(v) => setMode(v as "signup" | "login")} />

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-bold">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@usf.edu"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-bold">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={inputClass}
              />
            </div>

            <p className="text-xs text-ink/60">
              {mode === "signup"
                ? "Your current schedule, profile and reports stay with your new account."
                : "Logging in switches to that account's saved data. What you did as a guest stays with the guest."}
            </p>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            {notice && <p className="rounded-2xl bg-mint p-3 text-sm font-medium">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-ink py-3.5 font-semibold text-white active:bg-ink/80 disabled:opacity-50"
            >
              {busy ? "One moment..." : mode === "signup" ? "Create account" : "Log in"}
            </button>

            {googleOn && (
              <>
                <div className="flex items-center gap-3 text-xs text-ink/50">
                  <span className="h-px flex-1 bg-ink/10" />
                  or
                  <span className="h-px flex-1 bg-ink/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="w-full rounded-full border border-ink/20 bg-white py-3.5 font-semibold disabled:opacity-50"
                >
                  Continue with Google
                </button>
              </>
            )}
          </form>
        )}

        <p className="pb-4 text-center text-sm">
          <Link href="/" className="text-ink/60 underline">Continue as a guest</Link>
        </p>
      </div>
    </>
  );
}
