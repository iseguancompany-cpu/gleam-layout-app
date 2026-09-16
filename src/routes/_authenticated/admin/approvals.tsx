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
            <span className="text-xs font-bold uppercase

text-muted-foreground">Date</span>
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
                onClick={() => onAct("pending")}
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
    const user = users.find((u) => u.i


