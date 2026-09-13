import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { formatUsd, useAccountSummary, usePayoutMethods, useProfile } from "@/lib/api";
import type { PayoutMethodRow } from "@/lib/payout";

export const Route = createFileRoute("/_authenticated/card")({
  head: () => ({
    meta: [
      { title: "Card — Cash Loading Portal" },
      { name: "description", content: "View the cards saved on your account and their status." },
      { property: "og:title", content: "Card — Cash Loading Portal" },
      { property: "og:description", content: "View the cards saved on your account." },
    ],
  }),
  component: CardPage,
});

function CardPage() {
  const [frozen, setFrozen] = useState(false);
  const { data: methods = [] } = usePayoutMethods();
  const { data: profile } = useProfile();
  const { balance } = useAccountSummary();

  const cards = (methods as PayoutMethodRow[]).filter((m) => m.type === "card");
  const card = cards[0];

  return (
    <AppShell title="Card">
      {!card ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No card saved yet.{" "}
          <Link to="/withdraw" className="font-bold text-foreground underline">
            Add a card
          </Link>{" "}
          — only the last four digits are stored.
        </div>
      ) : (
        <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
          <div
            className={`rounded-2xl bg-navy p-5 text-navy-foreground shadow-tile transition-opacity ${
              frozen ? "opacity-60" : ""
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide opacity-80">Saved card</p>
            <p className="mt-8 text-lg font-bold tracking-[0.2em]">•••• •••• •••• {card.card_last4}</p>
            <div className="mt-6 flex items-end justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="text-[11px] uppercase opacity-70">Card holder</p>
                <p className="truncate font-semibold">
                  {card.holder_name || profile?.full_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase opacity-70">Expires</p>
                <p className="font-semibold">{card.card_expiry || "—"}</p>
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
                <dt className="text-muted-foreground">Account balance</dt>
                <dd className="font-semibold">{formatUsd(balance)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Cards saved</dt>
                <dd className="font-semibold">{cards.length}</dd>
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
      )}
    </AppShell>
  );
}
