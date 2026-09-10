import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { account, formatUsd } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Cash Loading Portal" },
      { name: "description", content: "Choose a payout method and place a withdrawal request from your balance." },
      { property: "og:title", content: "Withdraw — Cash Loading Portal" },
      { property: "og:description", content: "Choose a payout method and place a withdrawal request." },
    ],
  }),
  component: Withdraw,
});

const methods = ["Cash App", "Bank Transfer", "Card"] as const;

function Withdraw() {
  const [method, setMethod] = useState<(typeof methods)[number] | null>(null);
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <AppShell title="Withdrawal">
        <div className="max-w-lg">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-sky text-sky-foreground">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold">Withdrawal Placed Successfully</h2>
          <div className="mt-6 rounded-xl border border-border p-4 text-center text-sm">
            Your withdrawal of {formatUsd(Number(amount) || 0)} via {method} has been placed successfully. You
            will see it under Recent Payouts while it is being processed.
          </div>
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setMethod(null);
              setAmount("");
            }}
            className="mt-4 w-full rounded-xl bg-sky px-6 py-3 font-bold text-sky-foreground transition-opacity hover:opacity-90"
          >
            OK
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Withdraw">
      <div className="max-w-lg space-y-5">
        <div className="rounded-2xl bg-sky p-5 text-sky-foreground shadow-tile">
          <p className="text-base font-bold">How do you wish to withdraw?</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-xl px-4 py-5 text-sm font-semibold shadow-card transition-transform last:col-span-2 last:mx-auto last:w-1/2 hover:-translate-y-0.5 ${
                  method === m ? "bg-navy text-navy-foreground" : "bg-card text-card-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-bold" htmlFor="amount">
              Amount to withdraw
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              max={account.balance}
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <p className="text-xs text-muted-foreground">
              Available balance: {formatUsd(account.balance)}
            </p>
          </div>
          <button
            type="submit"
            disabled={!method || !amount}
            className="w-full rounded-xl bg-navy px-6 py-3 font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Place withdrawal
          </button>
        </form>
      </div>
    </AppShell>
  );
}
