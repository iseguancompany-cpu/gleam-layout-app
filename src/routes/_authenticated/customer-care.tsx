import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ChatThread } from "@/components/ChatThread";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatChatTime,
  useMessages,
  useMyConversations,
  useSendMessage,
  useSetConversationStatus,
  useStartConversation,
  useSupportRealtime,
} from "@/lib/support";

export const Route = createFileRoute("/_authenticated/customer-care")({
  head: () => ({
    meta: [
      { title: "Customer Care — Bright Dash" },
      {
        name: "description",
        content: "Start a conversation with our support team, send messages and track whether your request is open or resolved.",
      },
      { property: "og:title", content: "Customer Care — Bright Dash" },
      {
        property: "og:description",
        content: "Chat with support and follow your request from open to resolved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomerCare,
});

function CustomerCare() {
  const { data: conversations = [], isPending } = useMyConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const { data: messages = [], isPending: loadingMessages } = useMessages(activeId);
  useSupportRealtime(activeId);

  const start = useStartConversation();
  const send = useSendMessage();
  const setStatus = useSetConversationStatus();

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0]!.id);
  }, [activeId, conversations]);

  const startConversation = () => {
    start.mutate(subject.trim() || "Support request", {
      onSuccess: (row) => {
        setSubject("");
        setActiveId(row.id);
        toast.success("Conversation started");
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Could not start the conversation"),
    });
  };

  return (
    <AppShell title="Customer Care">
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="rounded-2xl border border-border p-4">
            <label className="text-xs font-bold uppercase text-muted-foreground" htmlFor="subject">
              New conversation
            </label>
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="button"
              disabled={start.isPending}
              onClick={startConversation}
              className="mt-3 w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Start conversation
            </button>
          </div>

          {isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              You have no conversations yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
                      c.id === activeId ? "bg-navy text-navy-foreground" : "bg-secondary hover:bg-accent"
                    }`}
                  >
                    <span className="block truncate text-sm font-bold">{c.subject}</span>
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
                  <p className="truncate text-base font-bold">{active.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    Started {formatChatTime(active.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={active.status === "resolved" ? "completed" : "pending"} />
                  <button
                    type="button"
                    disabled={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate({
                        id: active.id,
                        status: active.status === "open" ? "resolved" : "open",
                      })
                    }
                    className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {active.status === "open" ? "Mark resolved" : "Reopen"}
                  </button>
                </div>
              </div>

              <ChatThread
                messages={messages}
                viewerRole="user"
                isLoading={loadingMessages}
                disabled={active.status === "resolved"}
                sending={send.isPending}
                onSend={(body) =>
                  send.mutate(
                    { conversationId: active.id, body, senderRole: "user" },
                    {
                      onError: (err) =>
                        toast.error(
                          err instanceof Error ? err.message : "Could not send the message",
                        ),
                    },
                  )
                }
              />
            </>
          ) : (
            <div className="rounded-2xl border border-border p-8 text-center">
              <p className="text-base font-bold">Need a hand?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start a conversation and our support team will reply right here.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
