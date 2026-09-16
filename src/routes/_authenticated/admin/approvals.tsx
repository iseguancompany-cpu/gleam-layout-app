import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
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
  onSendNote,
  isPending,
  isSendingNote,
}: {
  withdrawal: Withdrawal;
  nameFor: (id: string) => string;
  note: string;
  onNoteChange: (v: string) => void;
  onClose: () => void;
  onAct: (status: WithdrawalStatus) => void;
  onSendNote: () => void;
  isPending: boolean;
  isSendingNote: boolean;
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
            <s

pan className="text-xs font-bold uppercase text-muted-foreground">Type</span>
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
                disabled={isSendingNote || !note.trim()}
                onClick={onSendNote}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSendingNote ? "Sending..." : "Send Note"}
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
  const qc = useQueryClient();

  const [filter, setFilter] = useState<WithdrawalStatus | "all">("pending");
  const [activeWithdrawal, setActiveWithdrawal] = useState<Withdrawal | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isSendingNote, setIsSendingNote] = useState(false);

  const nameFor = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.full_name ?? user?.email ?? "User";
  };

  const handleSendNote = async () => {
    if (!activeWithdrawal) return;
    const noteText = notes[activeWithdrawal.id]?.trim();
    if (!noteText) return;

    setIsSendingNote(true);
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          admin_note: noteText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeWithdrawal.id);

      if (error) throw error;

      toast.success("Note sent to user");
      setActiveWithdrawal((prev) => (prev ? { ...prev, admin_note: noteText } : null));
      qc.invalidateQueries({ queryKey: ["admin_withdrawals"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send note");
    } finally {
      setIsSendingNote(false);
    }
  };

  const handleAct = (status: WithdrawalStatus) => {
    if (!activeWithdrawal) return;
    update.mutate(
      {
        id: activeWithdrawal.id,
        status,
        note: notes[activeWithdrawal.id] ?? activeWithdrawal.admin_note ?? "",
      },
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

  const filtered = withdrawals.filter((w) => (filter === "all" ? true : w.status === filter));

  return (
    <AdminShell title="Transaction Approvals">
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading withdrawal requests...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests found for this filter.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className=

"px-4 py-3">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{nameFor(w.user_id)}</td>
                    <td className="px-4 py-3 font-bold">{formatUsd(Number(w.amount))}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payoutLabels[w.method_type as keyof typeof payoutLabels] ?? w.method_type}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNotes((prev) => ({
                            ...prev,
                            [w.id]: prev[w.id] ?? w.admin_note ?? "",
                          }));
                          setActiveWithdrawal(w);
                        }}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeWithdrawal && (
        <TransactionDetails
          withdrawal={activeWithdrawal}
          nameFor={nameFor}
          note={notes[activeWithdrawal.id] ?? ""}
          onNoteChange={(v) =>
            setNotes((prev) => ({
              ...prev,
              [activeWithdrawal.id]: v,
            }))
          }
          onClose={() => setActiveWithdrawal(null)}
          onAct={handleAct}
          onSendNote={handleSendNote}
          isPending={update.isPending}
          isSendingNote={isSendingNote}
        />
      )}
    </AdminShell>
  );
}

