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

function AdminApprovals() {
  const { data: withdrawals = [], isPending } = useAdminWithdrawals();
  const { data: users = [] } = useAdminUsers();
  const update = useUpdateWithdrawalStatus();
  const [filter, setFilter] = useState<WithdrawalStatus | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const rows = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const nameFor = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u?.full_name?.trim() || u?.email || "Unknown user";
  };

  const act = (id: string, status: WithdrawalStatus) => {
    update.mutate(
      { id, status, note: notes[id] ?? "" },
      {
        onSuccess: () => toast.success(`Request marked ${status}`),
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
        <ul className="mt-5 space-y-3">
          {rows.map((w) => (
            <li key={w.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{nameFor(w.user_id)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {payoutLabels[w.method_type]} · {w.method_summary}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(w.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-base font-extrabold">{formatUsd(Number(w.amount))}</span>
                  <StatusBadge status={w.status} />
                </div>
              </div>

              {w.admin_note && (
                <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs">
                  Note: {w.admin_note}
                </p>
              )}

              {w.status === "pending" && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <input
                    value={notes[w.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [w.id]: e.target.value }))}
                    placeholder="Optional note for the account holder"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={update.isPending}
                      onClick={() => act(w.id, "approved")}
                      className="rounded-xl bg-jade px-4 py-2.5 text-sm font-bold text-jade-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={update.isPending}
                      onClick={() => act(w.id, "rejected")}
                      className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {w.status === "approved" && (
                <div className="mt-4 border-t border-border pt-4">
                  <button
                    type="button"
                    disabled={update.isPending}
                    onClick={() => act(w.id, "completed")}
                    className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Mark as paid out
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
