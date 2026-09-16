import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
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
  id_verification_status?: string | null;
  payment_address?: string | null;
  account_status?: string | null;
  admin_notes?: string | null;
};

function EditUserCard({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const save = useAdminUpdateUser();
  const [values, setValues] = useState({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Edit User Details</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
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
              {verificationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Payment Address</label>
            <input
              className={field}
              placeholder="e.g. $cashtag or wallet"
              value={values.payment_address}
              onChange={(e) => set("payment_address")(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Account Status</label>
            <select
              className={field}
              value={values.account_status}
              onChange={(e) => set("account_status")(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Admin Notes</label>
            <textarea
              className={`${field} min-h-[70px] resize-none`}
              placeholder="Internal notes about this user"
              value={values.admin_notes}
              onChange={(e) => set("admin_notes")(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {save.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminUsers() {
  const { data: users = [], isLoading, error } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] = useState<UserRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users as unknown as UserRow[];
    return (users as unknown as UserRow[]).filter((u) =>
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <AdminShell title="User Management">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">User Management</h1>

        <input
          className={field}
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading users...</div>
        ) : error ? (
          <div className="py-6 text-center text-sm text-destructive">Could not load users.</div>
        ) : (
          <>
            {/* Table view on all screen sizes; scrolls horizontally on narrow viewports */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b-2 border-foreground/80 text-xs font-black uppercase tracking-wide text-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-right">More</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {u.full_name || "Unnamed user"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground underline">
                        {u.email || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {u.phone || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveUser(u)}
                            className="rounded-full bg-blue-900 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                          >
                            View User
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.info("User deletion is protected.")}
                            className="rounded-full bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800"
                          >
                            Delete User
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeUser && (
          <EditUserCard user={activeUser} onClose={() => setActiveUser(null)} />
        )}
      </div>
    </AdminShell>
  );
}
