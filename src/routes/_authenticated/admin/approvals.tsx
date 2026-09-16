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
  const isRequestPending = withdrawal.status === "pending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Withdrawal details"
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
          {isRequestPending ? "Withdrawal Pending" : `Withdrawal ${withdrawal.status.toUpperCase()}`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRequestPending
            ? `${nameFor(withdrawal.user_id)} is waiting on a ${formatUsd(Number(withdrawal.amount))} withdrawal.`
            : `${nameFor(withdrawal.user_id)}'s withdrawal of ${formatUsd(Number(withdrawal.amount))} is ${withdrawal.status}.`}
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
            <span className="font-semibold text-muted-foreground">Name</span>
            <span className="font-bold text-foreground">{nameFor(withdrawal.user_id)}</span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="font-semibold text-muted-foreground">Type</span>
            <span className="text-right text-foreground">
              {payoutLabels[withdrawal.method_type] ?? withdrawal.method_type} ·{" "}
              {withdrawal.method_summary}
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

          {/* Existing Admin Note */}
          {withdrawal.admin_note?.trim() && (
            <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-primary">
                Admin Note
              </span>
              <p className="mt-1 text-xs sm:text-sm text-foreground">{withdrawal.admin_note}</p>
            </div>
          )}
        </div>

        {/* Note input + actions, only while the request is still pending */}
        {isRequestPending && (
          <div className="mt-5 space-y-3 text-left">
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Optional note for the account holder"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                type="button"
                disabled={isSendingNote || !note.trim()}
                onClick={onSendNote}
                className="shrink-0 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSendingNote ? "Sending…" : "Send Note"}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => onAct("approved")}
                className="flex-1 rounded-xl bg-jade px-4 py-2.5 text-sm font-bold text-jade-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onAct("rejected")}
                className="flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {withdrawal.status === "approved" && (
          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onAct("completed")}
              className="w-full rounded-xl bg-navy px-6 py-2.5 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Mark as paid out
            </button>
          </div>
        )}

        {/* Close button for non-actionable states */}
        {!isRequestPending && withdrawal.status !== "approved" && (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full max-w-[140px] mx-auto block rounded-xl bg-navy px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            OK
          </button>
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
  const [sendingNoteId, setSendingNoteId] = useState<string | null>(null);

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

  // Sends the note to the user WITHOUT changing the withdrawal's status.
  // Reuses the same mutation, but passes the withdrawal's current status back
  // unchanged so only `note`/`admin_note` is written on the backend.
  const sendNote = (withdrawal: Withdrawal) => {
    const noteText = notes[withdrawal.id]?.trim();
    if (!noteText) return;

    setSendingNoteId(withdrawal.id);
    update.mutate(
      { id: withdrawal.id, status: withdrawal.status, note: noteText },
      {
        onSuccess: () => {
          toast.success("Note sent to user");
          setNotes((n) => ({ ...n, [withdrawal.id]: "" }));
          // Reflect the note locally right away so the modal shows it
          // without waiting on a refetch.
          setActiveWithdrawal((prev) =>
            prev && prev.id === withdrawal.id ? { ...prev, admin_note: noteText } : prev,
          );
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not send the note"),
        onSettled: () => setSendingNoteId(null),
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
                    {payoutLabels[w.method_type] ?? w.method_type}
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
          onSendNote={() => sendNote(activeWithdrawal)}
          isPending={update.isPending}
          isSendingNote={sendingNoteId === activeWithdrawal.id}
        />
      )}
    </AdminShell>
  );
}
