import { useEffect, useRef, useState } from "react";

import { formatChatTime, type SupportMessage } from "@/lib/support";

/**
 * Message transcript with a composer. `viewerRole` decides which side each
 * bubble sits on: your own messages are always on the right.
 */
export function ChatThread({
  messages,
  viewerRole,
  isLoading,
  disabled,
  onSend,
  sending,
  placeholder = "Write a message…",
}: {
  messages: SupportMessage[];
  viewerRole: "admin" | "user";
  isLoading?: boolean;
  disabled?: boolean;
  onSend: (body: string) => void;
  sending?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const submit = () => {
    const body = text.trim();
    if (!body || sending) return;
    onSend(body);
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="max-h-[52vh] min-h-[240px] space-y-3 overflow-y-auto bg-muted/30 p-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello and our team will reply here.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === viewerRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card ${
                      mine
                        ? "bg-navy text-navy-foreground"
                        : "bg-card text-card-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  <p
                    className={`mt-1 text-[11px] text-muted-foreground ${
                      mine ? "text-right" : "text-left"
                    }`}
                  >
                    {m.sender_role === "admin" ? "Support" : "You"
                      .replace("You", mine ? "You" : "Account holder")}
                    {" · "}
                    {formatChatTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          ref={inputRef}
          rows={2}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={disabled ? "This conversation is resolved" : placeholder}
          className="min-h-[46px] flex-1 resize-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || sending || text.trim().length === 0}
          className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
