import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

// Status choices shown in the dropdown inside the edit form.
const statusOptions: WithdrawalStatus[] = ["pending", "approved", "rejected", "completed"];

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

// Everything the admin can edit in the popup before hitting Save Changes.
type EditState = {
  amount: string;
  status: WithdrawalStatus;
  reason: string;
  methodSummary: string;
};

function TransactionEditForm({
  withdrawal,
  nameFor,
  onClose,
  onSave,
  isSaving,
}: {
  withdrawal: Withdrawal;
  nameFor: (id: string) => string;
  onClose: () => void;
  onSave: (edits: EditState) => void;
  isSaving: boolean;
}) {
  const [edits, setEdits] = useState<EditState>({
    amount: String(withdrawal.amount),
    status: withdrawal.status,
    reason: withdrawal.admin_note ?? "",
    methodSummary: withdrawal.method_summary,
  });

  const update = <K extends keyof EditState>(key: K, value: EditState[K]) =>
    setEdits((prev) => ({ ...prev, [key]: value }));

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
          <h2 className="text-lg font-bold">{nameFor(withdrawal.user_id)}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Amount */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={edits.amount}
              onChange={(e) => update("amount", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {/* Status — dropdown with Pending / Approved / Decline / Completed */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
              Status
            </label>
            <select
              value={edits.status}
              onChange={(e) => update("status", e.target.value as WithdrawalStatus)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm capitalize outline-none focus:ring-2 focus:ring-ring/40"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s === "rejected" ? "Declined" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Reason / note sent to the account holder */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
              Reason
            </label>
            <textarea
              value={edits.reason}
              onChange={(e) => update("reason", e.target.value)}
              placeholder="Note for the account holder…"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {/* Cash App handle / payout method summary */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
              {payoutLabels[withdrawal.method_type] ?? withdrawal.method_type} Handle
            </label>
            <input
              value={edits.methodSummary}
              onChange={(e) => update("methodSummary", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {/* Current status shown for reference before edits are saved */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Current status</span>
            <StatusBadge status={withdrawal.status} />
          </div>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => onSave(edits)}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function AdminApprovals() {
  const { data: withdrawals = [], isPending } = useAdminWithdrawals();
  const { data: users = [] } = useAdminUsers();
  const update = useUpdateWithdrawalStatus();
  const [filter, setFilter] = useState<WithdrawalStatus | "all">("pending");
  const [activeWithdrawal, setActiveWithdrawal] = useState<Withdrawal | null>(null);

  const rows = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const nameFor = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u?.full_name?.trim() || u?.email || "Unknown user";
  };

  // Single save path: sends everything the admin edited (amount, status,
  // reason/note, method summary) together in one request.
  const queryClient = useQueryClient();

  const saveChanges = async (withdrawal: Withdrawal, edits: EditState) => {
    // If status didn't change, update directly without triggering the RPC error
    if (edits.status === withdrawal.status) {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          admin_note: edits.reason.trim() || null,
          amount: Number(edits.amount),
          method_summary: edits.methodSummary,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Changes saved");
        queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
        setActiveWithdrawal(null);
      }
      return;
    }

    // If status changed, call the status mutation
    update.mutate(
      {
        id: withdrawal.id,
        status: edits.status,
        note: edits.reason,
        amount: Number(edits.amount),
        method_summary: edits.methodSummary,
      },
      {
        onSuccess: () => {
          toast.success("Changes saved");
          setActiveWithdrawal(null);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not save changes"),
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
        <TransactionEditForm
          withdrawal={activeWithdrawal}
          nameFor={nameFor}
          onClose={() => setActiveWithdrawal(null)}
          onSave={(edits) => saveChanges(activeWithdrawal, edits)}
          isSaving={update.isPending}
        />
      )}
    </AdminShell>
  );
}
