import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/payment-address")({
  head: () => ({
    meta: [
      { title: "Payment Address — Cash Loading Portal" },
      { name: "description", content: "Saved payout destinations for your account, ready to copy." },
      { property: "og:title", content: "Payment Address — Cash Loading Portal" },
      { property: "og:description", content: "Saved payout destinations for your account." },
    ],
  }),
  component: PaymentAddress,
});

const addresses = [
  { label: "Cash App tag", value: "$sabrina.demo" },
  { label: "Bank account", value: "•••• •••• 4821 — Demo Bank" },
  { label: "Card on file", value: "•••• •••• •••• 7734" },
];

function PaymentAddress() {
  return (
    <AppShell title="Payment Address">
      <div className="grid max-w-2xl gap-3">
        {addresses.map((a) => (
          <div
            key={a.label}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-4"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-muted-foreground">{a.label}</p>
              <p className="truncate text-sm font-semibold">{a.value}</p>
            </div>
            <button
              type="button"
              aria-label={`Copy ${a.label}`}
              onClick={() => {
                void navigator.clipboard?.writeText(a.value);
                toast.success("Copied to clipboard");
              }}
              className="shrink-0 rounded-lg bg-secondary p-2 transition-colors hover:bg-accent"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
