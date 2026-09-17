import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatUsd, useWithdrawals } from "@/lib/api";


export const Route = createFileRoute("/_authenticated/payouts")({
  head: () => ({
    meta: [
      { title: "Recent Payouts — Cash Loading Portal" },
      {
        name: "description",
        content: "Recently completed payouts across the platform, updated every few minutes.",
      },
      { property: "og:title", content: "Recent Payouts — Cash Loading Portal" },
      {
        property: "og:description",
        content: "Recently completed payouts, updated every few minutes.",
      },
    ],
  }),
  component: Payouts,
});

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Payouts() {
  // useRecentPayouts should query the public_recent_payouts view (cashtag,
  // amount, status, created_at only — no names/phone/email/address) and
  // poll every 5 minutes via refetchInterval.
 const { data: payouts = [], isLoading } = useWithdrawals();


  return (
    <AppShell title="Recent Payouts">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading recent payouts…</p>
      ) : payouts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No completed payouts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-bold">Cashapp Tag</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Time</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold">
                    {p.method_summary ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-bold">{formatUsd(Number(p.amount))}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(p.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
