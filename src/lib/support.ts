import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/auth";

export type SupportStatus = "open" | "resolved";

export type SupportConversation = {
  id: string;
  user_id: string;
  subject: string;
  status: SupportStatus;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

export type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "admin" | "user";
  body: string;
  created_at: string;
};

export const formatChatTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });

/** Conversations for the signed-in account holder. */
export function useMyConversations() {
  const { data: user } = useAuthUser();
  return useQuery({
    queryKey: ["support-conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .eq("user_id", user!.id)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportConversation[];
    },
  });
}

/** Every conversation — admin only (RLS allows admins to read all). */
export function useAllConversations() {
  return useQuery({
    queryKey: ["support-conversations-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportConversation[];
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["support-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportMessage[];
    },
  });
}

export function useStartConversation() {
  const { data: user } = useAuthUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subject: string) => {
      const { data, error } = await supabase
        .from("support_conversations")
        .insert({ user_id: user!.id, subject })
        .select("*")
        .single();
      if (error) throw error;
      return data as SupportConversation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-conversations"] });
      qc.invalidateQueries({ queryKey: ["support-conversations-admin"] });
    },
  });
}

export function useSendMessage() {
  const { data: user } = useAuthUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      body,
      senderRole,
    }: {
      conversationId: string;
      body: string;
      senderRole: "admin" | "user";
    }) => {
      const { data, error } = await supabase
        .from("support_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          sender_role: senderRole,
          body,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as SupportMessage;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["support-messages", variables.conversationId] });
      qc.invalidateQueries({ queryKey: ["support-conversations"] });
      qc.invalidateQueries({ queryKey: ["support-conversations-admin"] });
    },
  });
}

export function useSetConversationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SupportStatus }) => {
      const { error } = await supabase
        .from("support_conversations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-conversations"] });
      qc.invalidateQueries({ queryKey: ["support-conversations-admin"] });
    },
  });
}

/** Live updates for messages and conversation status. */
export function useSupportRealtime(conversationId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`support-${conversationId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => {
        if (conversationId) {
          qc.invalidateQueries({ queryKey: ["support-messages", conversationId] });
        }
        qc.invalidateQueries({ queryKey: ["support-conversations"] });
        qc.invalidateQueries({ queryKey: ["support-conversations-admin"] });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_conversations" },
        () => {
          qc.invalidateQueries({ queryKey: ["support-conversations"] });
          qc.invalidateQueries({ queryKey: ["support-conversations-admin"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);
}
