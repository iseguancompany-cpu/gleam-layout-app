import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { account, formatUsd } from "@/lib/demo-data";

export const Route = createFileRoute("/card")({
  head: () => ({
    meta: [
      { title: "Card — Cash Loading Portal" },
      { name: "description", content: "View your demo cards, freeze a card and check spending limits." },
      { property: "og:title", content: "Card — Cash Loading Portal" },
      { property: "og:description", content: "View your cards, freeze them and check limits." },
    ],
  }),
  component: CardPage,
});

function CardPage() {
  const [frozen, setFrozen] = useState(false);

  return (
    <AppShell title="Card">
      <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
        <div
          className={`rounded-2xl bg-navy p-5 text-navy-foreground shadow-tile transition-opacity ${
            frozen ? "opacity-60" : ""
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Virtual card</p>
          <p className="mt-8 text-lg font-bold tracking-[0.2em]">•••• •••• •••• 7734</p>
          <div className="mt-6 flex items-end justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="text-[11px] uppercase opacity-70">Card holder</p>
              <p className="truncate font-semibold">{account.name}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase opacity-70">Expires</p>
              <p className="font-semibold">09/29</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border p-5">
          <h2 className="text-base font-bold">Card controls</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-semibold">{frozen ? "Frozen" : "Active"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Available</dt>
              <dd className="font-semibold">{formatUsd(account.balance)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Monthly limit</dt>
              <dd className="font-semibold">{formatUsd(5000)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => setFrozen((v) => !v)}
            className="mt-5 w-full rounded-xl bg-secondary px-4 py-3 text-sm font-bold transition-colors hover:bg-accent"
          >
            {frozen ? "Unfreeze card" : "Freeze card"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
