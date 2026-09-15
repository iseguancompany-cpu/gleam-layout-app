```tsx
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
    
       {
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
        
          Edit User Details
          
            ✕
          
        

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
[9/15/2026 12:18 PM] Lovable:         <label className={labelCls}>Email</label>
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
          value={values.admin_notes}
          onChange={(e) => set("admin_notes")(e.target.value)}
        />
      </div>
    </div>

    <div className="mt-5 flex items-center justify-end gap-2">
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
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {save.isPending ? "Saving…" : "Save Changes"}
      </button>
    </div>
  </form>
</div>

);
}

function AdminUsers() {
  const { data: users, isPending } = useAdminUsers();
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q),
    );
  }, [users, query]);

return (
    
      
        
          Users
           setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        

    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase text-muted-foreground">
[9/15/2026 12:18 PM] Lovable:             <th className="px-3 py-2 font-semibold">NAME</th>
            <th className="px-3 py-2 font-semibold">EMAIL</th>
            <th className="px-3 py-2 font-semibold">PHONE</th>
            <th className="px-3 py-2 font-semibold">MORE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isPending ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-muted-foreground">
                Loading users...
              </td>
            </tr>
          ) : filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-muted-foreground">
                No users found
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/40">
                <td className="px-3 py-3 font-medium">{user.full_name || "Unnamed"}</td>
                <td className="px-3 py-3 text-muted-foreground">{user.email || "—"}</td>
                <td className="px-3 py-3 text-muted-foreground">{user.phone || "—"}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      View User
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toast.info("User deletion is disabled");
                      }}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Delete User
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {selectedUser && (
      <EditUserCard user={selectedUser} onClose={() => setSelectedUser(null)} />
    )}
  </div>
</AdminShell>

);
}
```
