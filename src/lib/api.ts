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
        .insert({ ...values, user_id: user!.id })
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

      await supabase.from("activity_log").insert({
        user_id: user!.id,
        kind: "withdrawal",
        description: `Withdrawal request via ${payoutLabels[values.method_type]}`,
        amount: values.amount,
      });
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
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Available balance is derived from recorded activity — no fees are ever applied. */
export function useBalance() {
  const { data: activity = [] } = useActivity();
  const { data: withdrawals = [] } = useWithdrawals();

  const deposits = activity
    .filter((a) => a.kind === "deposit")
    .reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
  const pending = withdrawals
    .filter((w) => w.status === "pending" || w.status === "approved")
    .reduce((sum, w) => sum + Number(w.amount), 0);
  const completed = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + Number(w.amount), 0);

  return {
    deposits,
    pending,
    completed,
    available: deposits - pending - completed,
  };
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

export function useUpdateWithdrawalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WithdrawalStatus }) => {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    },
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
