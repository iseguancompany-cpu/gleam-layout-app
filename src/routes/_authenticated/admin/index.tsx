import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/AdminShell";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatUsd,
  useAdminActivity,
  useAdminUsers,
  useAdminWithdrawals,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — Cash Loading Portal" },
      {
        name: "description",
        content: "Administrator overview of accounts, balances, pending approvals and recent activity.",
      },
      { property: "og:title", content: "Admin Overview — Cash Loading Portal" },
      {
        property: "og:description",
        content: "Accounts, balances, pending approvals and recent activity at a glance.",
      },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data: users = [] } = useAdminUsers();
  const { data: withdrawals = [] } = useAdminWithdrawals();
  const { data: activity = [] } = useAdminActivity();

  const totalBalance = users.reduce((sum, u) => sum + Number(u.balance ?? 0), 0);
  const pending = withdrawals.filter((w) => w.status === "pending");
  const pendingTotal = pending.reduce((sum, w) => sum + Number(w.amount), 0);
  const paidOut = withdrawals
    .filter((w) => w.status === "approved" || w.status === "completed")
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const nameFor = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u?.full_name?.trim() || u?.email || "Unknown user";
  };

  return (
    <AdminShell title="Admin Dashboard">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile value={String(users.length)} label="Total Accounts" tone="navy" />
        <StatTile value={formatUsd(totalBalance)} label="Balances On Platform" tone="jade" />
        <StatTile value={String(pending.length)} label="Requests Awaiting Review" tone="ember" />
        <StatTile value={formatUsd(pendingTotal)} label="Pending Amount" tone="sky" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="text-base font-bold">Latest requests</h2>
          {withdrawals.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {withdrawals.slice(0, 6).map((w) => (
                <li key={w.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{nameFor(w.user_id)}</p>
                    <p className="truncate text-xs text-muted-foreground">{w.method_summary}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold">{formatUsd(Number(w.amount))}</span>
                    <StatusBadge status={w.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="text-base font-bold">Recent activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Total paid out to date: <span className="font-bold">{formatUsd(paidOut)}</span>
          </p>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.description}</p>
                    <p className="truncate text-xs text-muted-foreground">{nameFor(a.user_id)}</p>
                  </div>
                  <span className="text-sm font-bold">{formatUsd(Number(a.amount ?? 0))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
