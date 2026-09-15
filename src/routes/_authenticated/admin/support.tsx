import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { ChatThread } from "@/components/ChatThread";
import { StatusBadge } from "@/components/StatusBadge";
import { useAdminUsers } from "@/lib/api";
import {
  formatChatTime,
  useAllConversations,
  useMessages,
  useSendMessage,
  useSetConversationStatus,
  useSupportRealtime,
  type SupportStatus,
} from "@/lib/support";

export const Route = createFileRoute("/_authenticated/admin/support")({
  head: () => ({
    meta: [
      { title: "Customer Care — Admin — Bright Dash" },
      {
        name: "description",
        content: "Read support conversations, reply to account holders in real time and mark threads open or resolved.",
      },
      { property: "og:title", content: "Customer Care — Admin — Bright Dash" },
      {
        property: "og:description",
        content: "Reply to account holders and manage support conversation status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSupport,
});

const filters: (SupportStatus | "all")[] = ["open", "resolved", "all"];

function AdminSupport() {
  const { data: conversations = [], isPending } = useAllConversations();
  const { data: users = [] } = useAdminUsers();
  const [filter, setFilter] = useState<SupportStatus | "all">("open");
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const { data: messages = [], isPending: loadingMessages } = useMessages(activeId);
  useSupportRealtime(activeId);

  const send = useSendMessage();
  const setStatus = useSetConversationStatus();

  const rows = filter === "all" ? conversations : conversations.filter((c) => c.status === filter);

  const nameFor = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u?.full_name?.trim() || u?.email || "Unknown user";
  };

  return (
    <AdminShell title="Customer Care">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase transition-colors ${
              filter === f ? "bg-navy text-navy-foreground" : "bg-secondary hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section>
          {isPending ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading conversations…</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No conversations here right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
                      c.id === activeId ? "bg-navy text-navy-foreground" : "bg-secondary hover:bg-accent"
                    }`}
                  >
                    <span className="block truncate text-sm font-bold">{nameFor(c.user_id)}</span>
                    <span className="block truncate text-xs opacity-80">{c.subject}</span>
                    <span className="mt-0.5 block text-[11px] opacity-80">
                      {c.status === "resolved" ? "Resolved" : "Open"} ·{" "}
                      {formatChatTime(c.last_message_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 space-y-3">
          {active ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{nameFor(active.user_id)}</p>
                  <p className="truncate text-xs text-muted-foreground">{active.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={active.status === "resolved" ? "completed" : "pending"} />
                  <button
                    type="button"
                    disabled={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate(
                        {
                          id: active.id,
                          status: active.status === "open" ? "resolved" : "open",
                        },
                        {
                          onSuccess: () =>
                            toast.success(
                              active.status === "open"
                                ? "Conversation marked resolved"
                                : "Conversation reopened",
                            ),
                          onError: (err) =>
                            toast.error(
                              err instanceof Error ? err.message : "Could not update the status",
                            ),
                        },
                      )
                    }
                    className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {active.status === "open" ? "Mark resolved" : "Reopen"}
                  </button>
                </div>
              </div>

              <ChatThread
                messages={messages}
                viewerRole="admin"
                isLoading={loadingMessages}
                sending={send.isPending}
                placeholder="Reply to the account holder…"
                onSend={(body) =>
                  send.mutate(
                    { conversationId: active.id, body, senderRole: "admin" },
                    {
                      onError: (err) =>
                        toast.error(err instanceof Error ? err.message : "Could not send the reply"),
                    },
                  )
                }
              />
            </>
          ) : (
            <div className="rounded-2xl border border-border p-8 text-center">
              <p className="text-base font-bold">Select a conversation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a thread on the left to read the history and reply.
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
