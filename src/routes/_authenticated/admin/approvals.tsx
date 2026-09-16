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
        content:
          "Review, approve or decline withdrawal requests and leave a note for the account holder.",
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

const filters: (WithdrawalStatus | "all")[] = [
  "pending",
  "approved",
  "completed",
  "rejected",
  "all",
];

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
  const isPendingStatus = withdrawal.status === "pending";
  const isApproved = withdrawal.status === "approved";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Withdrawal request
            </p>

            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">
              Transaction Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        {/* Status section */}
        <div className="px-6 pt-5">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Current status
              </p>

              <div className="mt-2">
                <StatusBadge status={withdrawal.status} />
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Amount
              </p>

              <p className="mt-1 text-xl font-extrabold text-slate-950">
                {formatUsd(Number(withdrawal.amount))}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5">
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between gap-5 px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Name
              </span>

              <span className="text-right text-sm font-bold text-slate-900">
                {nameFor(withdrawal.user_id)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-5 px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Type
              </span>

              <span className="text-right text-sm font-semibold text-slate-700">
                {payoutLabels[withdrawal.method_type]}
              </span>
            </div>

            <div className="flex items-center justify-between gap-5 px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Method
              </span>

              <span className="text-right text-sm font-semibold text-slate-700">
                {withdrawal.method_summary}
              </span>
            </div>

            <div className="flex items-center justify-between gap-5 px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Date
              </span>

              <span className="text-right text-sm font-semibold text-slate-700">
                {new Date(withdrawal.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Admin reason / note */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Withdrawal reason / note
            </p>

            {withdrawal.admin_note ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm leading-6 text-slate-700">
                  {withdrawal.admin_note}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-400">
                  No reason or note has been provided.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isPendingStatus && (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Admin note
            </p>

            <input
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note for the account holder..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
            />

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => onAct("approved")}
                className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => onAct("rejected")}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onAct("completed")}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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

  const [filter, setFilter] =
    useState<WithdrawalStatus | "all">("pending");

  const [notes, setNotes] = useState<Record<string, string>>({});

  const [activeWithdrawal, setActiveWithdrawal] =
    useState<Withdrawal | null>(null);

  const rows =
    filter === "all"
      ? withdrawals
      : withdrawals.filter((w) => w.status === filter);

  const nameFor = (id: string) => {
    const u = users.find((x) => x.id === id);

    return u?.full_name?.trim() || u?.email || "Unknown user";
  };

  const act = (id: string, status: WithdrawalStatus) => {
    update.mutate(
      {
        id,
        status,
        note: notes[id] ?? "",
      },
      {
        onSuccess: () => {
          toast.success(`Request marked ${status}`);
          setActiveWithdrawal(null);
        },

        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : "Could not update the request",
          ),
      },
    );
  };

  return (
    <AdminShell title="Transaction Approvals">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
          Transactions
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review and manage withdrawal requests.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              filter === f
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transactions */}
      {isPending ? (
        <div className="mt-5 rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading requests…
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Nothing here right now.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Name
                  </th>

                  <th className="px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Type
                  </th>

                  <th className="px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    More
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((w) => (
                  <tr
                    key={w.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {nameFor(w.user_id)}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {payoutLabels[w.method_type]}
                    </td>

                    <td className="px-5 py-4 font-extrabold text-slate-900">
                      {formatUsd(Number(w.amount))}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveWithdrawal(w)}
                        className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                      >
                        View More
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details modal */}
      {activeWithdrawal && (
        <TransactionDetails
          withdrawal={activeWithdrawal}
          nameFor={nameFor}
          note={notes[activeWithdrawal.id] ?? ""}
          onNoteChange={(v) =>
            setNotes((n) => ({
              ...n,
              [activeWithdrawal.id]: v,
            }))
          }
          onClose={() => setActiveWithdrawal(null)}
          onAct={(status) =>
            act(activeWithdrawal.id, status)
          }
          isPending={update.isPending}
        />
      )}
    </AdminShell>
  );
}
