import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  formatUsd,
  useAdminUpdateUser,
  useAdminUsers,
  type AdminUserEdit,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Cash Loading" },
      {
        name: "description",
        content: "Browse accounts and edit account details, verification and account status.",
      },
      { property: "og:title", content: "User Management — Cash Loading" },
      {
        property: "og:description",
        content: "Browse accounts and edit account details and status.",
      },
    ],
  }),
  component: AdminUsers,
});

const field =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "text-xs font-bold uppercase text-muted-foreground";

const verificationOptions = ["unverified", "pending", "verified", "rejected"] as const;

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  balance: number | string;
  id_verification_status?: string | null;
  payment_address?: string | null;
  account_status?: string | null;
  admin_notes?: string | null;
};

function EditUserCard({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const save = useAdminUpdateUser();
  const [values, setValues] = useState<AdminUserEdit>({
    full_name: user.full_name ?? "",
    phone: user.phone ?? "",
    email: user.email ?? "",
    id_verification_status: user.id_verification_status ?? "unverified",
    payment_address: user.payment_address ?? "",
    account_status: user.account_status ?? "active",
    admin_notes: user.admin_notes ?? "",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof AdminUserEdit) => (v: string) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <form
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(
            { id: user.id, values },
            {
              onSuccess: () => {
                toast.success("Changes saved");
                onClose();
              },
              onError: (err) =>
                toast.error(err instanceof Error ? err.message : "Could not save changes"),
            },
          );
        }}
      >
        <h2 className="text-lg font-extrabold">Edit User Details</h2>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className={labelCls}>Name</label>
            <input
              className={field}
              value={values.full_name}
              onChange={(e) => set("full_name")(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Phone</label>
            <input
              className={field}
              value={values.phone}
              onChange={(e) => set("phone")(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Email</label>
            <input
              type="email"
              className={field}
              value={values.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>User ID</label>
            <input readOnly className={`${field} text-muted-foreground`} value={user.id} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>ID Verification Status</label>
            <select
              className={field}
              value={values.id_verification_status}
              onChange={(e) => set("id_verification_status")(e.target.value)}
            >
              {verificationOptions.map((o) => (
                <option key={o} value={o}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Payment Address</label>
            <input
              className={field}
              placeholder="Cashtag, bank or card destination"
              value={values.payment_address}
              onChange={(e) => set("payment_address")(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <span className={labelCls}>Account Status</span>
            <div className="flex gap-4 pt-1">
              {["active", "suspended"].map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="account_status"
                    value={s}
                    checked={values.account_status === s}
                    onChange={() => set("account_status")(s)}
                  />
                  {s === "active" ? "Active" : "Suspended"}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Account Notes</label>
            <textarea
              rows={3}
              className={field}
              value={values.admin_notes}
              onChange={(e) => set("admin_notes")(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-xl bg-sky px-5 py-2.5 text-sm font-bold text-sky-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold transition-colors hover:bg-accent"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminUsers() {
  const { data: users = [], isPending } = useAdminUsers();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  const editing = (users as UserRow[]).find((u) => u.id === editingId) ?? null;

  return (
    <AdminShell title="User Management">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email"
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />

      {isPending ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading accounts…</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No accounts match that search.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card">
          {(filtered as UserRow[]).map((u) => (
            <li
              key={u.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{u.full_name || "Unnamed account"}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {formatUsd(Number(u.balance ?? 0))}
                  {u.account_status === "suspended" ? " · Suspended" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(u.id)}
                className="shrink-0 rounded-lg bg-sky px-4 py-2 text-sm font-bold text-sky-foreground transition-opacity hover:opacity-90"
              >
                View
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && <EditUserCard user={editing} onClose={() => setEditingId(null)} />}
    </AdminShell>
  );
}
