import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Cash Loading" },
      {
        name: "description",
        content:
          "Sign in or create your account to manage payouts and withdrawals.",
      },
      { property: "og:title", content: "Sign in — Cash Loading" },
      {
        property: "og:description",
        content: "Sign in or create your account.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Enter a valid email address" })
  .max(255);

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72);

const phoneSchema = z
  .string()
  .trim()
  .min(7, { message: "Enter a valid phone number" })
  .max(20, { message: "Phone number is too long" })
  .regex(/^[0-9+\-\s()]+$/, {
    message: "Phone number contains invalid characters",
  });

const countrySchema = z
  .string()
  .trim()
  .min(1, { message: "Select your country" });

const stateSchema = z
  .string()
  .trim()
  .min(1, { message: "Select your state" });

const loadingCodeSchema = z
  .string()
  .trim()
  .min(3, { message: "Loading code must be at least 3 characters" })
  .max(40, { message: "Loading code is too long" });

const DEFAULT_REFERRAL = "Admin";

const COUNTRIES = [
  "South Africa",
  "United States",
  "United Kingdom",
  "Canada",
  "Other",
];

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

type Mode = "login" | "signup" | "forgot";

const field =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("+1");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [loadingCode, setLoadingCode] = useState("");
  const [referral] = useState(DEFAULT_REFERRAL);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        navigate({ to: "/dashboard", replace: true });
      }
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

    let parsedPhone: z.SafeParseReturnType<string, string> | null = null;
    let parsedCountry: z.SafeParseReturnType<string, string> | null = null;
    let parsedState: z.SafeParseReturnType<string, string> | null = null;
    let parsedLoadingCode: z.SafeParseReturnType<string, string> | null = null;

    if (mode === "signup") {
      parsedPhone = phoneSchema.safeParse(phone);

      if (!parsedPhone.success) {
        toast.error(parsedPhone.error.issues[0]!.message);
        return;
      }

      parsedCountry = countrySchema.safeParse(country);

      if (!parsedCountry.success) {
        toast.error(parsedCountry.error.issues[0]!.message);
        return;
      }

      if (country === "United States") {
        parsedState = stateSchema.safeParse(state);

        if (!parsedState.success) {
          toast.error(parsedState.error.issues[0]!.message);
          return;
        }
      }

      parsedLoadingCode = loadingCodeSchema.safeParse(loadingCode);

      if (!parsedLoadingCode.success) {
        toast.error(parsedLoadingCode.error.issues[0]!.message);
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === "forgot") {
        await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

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
            data: {
              full_name: name.trim(),
              phone: parsedPhone!.data,
              country: parsedCountry!.data,

              // Only save a state when the user selected United States.
              state:
                parsedCountry!.data === "United States"
                  ? parsedState!.data
                  : null,

              loading_code: parsedLoadingCode!.data,
              referral,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setNotice(
            "Check your email to confirm your account, then sign in.",
          );
          return;
        }

        navigate({ to: "/dashboard", replace: true });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: parsedEmail.data,
        password,
      });

      if (error) {
        throw error;
      }

      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-topbar text-topbar-foreground">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link to="/" className="text-sm font-bold sm:text-base">
            Cash Loading
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Reset password"}
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
                    mode === m
                      ? "bg-card shadow-card"
                      : "text-muted-foreground"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          {notice && (
            <p className="mt-4 rounded-xl border border-border bg-muted/50 p-3 text-sm">
              {notice}
            </p>
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

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-bold" htmlFor="phone">
                  Phone number
                </label>

                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={field}
                  value={phone}
                  maxLength={20}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  required
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-bold" htmlFor="country">
                  Country
                </label>

                <select
                  id="country"
                  className={field}
                  value={country}
                  onChange={(e) => {
                    const selectedCountry = e.target.value;

                    setCountry(selectedCountry);

                    // Clear the state if the user switches away
                    // from United States.
                    if (selectedCountry !== "United States") {
                      setState("");
                    }
                  }}
                  required
                >
                  <option value="" disabled>
                    Select your country
                  </option>

                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "signup" && country === "United States" && (
              <div className="space-y-2">
                <label className="text-sm font-bold" htmlFor="state">
                  State
                </label>

                <select
                  id="state"
                  className={field}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select your state
                  </option>

                  {US_STATES.map((usState) => (
                    <option key={usState} value={usState}>
                      {usState}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-bold" htmlFor="loadingCode">
                  Loading code
                </label>

                <input
                  id="loadingCode"
                  className={field}
                  value={loadingCode}
                  maxLength={40}
                  onChange={(e) => setLoadingCode(e.target.value)}
                  required
                />

                <p className="text-xs text-muted-foreground">
                  This code is saved permanently and can’t be changed after
                  your account is created.
                </p>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-bold" htmlFor="referral">
                  Referral
                </label>

                <input
                  id="referral"
                  className={`${field} cursor-not-allowed opacity-70`}
                  value={referral}
                  disabled
                  readOnly
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div className="space-y-2">
                <label className="text-sm font-bold" htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
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
