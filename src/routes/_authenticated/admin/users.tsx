import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { formatUsd, useAdminPayoutMethods, useAdminUsers, useAdminWithdrawals } from "@/lib/api";
import { methodTitle, summarizeMethod, type PayoutMethodRow } from "@/lib/payout";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Cash Loading Portal" },
      {
        name: "description",
        content: "Search accounts, review balances, roles, payout methods and request history.",
      },
      { property: "og:title", content: "User Management — Cash Loading Portal" },
      {
        property: "og:description",
        content: "Search accounts and review balances, roles and payout methods.",
      },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const { data: users = [], isPending } = useAdminUsers();
  const { data: methods = [] } = useAdminPayoutMethods();
  const { data: withdrawals = [] } = useAdminWithdrawals();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q),
    );
  }, [users, query]);

  return (
    <AdminShell title="User Management">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email or country"
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />

      {isPending ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading accounts…</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No accounts match that search.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((u) => {
            const open = openId === u.id;
            const userMethods = methods.filter((m) => m.user_id === u.id) as PayoutMethodRow[] &
              typeof methods;
            const userWithdrawals = withdrawals.filter((w) => w.user_id === u.id);
            return (
              <li key={u.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : u.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{u.full_name || "Unnamed account"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold">{formatUsd(Number(u.balance ?? 0))}</span>
                    <span className="text-[11px] font-bold uppercase text-muted-foreground">
                      {u.roles.length ? u.roles.join(", ") : "user"}
                    </span>
                  </div>
                </button>

                {open && (
                  <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">Details</p>
                      <dl className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Country</dt>
                          <dd className="font-semibold">{u.country}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Referrer</dt>
                          <dd className="font-semibold">{u.referrer || "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Joined</dt>
                          <dd className="font-semibold">
                            {new Date(u.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            })}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Requests</dt>
                          <dd className="font-semibold">{userWithdrawals.length}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Payout methods
                      </p>
                      {userMethods.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">None saved.</p>
                      ) : (
                        <ul className="mt-2 space-y-2 text-sm">
                          {userMethods.map((m) => (
                            <li key={m.id} className="rounded-xl bg-secondary px-3 py-2">
                              <p className="font-semibold">{methodTitle(m)}</p>
                              <p className="text-xs text-muted-foreground">{summarizeMethod(m)}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
