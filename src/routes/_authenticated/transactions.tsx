import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatUsd, payoutLabels, useProfile, useWithdrawals } from "@/lib/api";

type WithdrawalRow = NonNullable<ReturnType<typeof useWithdrawals>["data"]>[number];

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Cash Loading" },
      {
        name: "description",
        content: "Review your withdrawal requests, their amounts, dates and current status.",
      },
      { property: "og:title", content: "Transactions — Cash Loading" },
      { property: "og:description", content: "Review your withdrawal requests and their status." },
    ],
  }),
  component: Transactions,
});

function WithdrawalDetailsModal({
  withdrawal,
  onClose,
}: {
  withdrawal: WithdrawalRow;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isPending = withdrawal.status === "pending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular Warning Icon */}
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-500">
          <span className="text-3xl font-extrabold leading-none">!</span>
        </div>

        {/* Title & Amount Subtitle */}
        <h2 className="mt-4 text-2xl font-extrabold text-foreground">
          {isPending ? "Withdrawal Pending" : `Withdrawal ${withdrawal.status.toUpperCase()}`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPending
            ? `Waiting for your ${formatUsd(Number(withdrawal.amount))} withdrawal to process.`
            : `Your withdrawal of ${formatUsd(Number(withdrawal.amount))} is ${withdrawal.status}.`}
        </p>

        {/* Details Card */}
        <div className="mt-5 space-y-2 rounded-2xl border border-border bg-muted/20 p-4 text-left text-xs sm:text-sm">
          <div className="flex justify-between gap-2">
            <span className="font-semibold text-muted-foreground">Request ID</span>
            <span className="font-mono text-xs font-bold text-foreground truncate max-w-[200px]">
              {withdrawal.id}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="font-semibold text-muted-foreground">Payment Method</span>
            <span className="text-right text-foreground">
              {payoutLabels[withdrawal.method_type]
?? withdrawal.method_type}
              {withdrawal.method_summary ? ` · ${withdrawal.method_summary}` : ""}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="font-semibold text-muted-foreground">Status</span>
            <span className="font-bold capitalize text-foreground">{withdrawal.status}</span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="font-semibold text-muted-foreground">Submitted</span>
            <span className="text-muted-foreground">
              {new Date(withdrawal.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          {withdrawal.admin_note?.trim() && (
            <div className="rounded-xl border border-border bg-card p-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Admin Note
              </span>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {withdrawal.admin_note}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-foreground py-3 font-bold text-background transition hover:opacity-90 cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function Transactions() {
  const { data: profile } = useProfile();
  const { data: withdrawals = [], isLoading } = useWithdrawals();
  const [selected, setSelected] = useState<WithdrawalRow | null>(null);

  const name = profile?.full_name || "Account";
  const count = withdrawals.length;

  return (
    <AppShell>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} {count === 1 ? "withdrawal request" : "withdrawal requests"}
        </p>

        {/* Horizontal table on all screen sizes */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-3 pr-3 font-bold">Name</th>
                <th className="py-3 pr-3 font-bold">Method</th>
                <th className="py-3 pr-3 font-bold">Amount</th>
                <th className="py-3 pr-3 font-bold">Status</th>
                <th className="py-3 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals.map((w) => (
                <tr key={w.id}>
                  <td className="py-4 pr-3 font-semibold">{name}</td>
                  <td className="py-4 pr-3">
                    {payoutLabels[w.method_type] ?? w.method_type}
                  </td>
                  <td className="py-4 pr-3 font-bold">{formatUsd(Number(w.amount))}</td>
                  <td className="py-4 pr-3">
                    <button
  type="button"
                      onClick={() => setSelected(w)}
                      className="cursor-pointer transition hover:opacity-80"
                    >
                      <StatusBadge status={w.status} />
                    </button>
                  </td>
                  <td className="py-4 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(w.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {withdrawals.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : "No requests yet."}
          </p>
        )}
      </div>

      {selected && (
        <WithdrawalDetailsModal withdrawal={selected} onClose={() => setSelected(null)} />
      )}
    </AppShell>
  );
}
