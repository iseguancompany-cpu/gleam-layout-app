import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/auth";

export type PayoutType = "cashapp" | "bank" | "card";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "completed";

export const formatUsd = (value: number) =>
  `$ ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const payoutLabels: Record<PayoutType, string> = {
  cashapp: "Cash App",
  bank: "Bank Transfer",
  card: "Debit/Credit Card",
};

export function useProfile() {
  const { data: user } = useAuthUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const { data: user } = useAuthUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      full_name: string;
      email: string;
      country: string;
      referrer: string;
    }) => {
      const { error } = await supabase.from("profiles").update(values).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function usePayoutMethods() {
  const { data: user } = useAuthUser();
  return useQuery({
    queryKey: ["payout-methods", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_methods")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddPayoutMethod() {
  const { data: user } = useAuthUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown> & { type: PayoutType }) => {
      const { data, error } = await supabase
        .from("payout_methods")
        .insert({ ...values, user_id: user!.id } as never)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payout-methods"] }),
  });
}

export function useDeletePayoutMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payout_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payout-methods"] }),
  });
}

export function useWithdrawals() {
  const { data: user } = useAuthUser();
  return useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateWithdrawal() {
  const { data: user } = useAuthUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      amount: number;
      method_type: PayoutType;
      method_summary: string;
      payout_method_id: string | null;
    }) => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .insert({ ...values, user_id: user!.id })
        .select("*")
        .single();
      if (error) throw error;

      const { error: activityError } = await supabase.from("activity_log").insert({
        user_id: user!.id,
        kind: "withdrawal_request",
        description: `Withdrawal requested via ${payoutLabels[values.method_type]}`,
        amount: values.amount,
      });
      if (activityError) console.error(activityError);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useActivity() {
  const { data: user } = useAuthUser();
  return useQuery({
    queryKey: ["activity", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Account overview. The balance is the authoritative value stored on the
 * profile — only admin cash loads (add) and approved withdrawals (subtract the
 * requested amount) ever change it. No fees are applied anywhere.
 */
export function useAccountSummary() {
  const { data: profile } = useProfile();
  const { data: withdrawals = [] } = useWithdrawals();

  const pending = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + Number(w.amount), 0);
  const paidOut = withdrawals
    .filter((w) => w.status === "approved" || w.status === "completed")
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const balance = Number(profile?.balance ?? 0);

  return { balance, pending, paidOut, available: balance - pending };
}

/* ---------------- Admin ---------------- */

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      if (rolesError) throw rolesError;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });
}

export function useAdminWithdrawals() {
  return useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminPayoutMethods() {
  return useQuery({
    queryKey: ["admin-payout-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_methods")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminCashLoads() {
  return useQuery({
    queryKey: ["admin-cash-loads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_loads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function invalidateAdmin(qc: ReturnType<typeof useQueryClient>) {
  for (const key of [
    "admin-withdrawals",
    "admin-users",
    "admin-activity",
    "admin-cash-loads",
    "withdrawals",
    "activity",
    "profile",
  ]) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}

/** Approve/decline a request. The database deducts the amount once, no fees. */
export function useUpdateWithdrawalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: string;
      status: WithdrawalStatus;
      note?: string;
    }) => {
      const { error } = await supabase.rpc("admin_set_withdrawal_status", {
        _withdrawal_id: id,
        _status: status,
        _note: note ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}

/** Cash loading portal: admin adds the entered amount to a user's balance. */
export function useLoadCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      note,
    }: {
      userId: string;
      amount: number;
      note?: string;
    }) => {
      const { data, error } = await supabase.rpc("admin_load_cash", {
        _user_id: userId,
        _amount: amount,
        _note: note ?? "",
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => invalidateAdmin(qc),
  });
}

export type PlatformSettings = {
  app_name: string;
  support_email: string;
  withdrawals_enabled: boolean;
  min_withdrawal: number;
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "platform")
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? null) as PlatformSettings | null;
    },
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: PlatformSettings) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "platform", value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
