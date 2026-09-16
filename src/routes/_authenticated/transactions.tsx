import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-semibold">{children}</dd>
    </div>
  );
}

function WithdrawalDetailsModal({
  withdrawal,
  onClose,
}: {
  withdrawal: WithdrawalRow;
  onClose: () => void;
}) {
  const { data: profile } = useProfile();
  const name = profile?.full_name?.trim() || profile?.email || "My account";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Withdrawal details"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-6 shadow-tile"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">Withdrawal Details</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1.5 transition-colors hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-4">
          <DetailRow label="Name">{name}</DetailRow>
          <DetailRow label="Type">
            {payoutLabels[withdrawal.method_type] ?? withdrawal.method_type}
          </DetailRow>
          <DetailRow label="Amount">{formatUsd(Number(withdrawal.amount))}</DetailRow>
          <DetailRow label="Date">
            {new Date(withdrawal.created_at).toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </DetailRow>
          <DetailRow label="Status">
            <StatusBadge status={withdrawal.status} />
          </DetailRow>
          <DetailRow label="Reason">
            {withdrawal.admin_note?.trim() ? withdrawal.admin_note : "No reason provided."}
          </DetailRow>
        </dl>
      </div>
    </div>
  );
}

function Transactions() {
  const { data: profile } = useProfile();
  const { data: withdrawals = [], isLoading } = useWithdrawals();
  const [selected, setSelected] = useState<WithdrawalRow | null>(null);

  const name = profile?.full_name?.trim() || profile?.email || "My account";
  const count = withdrawals.length;

  return (
    <AppShell title="Transactions">
      <div className="rounded-2xl bg-card p-5 shadow-card sm:p-7">
        <h2 className="text-2xl font-extrabold tracking-tight">Transactions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} withdrawal {count === 1 ? "request" : "requests"}
        </p>
      </div>

      <div className="mt-4 rounded-2xl bg-card p-5 shadow-card sm:p-7">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-3 pr-3 font-bold">Name</th>
                <th className="py-3 pr-3 font-bold">Type</th>
                <th className="py-3 pr-3 font-bold">Amount</th>
                <th className="py-3 font-bold">More</th>
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
                  <td className="py-4">
                    <button
                      type="button"
                      onClick={() => setSelected(w)}
                      className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-navy-foreground transition-opacity hover:opacity-80"
                    >
                      View More
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="space-y-3 sm:hidden">
          {withdrawals.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {payoutLabels[w.method_type] ?? w.method_type}
                </p>
                <p className="mt-1 text-sm font-bold">{formatUsd(Number(w.amount))}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(w)}
                className="shrink-0 rounded-full bg-navy px-4 py-2 text-xs font-bold text-navy-foreground transition-opacity hover:opacity-80"
              >
                View More
              </button>
            </div>
          ))}
        </div>

        {withdrawals.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
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
