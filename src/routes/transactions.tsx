import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { activity, formatUsd } from "@/lib/demo-data";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transaction History — Cash Loading Portal" },
      { name: "description", content: "Filter and review deposits, withdrawals and transfers on your account." },
      { property: "og:title", content: "Transaction History — Cash Loading Portal" },
      { property: "og:description", content: "Deposits, withdrawals and transfers on your account." },
    ],
  }),
  component: Transactions,
});

const filters = ["all", "deposit", "withdrawal", "transfer"] as const;

function Transactions() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const rows = activity.filter((a) => filter === "all" || a.type === filter);

  return (
    <AppShell title="Transaction History">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase transition-colors ${
              filter === f ? "bg-navy text-navy-foreground" : "bg-secondary hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="py-2 pr-3 font-bold">Reference</th>
              <th className="py-2 pr-3 font-bold">Detail</th>
              <th className="py-2 pr-3 font-bold">Date</th>
              <th className="py-2 pr-3 font-bold">Amount</th>
              <th className="py-2 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-3 font-semibold">{r.id}</td>
                <td className="py-3 pr-3">{r.label}</td>
                <td className="py-3 pr-3 text-muted-foreground">{r.date}</td>
                <td className="py-3 pr-3 font-bold">
                  {r.type === "deposit" ? "+" : "−"}
                  {formatUsd(r.amount)}
                </td>
                <td className="py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No transactions to show.</p>
        )}
      </div>
    </AppShell>
  );
}
