import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { usePayoutMethods } from "@/lib/api";
import { methodTitle, summarizeMethod, type PayoutMethodRow } from "@/lib/payout";

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

function PaymentAddress() {
  const { data: methods = [] } = usePayoutMethods();

  return (
    <AppShell title="Payment Address">
      {(methods as PayoutMethodRow[]).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No payout destinations saved yet.{" "}
          <Link to="/withdraw" className="font-bold text-foreground underline">
            Add one
          </Link>
          .
        </div>
      ) : (
        <div className="grid max-w-2xl gap-3">
          {(methods as PayoutMethodRow[]).map((m) => {
            const value = summarizeMethod(m);
            return (
              <div
                key={m.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-4"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{methodTitle(m)}</p>
                  <p className="truncate text-sm font-semibold">{value}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Copy ${methodTitle(m)}`}
                  onClick={() => {
                    void navigator.clipboard.writeText(value);
                    toast.success("Copied");
                  }}
                  className="shrink-0 rounded-lg bg-secondary p-2 transition-colors hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
