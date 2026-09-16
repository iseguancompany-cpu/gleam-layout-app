import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatUsd,
  payoutLabels,
  useAdminUsers,
  useAdminWithdrawals,
  useUpdateWithdrawalStatus,
  type WithdrawalStatus,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  head: () => ({
    meta: [
      { title: "Transaction Approvals — Cash Loading Portal" },
      {
        name: "description",
        content: "Review, approve or decline withdrawal requests and leave a note for the account holder.",
      },
      { property: "og:title", content: "Transaction Approvals — Cash Loading Portal" },
      {
        property: "og:description",
        content: "Review, approve or decline withdrawal requests with a note.",
      },
    ],
  }),
  component: AdminApprovals,
});

const filters: (WithdrawalStatus | "all")[] = ["pending", "approved", "completed", "rejected", "all"];

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number | string;
  method_type: string;
  method_summary: string;
  status: WithdrawalStatus;
  admin_note?: string | null;
  created_at: string;
};

function TransactionDetails({
  withdrawal,
  nameFor,
  note,
  onNoteChange,
  onClose,
  onAct,
  isPending,
}: {
  withdrawal: Withdrawal;
  nameFor: (id: string) => string;
  note: string;
  onNoteChange: (v: string) => void;
  onClose: () => void;
  onAct: (status: WithdrawalStatus) => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Transaction Details</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Name</span>
            <span className="text-sm font-semibold">{nameFor(withdrawal.user_id)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Type</span>
            <span className="text-sm">
              {payoutLabels[withdrawal.method_type as keyof typeof payoutLabels] ??
                withdrawal.method_type}{" "}
              ·{" "}
              {withdrawal.method_summary}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Amount</span>
            <span className="text-base font-extrabold">{formatUsd(Number(withdrawal.amount))}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Date</span>
            <span className="text-sm">
              {new Date(withdrawal.created_at).toLocaleString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Status</span>
            <StatusBadge status={withdrawal.status} />
          </div>

          {withdrawal.admin_note && (
            <p className="rounded-xl bg-secondary px-3 py-2 text-xs">
              Note: {withdrawal.admin_note}
            </p>
          )}
        </div>

        {withdrawal.status === "pending" && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <input
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Optional note for the account holder"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => onAct("approved")}
                className="rounded-xl bg-jade px-4 py-2.5 text-sm font-bold text-jade-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onAct("rejected")}
                className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {withdrawal.status === "approved" && (
          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onAct("completed")}
              className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Mark as paid out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminApprovals() {
  const { data: withdrawals = [], isPending } = useAdminWithdrawals();
  const { data: users = [] } = useAdminUsers();
  const update = useUpdateWithdrawalStatus();
  const [filter, setFilter] = useState<WithdrawalStatus | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeWithdrawal, setActiveWithdrawal] = useState<Withdrawal | null>(null);

  const rows = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const nameFor = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u?.full_name?.trim() || u?.email || "Unknown user";
  };

  const act = (id: string, status: WithdrawalStatus) => {
    update.mutate(
      { id, status, note: notes[id] ?? "" },
      {
        onSuccess: () => {
          toast.success(`Request marked ${status}`);
          setActiveWithdrawal(null);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not update the request"),
      },
    );
  };

  return (
    <AdminShell title="Transaction Approvals">
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

      {isPending ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading requests…</p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nothing here right now.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b-2 border-foreground/80 text-xs font-black uppercase tracking-wide text-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">More</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((w) => (
                <tr key={w.id} className="hover:bg-muted/20">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {nameFor(w.user_id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {payoutLabels[w.method_type]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">
                    {formatUsd(Number(w.amount))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveWithdrawal(w)}
                      className="rounded-full bg-blue-900 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                    >
                      More
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeWithdrawal && (
        <TransactionDetails
          withdrawal={activeWithdrawal}
          nameFor={nameFor}
          note={notes[activeWithdrawal.id] ?? ""}
          onNoteChange={(v) => setNotes((n) => ({ ...n, [activeWithdrawal.id]: v }))}
          onClose={() => setActiveWithdrawal(null)}
          onAct={(status) => act(activeWithdrawal.id, status)}
          isPending={update.isPending}
        />
      )}
    </AdminShell>
  );
}
