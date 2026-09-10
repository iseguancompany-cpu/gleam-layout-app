import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { account, activity, formatUsd } from "@/lib/demo-data";

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

function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile value={formatUsd(account.balance)} label="Account Balance" tone="navy" />
        <StatTile value={formatUsd(account.pendingWithdrawals)} label="Pending Withdrawals" tone="ember" />
        <StatTile value={formatUsd(account.totalWithdrawals)} label="Total Withdrawals" tone="navy" />
        <StatTile value={formatUsd(account.totalDeposits)} label="Total Deposits" tone="jade" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <TrendChart />
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
              <dd className="font-semibold">{account.memberSince}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Active cards</dt>
              <dd className="font-semibold">{account.activeCards}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold">Recent activity</h2>
        <ul className="mt-3 divide-y divide-border">
          {activity.slice(0, 5).map((item) => (
            <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.id} · {item.date}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold">
                  {item.type === "deposit" ? "+" : "−"}
                  {formatUsd(item.amount)}
                </span>
                <StatusBadge status={item.status} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
