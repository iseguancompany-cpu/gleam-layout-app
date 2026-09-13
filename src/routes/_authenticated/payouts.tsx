import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatUsd, useWithdrawals } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/payouts")({
  head: () => ({
    meta: [
      { title: "Recent Payouts — Cash Loading Portal" },
      { name: "description", content: "A list of your most recent payouts with method, date and status." },
      { property: "og:title", content: "Recent Payouts — Cash Loading Portal" },
      { property: "og:description", content: "Your most recent payouts with method, date and status." },
    ],
  }),
  component: Payouts,
});

function Payouts() {
  const { data: withdrawals = [], isLoading } = useWithdrawals();

  return (
    <AppShell title="Recent Payouts">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your payouts…</p>
      ) : withdrawals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          You have not requested a payout yet.
        </p>
      ) : (
        <ul className="grid gap-3">
          {withdrawals.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{p.method_summary}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                  {p.admin_note ? ` · ${p.admin_note}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold">{formatUsd(Number(p.amount))}</span>
                <StatusBadge status={p.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
