import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Cash Loading Portal" },
      { name: "description", content: "Sign in or create your account to manage payouts and withdrawals." },
      { property: "og:title", content: "Sign in — Cash Loading Portal" },
      { property: "og:description", content: "Sign in or create your account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email({ message: "Enter a valid email address" }).max(255);
const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72);

type Mode = "login" | "signup" | "forgot";

const field =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);

    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]!.message);
      return;
    }

    if (mode !== "forgot") {
      const parsedPassword = passwordSchema.safeParse(password);
      if (!parsedPassword.success) {
        toast.error(parsedPassword.error.issues[0]!.message);
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "forgot") {
        await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        // Never reveal whether the address is registered.
        setNotice(
          "If an account exists for that address, a password reset link is on its way. The link expires shortly.",
        );
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsedEmail.data,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          return;
        }
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: parsedEmail.data,
        password,
      });
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-topbar text-topbar-foreground">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link to="/" className="text-sm font-bold sm:text-base">
            Cash Loading Portal
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
          </h1>

          {mode !== "forgot" && (
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setNotice(null);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                    mode === m ? "bg-card shadow-card" : "text-muted-foreground"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          {notice && (
            <p className="mt-4 rounded-xl border border-border bg-muted/50 p-3 text-sm">{notice}</p>
          )}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-bold" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  className={field}
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={field}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <label className="text-sm font-bold" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className={field}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-navy px-6 py-3 font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Send reset link"}
            </button>
          </form>

          <div className="mt-4 text-sm">
            {mode === "forgot" ? (
              <button
                type="button"
                className="font-semibold text-muted-foreground underline"
                onClick={() => {
                  setMode("login");
                  setNotice(null);
                }}
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                className="font-semibold text-muted-foreground underline"
                onClick={() => {
                  setMode("forgot");
                  setNotice(null);
                }}
              >
                Forgot password?
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
