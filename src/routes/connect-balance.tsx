import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/connect-balance")({
  head: () => ({
    meta: [
      { title: "Connect Balance — Cash Loading Portal" },
      { name: "description", content: "Link an external account so its balance appears alongside your portal balance." },
      { property: "og:title", content: "Connect Balance — Cash Loading Portal" },
      { property: "og:description", content: "Link an external account to your portal balance." },
    ],
  }),
  component: ConnectBalance,
});

const providers = ["Cash App", "Bank Account", "Card"];

function ConnectBalance() {
  const [connected, setConnected] = useState<string[]>(["Bank Account"]);

  return (
    <AppShell title="Connect Balance">
      <div className="grid max-w-2xl gap-3">
        {providers.map((p) => {
          const isOn = connected.includes(p);
          return (
            <div
              key={p}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{p}</p>
                <p className="text-xs text-muted-foreground">{isOn ? "Connected" : "Not connected"}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConnected((prev) => (isOn ? prev.filter((x) => x !== p) : [...prev, p]));
                  toast.success(isOn ? `${p} disconnected` : `${p} connected`);
                }}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  isOn ? "bg-secondary hover:bg-accent" : "bg-navy text-navy-foreground hover:opacity-90"
                }`}
              >
                {isOn ? "Disconnect" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
