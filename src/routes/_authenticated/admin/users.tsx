import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
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
        content: "Browse accounts and edit account details.",
      },
    ],
  }),
  component: AdminUsers,
});

const field =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

const labelCls =
  "mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground";

const formatUsd = (value: number) =>
  `$ ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  balance?: number | null;
  withdrawal_fee?: number | null;
  id_verification_status?: string | null;
  payment_address?: string | null;
  account_status?: string | null;
  admin_notes?: string | null;
  loading_code?: string | null;
  roles?: string[];
};

function EditUserCard({
  user,
  onClose,
}: {
  user: UserRow;
  onClose: () => void;
}) {
  const save = useAdminUpdateUser();

  const [pendingBalance, setPendingBalance] = useState(0);
  const [loadingPending, setLoadingPending] = useState(true);

  const [values, setValues] = useState<
    AdminUserEdit & {
      withdrawal_fee: number;
    }
  >({
    full_name: user.full_name ?? "",
    phone: user.phone ?? "",
    email: user.email ?? "",
    withdrawal_fee: Number(user.withdrawal_fee ?? 0),
    id_verification_status:
      user.id_verification_status ?? "unverified",
    payment_address: user.payment_address ?? "",
    account_status: user.account_status ?? "active",
    admin_notes: user.admin_notes ?? "",
  });

  useEffect(() => {
    const loadPendingBalance = async () => {
      setLoadingPending(true);

      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (error) {
        console.error(error);
        setPendingBalance(0);
      } else {
        const total = (data ?? []).reduce(
          (sum, withdrawal) =>
            sum + Number(withdrawal.amount ?? 0),
          0,
        );

        setPendingBalance(total);
      }

      setLoadingPending(false);
    };

    loadPendingBalance();
  }, [user.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const balance = Number(user.balance ?? 0);

  /*
   * Total balance here means the user's actual balance
   * plus money currently sitting in pending withdrawals.
   */
  const totalBalance = balance + pendingBalance;

  const updateField = (
    key: keyof (AdminUserEdit & {
      withdrawal_fee: number;
    }),
    value: string | number,
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    save.mutate(
      {
        id: user.id,
        /*
         * withdrawal_fee is included here so it is written
         * to the profiles table.
         */
        values: values as AdminUserEdit,
      },
      {
        onSuccess: () => {
          toast.success("User details updated");
          onClose();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not save changes",
          );
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Edit User</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update this user's account details
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-lg text-muted-foreground hover:bg-muted"
          >
            ×
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className={labelCls}>Name</label>

          <input
            type="text"
            className={field}
            value={values.full_name}
            onChange={(event) =>
              updateField("full_name", event.target.value)
            }
            placeholder="Full name"
          />
        </div>

        {/* Balance */}
        <div className="mb-4">
          <label className={labelCls}>Balance</label>

          <input
            type="text"
            className={`${field} bg-muted`}
            value={
              loadingPending
                ? "Loading..."
                : formatUsd(balance)
            }
            readOnly
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Current account balance.
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className={labelCls}>Email Address</label>

          <input
            type="email"
            className={field}
            value={values.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
            placeholder="Email address"
          />
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className={labelCls}>Phone Number</label>

          <input
            type="tel"
            className={field}
            value={values.phone}
            onChange={(event) =>
              updateField("phone", event.target.value)
            }
            placeholder="Phone number"
          />
        </div>

        {/* Pending Balance */}
        <div className="mb-4">
          <label className={labelCls}>Pending Balance</label>

          <input
            type="text"
            className={`${field} bg-muted`}
            value={
              loadingPending
                ? "Loading..."
                : formatUsd(pendingBalance)
            }
            readOnly
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Total amount currently in pending withdrawals.
          </p>
        </div>

        {/* Total Balance */}
        <div className="mb-4">
          <label className={labelCls}>Total Balance</label>

          <input
            type="text"
            className={`${field} bg-muted`}
            value={
              loadingPending
                ? "Loading..."
                : formatUsd(totalBalance)
            }
            readOnly
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Balance plus pending withdrawals.
          </p>
        </div>

        {/* Withdrawal Fee */}
        <div className="mb-4">
          <label className={labelCls}>
            Editable Withdrawal Fee
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              className={`${field} pl-7`}
              value={values.withdrawal_fee}
              onChange={(event) =>
                updateField(
                  "withdrawal_fee",
                  Number(event.target.value) || 0,
                )
              }
              placeholder="0.00"
            />
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            The withdrawal fee assigned to this user.
          </p>
        </div>

        {/* ID Verification */}
        <div className="mb-4">
          <label className={labelCls}>
            ID Verification Status
          </label>

          <select
            className={field}
            value={values.id_verification_status}
            onChange={(event) =>
              updateField(
                "id_verification_status",
                event.target.value,
              )
            }
          >
            <option value="unverified">Unverified</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Payment Address */}
        <div className="mb-4">
          <label className={labelCls}>Payment Address</label>

          <input
            type="text"
            className={field}
            value={values.payment_address}
            onChange={(event) =>
              updateField(
                "payment_address",
                event.target.value,
              )
            }
            placeholder="Payment address"
          />
        </div>

        {/* Account Status */}
        <div className="mb-4">
          <label className={labelCls}>Account Status</label>

          <select
            className={field}
            value={values.account_status}
            onChange={(event) =>
              updateField(
                "account_status",
                event.target.value,
              )
            }
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {/* Admin Notes */}
        <div className="mb-6">
          <label className={labelCls}>Admin Notes</label>

          <textarea
            className={`${field} min-h-[90px] resize-none`}
            value={values.admin_notes}
            onChange={(event) =>
              updateField(
                "admin_notes",
                event.target.value,
              )
            }
            placeholder="Admin notes..."
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={save.isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {save.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminUsers() {
  const {
    data: users = [],
    isLoading,
    error,
  } = useAdminUsers();

  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] =
    useState<UserRow | null>(null);

  const filteredUsers = (users as UserRow[]).filter((user) => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) return true;

    return (
      user.full_name?.toLowerCase().includes(searchValue) ||
      user.email?.toLowerCase().includes(searchValue) ||
      user.phone?.toLowerCase().includes(searchValue)
    );
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">
            User Management
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage user accounts and account details.
          </p>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-border bg-card p-4">
          <input
            type="search"
            className={field}
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading users...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              Could not load users.
            </p>
          </div>
        )}

        {/* Users Table */}
        {!isLoading && !error && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-5 py-4 font-semibold">
                      Name
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Email
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Phone
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Balance
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold">
                          {user.full_name || "Unnamed User"}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {user.id}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {user.email || "—"}
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {user.phone || "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formatUsd(
                          Number(user.balance ?? 0),
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveUser(user)
                          }
                          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                        >
                          Edit User
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-sm text-muted-foreground"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Popup */}
      {activeUser && (
        <EditUserCard
          user={activeUser}
          onClose={() => setActiveUser(null)}
        />
      )}
    </AdminShell>
  );
}
