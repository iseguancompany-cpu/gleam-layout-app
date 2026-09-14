import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { formatUsd, useAdminCashLoads, useAdminUsers, useLoadCash } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/cash")({
  head: () => ({
    meta: [
      { title: "Cash Loading Portal — Admin" },
      {
        name: "description",
        content: "Add funds to an account balance and review the history of every cash load.",
      },
      { property: "og:title", content: "Cash Loading Portal — Admin" },
      {
        property: "og:description",
        content: "Add funds to an account balance and review past cash loads.",
      },
    ],
  }),
  component: AdminCash,
});

const field =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";

function AdminCash() {
  const { data: users = [] } = useAdminUsers();
  const { data: loads = [] } = useAdminCashLoads();
  const load = useLoadCash();

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const selected = users.find((u) => u.id === userId);
  const numeric = Number(amount);

  const nameFor = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u?.full_name?.trim() || u?.email || "Unknown user";
  };

  return (
    <AdminShell title="Cash Loading Portal">
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!userId) {
              toast.error("Choose an account first");
              return;
            }
            if (!Number.isFinite(numeric) || numeric <= 0) {
              toast.error("Enter an amount greater than zero");
              return;
            }
            load.mutate(
              { userId, amount: numeric, note },
              {
                onSuccess: (newBalance) => {
                  toast.success(`Loaded ${formatUsd(numeric)} · new balance ${formatUsd(newBalance)}`);
                  setAmount("");
                  setNote("");
                },
                onError: (err) =>
                  toast.error(err instanceof Error ? err.message : "Could not load cash"),
              },
            );
          }}
        >
          <h2 className="text-base font-bold">Load cash to an account</h2>

          <div className="space-y-2">
            <label className="text-sm font-bold" htmlFor="account">
              Account
            </label>
            <select
              id="account"
              className={field}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Select an account…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {(u.full_name?.trim() || u.email) + ` — ${formatUsd(Number(u.balance ?? 0))}`}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold" htmlFor="amount">
              Amount to add
            </label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              className={field}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold" htmlFor="note">
              Note (optional)
            </label>
            <input
              id="note"
              className={field}
              placeholder="Reason or reference"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {selected && Number.isFinite(numeric) && numeric > 0 && (
            <p className="rounded-xl bg-secondary px-3 py-2 text-sm">
              New balance will be{" "}
              <span className="font-bold">
                {formatUsd(Number(selected.balance ?? 0) + numeric)}
              </span>
            </p>
          )}

          <button
            type="submit"
            disabled={load.isPending}
            className="w-full rounded-xl bg-jade px-4 py-3 text-sm font-bold text-jade-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {load.isPending ? "Loading…" : "Load cash"}
          </button>
        </form>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <h2 className="text-base font-bold">Cash load history</h2>
          {loads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No cash loads yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {loads.map((l) => (
                <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{nameFor(l.user_id)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.note || "No note"} ·{" "}
                      {new Date(l.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-jade">
                    +{formatUsd(Number(l.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
