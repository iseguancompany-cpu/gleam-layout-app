import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatUsd, payouts } from "@/lib/demo-data";

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
  return (
    <AppShell title="Recent Payouts">
      <ul className="grid gap-3">
        {payouts.map((p) => (
          <li
            key={p.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{p.method}</p>
              <p className="text-xs text-muted-foreground">
                {p.id} · {p.date}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-bold">{formatUsd(p.amount)}</span>
              <StatusBadge status={p.status} />
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
