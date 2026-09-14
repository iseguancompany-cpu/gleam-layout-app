import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart, type TrendPoint } from "@/components/TrendChart";
import { formatUsd, useAccountSummary, useActivity, useProfile } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Cash Loading Portal" },
      {
        name: "description",
        content:
          "Account dashboard with balance summary, payout activity and transaction history in a clean responsive layout.",
      },
      { property: "og:title", content: "Dashboard — Cash Loading Portal" },
      {
        property: "og:description",
        content: "Balance summary, payout activity and transaction history at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

const monthLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });

function buildTrend(rows: { created_at: string; amount: number | null; kind: string }[]): TrendPoint[] {
  const months: TrendPoint[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: monthLabel(d), value: 0 });
  }
  for (const row of rows) {
    const d = new Date(row.created_at);
    const idx = months.findIndex(
      (_, i) =>
        new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).getMonth() === d.getMonth() &&
        new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).getFullYear() === d.getFullYear(),
    );
    const bucket = idx >= 0 ? months[idx] : undefined;
    if (bucket) bucket.value += Math.abs(Number(row.amount ?? 0));
  }
  return months;
}

function Dashboard() {
  const { balance, pending, paidOut } = useAccountSummary();
  const { data: activity = [] } = useActivity();
  const { data: profile } = useProfile();

  const deposits = activity
    .filter((a) => a.kind === "deposit")
    .reduce((sum, a) => sum + Number(a.amount ?? 0), 0);

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile value={formatUsd(balance)} label="Account Balance" tone="navy" />
        <StatTile value={formatUsd(pending)} label="Pending Withdrawals" tone="ember" />
        <StatTile value={formatUsd(paidOut)} label="Total Withdrawals" tone="navy" />
        <StatTile value={formatUsd(deposits)} label="Total Deposits" tone="jade" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <TrendChart data={buildTrend(activity)} />
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="text-base font-bold">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            <Link
              to="/withdraw"
              className="rounded-xl bg-navy px-4 py-3 text-center text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90"
            >
              Start a withdrawal
            </Link>
            <Link
              to="/payment-address"
              className="rounded-xl bg-secondary px-4 py-3 text-center text-sm font-bold transition-colors hover:bg-accent"
            >
              Payment address
            </Link>
            <Link
              to="/transactions"
              className="rounded-xl bg-secondary px-4 py-3 text-center text-sm font-bold transition-colors hover:bg-accent"
            >
              View transactions
            </Link>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-semibold">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Country</dt>
              <dd className="font-semibold">{profile?.country ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity yet. Requests and deposits will appear here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {activity.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold">
                    {item.kind === "deposit" ? "+" : "−"}
                    {formatUsd(Number(item.amount ?? 0))}
                  </span>
                  <StatusBadge status={item.kind === "deposit" ? "completed" : "pending"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
