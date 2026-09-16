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
  onAct: (status: WithdrawalStatus, noteText?: string) => void;
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
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Type note for user..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                disabled={isPending || !note.trim()}
                onClick={() => onAct(withdrawal.status, note.trim())}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Send Note
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => onAct("approved")}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onAct("rejected")}
                className="flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Reject
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
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Mark Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminApprovals() {
  const { data: withdrawals = [], isLoading } = useAdminWithdrawals();
  const { data: users = [] } = useAdminUsers();
  const update = useUpdateWithdrawalStatus();

  const [filter, setFilter] = useState<WithdrawalStatus | "all">("pending");
  const [activeWithdrawal, setActiveWithdrawal] = useState<Withdrawal | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const nameFor = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name ?? user?.email ?? "Unknown user";
  };

  const visibleWithdrawals =
    filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const noteFor = (id: string) => notes[id] ?? "";
  const setNoteFor = (id: string, value: string) =>
    setNotes((prev) => ({ ...prev, [id]: value }));

  const handleAct = (status: WithdrawalStatus, noteText?: string) => {
    if (!activeWithdrawal) return;

    update.mutate(
      {
        id: activeWithdrawal.id,
        status,
        ...(noteText ? { admin_note: noteText } : {}),
      },
      {
        onSuccess: () => {
          if (noteText) {
            toast.success("Note sent to user");
            setNoteFor(activeWithdrawal.id, "");
            setActiveWithdrawal((prev) =>
              prev ? { ...prev, admin_note: noteText } : prev,
            );
          } else {
            toast.success(`Withdrawal marked as ${status}`);
            setActiveWithdrawal(null);
          }
        },
        onError: () => {
          toast.error("Something went wrong, please try again");
        },
      },
    );
  };

  return (
    <AdminShell>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Transaction Approvals</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading withdrawals…</p>
        ) : visibleWithdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No withdrawals in this view.</p>
        ) : (
          <div className="space-y-2">
            {visibleWithdrawals.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setActiveWithdrawal(w)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-secondary/50"
              >
                <div>
                  <p className="text-sm font-semibold">{nameFor(w.user_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {payoutLabels[w.method_type as keyof typeof payoutLabels] ?? w.method_type} ·{" "}
                    {w.method_summary}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{formatUsd(Number(w.amount))}</span>
                  <StatusBadge status={w.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeWithdrawal && (
        <TransactionDetails
          withdrawal={activeWithdrawal}
          nameFor={nameFor}
          note={noteFor(activeWithdrawal.id)}
          onNoteChange={(v) => setNoteFor(activeWithdrawal.id, v)}
          onClose={() => setActiveWithdrawal(null)}
          onAct={handleAct}
          isPending={update.isPending}
        />
      )}
    </AdminShell>
  );
}
