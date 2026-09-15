import { createFileRoute, Link } from "@tanstack/react-router";

import { useAuthUser } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cash Loading Portal — Balances and Payouts" },
      {
        name: "description",
        content:
          "Track your balance, save your own payout details and request withdrawals with no fees or hidden charges.",
      },
      { property: "og:title", content: "Cash Loading Portal — Balances and Payouts" },
      {
        property: "og:description",
        content: "Track your balance, save payout details and request withdrawals — no fees.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { data: user, isLoading } = useAuthUser();

  return (
    <div className="min-h-screen">
      <header className="bg-topbar text-topbar-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <span className="truncate text-sm font-bold sm:text-base">Cash Loading</span>
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="shrink-0 rounded-lg bg-card px-4 py-2 text-sm font-bold text-card-foreground"
          >
            {isLoading ? "…" : user ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          Your balance, payout details and withdrawals in one place.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Save your own Cash App, bank or card payout details, request a withdrawal and follow its
          status. No withdrawal fees, no service charges, nothing to pay upfront.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90"
          >
            {user ? "Open dashboard" : "Create your account"}
          </Link>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Clear balance view", d: "Deposits, pending and completed payouts, always up to date." },
            { t: "Your payout details", d: "Cash App, bank transfer or card — saved securely to your account." },
            { t: "Tracked requests", d: "Every withdrawal shows as pending, approved, completed or rejected." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="text-base font-bold">{c.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
