import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { formatUsd } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/payouts")({
  head: () => ({
    meta: [
      { title: "Recent Payouts — Cash Loading Portal" },
      {
        name: "description",
        content:
          "Recently completed payouts across the platform, updated every few minutes.",
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

type DemoPayout = {
  id: string;
  method_summary: string;
  amount: number;
  created_at: string;
};

const cashAppTags = [
  "$CashKing***",
  "$MoneyFlow***",
  "$QuickPay***",
  "$RichLife***",
  "$FastFunds***",
  "$PayMaster***",
  "$LuckyCash***",
  "$DailyProfit***",
  "$CashZone***",
  "$PayoutPro***",
];

function createDemoPayout(): DemoPayout {
  const amount = Math.floor(Math.random() * 90000) + 10000;

  return {
    id: crypto.randomUUID(),
    method_summary:
      cashAppTags[Math.floor(Math.random() * cashAppTags.length)],
    amount,
    created_at: new Date().toISOString(),
  };
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Payouts() {
  const [payouts, setPayouts] = useState<DemoPayout[]>([]);

  useEffect(() => {
    const initialPayouts = Array.from({ length: 8 }, (_, index) => ({
      ...createDemoPayout(),
      id: `demo-payout-${index}`,
      created_at: new Date(Date.now() - index * 60000).toISOString(),
    }));

    setPayouts(initialPayouts);

    const interval = setInterval(() => {
      setPayouts((currentPayouts) => [
        createDemoPayout(),
        ...currentPayouts,
      ].slice(0, 20));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell title="Recent Payouts">
      {payouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Loading recent payouts…
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
                    {p.method_summary}
                  </td>

                  <td className="px-4 py-3 font-bold">
                    {formatUsd(Number(p.amount))}
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(p.created_at)}
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Paid
                    </span>
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
