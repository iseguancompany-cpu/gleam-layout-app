import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import {
  formatUsd,
  payoutLabels,
  useAccountSummary,
  useAddPayoutMethod,
  useCreateWithdrawal,
  useDeletePayoutMethod,
  usePayoutMethods,
  useSettings,
  type PayoutType,
} from "@/lib/api";
import { last4, methodTitle, summarizeMethod, type PayoutMethodRow } from "@/lib/payout";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Cash Loading Portal" },
      {
        name: "description",
        content: "Choose a payout method and place a withdrawal request from your balance.",
      },
      { property: "og:title", content: "Withdraw — Cash Loading Portal" },
      { property: "og:description", content: "Choose a payout method and place a withdrawal request." },
    ],
  }),
  component: Withdraw,
});

const field =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "text-sm font-bold";
const types: PayoutType[] = ["cashapp", "bank", "card"];

function AddMethodForm({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState<PayoutType>("cashapp");
  const [values, setValues] = useState<Record<string, string>>({});
  const add = useAddPayoutMethod();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <form
      className="space-y-4 rounded-2xl border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const base = {
          type,
          label: values["label"] ?? "",
          holder_name: values["holder_name"] ?? "",
        };
        const payload =
          type === "cashapp"
            ? { ...base, cashtag: values["cashtag"] ?? "", contact_email: values["contact_email"] ?? null }
            : type === "bank"
              ? {
                  ...base,
                  bank_name: values["bank_name"] ?? "",
                  account_number_last4: last4(values["account_number"] ?? ""),
                  bank_identifier: values["bank_identifier"] ?? null,
                  bank_country: values["bank_country"] ?? null,
                  bank_notes: values["bank_notes"] ?? null,
                }
              : {
                  ...base,
                  card_last4: last4(values["card_number"] ?? ""),
                  card_expiry: values["card_expiry"] ?? "",
                  billing_zip: values["billing_zip"] ?? "",
                };
        add.mutate(payload, {
          onSuccess: () => {
            toast.success("Payout method saved");
            setValues({});
            onDone();
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save method"),
        });
      }}
    >
      <div className="grid grid-cols-3 gap-2">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl px-3 py-3 text-xs font-bold transition-colors sm:text-sm ${
              type === t ? "bg-navy text-navy-foreground" : "bg-secondary hover:bg-accent"
            }`}
          >
            {payoutLabels[t]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className={labelCls}>Nickname</label>
        <input className={field} placeholder="My main payout" value={values["label"] ?? ""} onChange={set("label")} />
      </div>
      <div className="space-y-2">
        <label className={labelCls}>Account holder name</label>
        <input
          required
          className={field}
          value={values["holder_name"] ?? ""}
          onChange={set("holder_name")}
        />
      </div>

      {type === "cashapp" && (
        <>
          <div className="space-y-2">
            <label className={labelCls}>$Cashtag</label>
            <input required className={field} placeholder="$yourtag" value={values["cashtag"] ?? ""} onChange={set("cashtag")} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Contact email (optional)</label>
            <input type="email" className={field} value={values["contact_email"] ?? ""} onChange={set("contact_email")} />
          </div>
        </>
      )}

      {type === "bank" && (
        <>
          <div className="space-y-2">
            <label className={labelCls}>Bank name</label>
            <input required className={field} value={values["bank_name"] ?? ""} onChange={set("bank_name")} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Account number</label>
            <input
              required
              inputMode="numeric"
              className={field}
              value={values["account_number"] ?? ""}
              onChange={set("account_number")}
            />
            <p className="text-xs text-muted-foreground">Only the last 4 digits are stored.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={labelCls}>Routing / SWIFT</label>
              <input className={field} value={values["bank_identifier"] ?? ""} onChange={set("bank_identifier")} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Bank country</label>
              <input className={field} value={values["bank_country"] ?? ""} onChange={set("bank_country")} />
            </div>
          </div>
        </>
      )}

      {type === "card" && (
        <>
          <div className="space-y-2">
            <label className={labelCls}>Card number</label>
            <input
              required
              inputMode="numeric"
              className={field}
              value={values["card_number"] ?? ""}
              onChange={set("card_number")}
            />
            <p className="text-xs text-muted-foreground">
              Only the last 4 digits are stored — never the full number, and no security code is asked for.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={labelCls}>Expiry (MM/YY)</label>
              <input required className={field} placeholder="09/29" value={values["card_expiry"] ?? ""} onChange={set("card_expiry")} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Billing ZIP</label>
              <input className={field} value={values["billing_zip"] ?? ""} onChange={set("billing_zip")} />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={add.isPending}
          className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {add.isPending ? "Saving…" : "Save payout method"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl bg-secondary px-5 py-3 text-sm font-bold transition-colors hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Withdraw() {
  const { data: methods = [] } = usePayoutMethods();
  const { data: settings } = useSettings();
  const { available, balance, pending } = useAccountSummary();
  const create = useCreateWithdrawal();
  const remove = useDeletePayoutMethod();

  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState(false);
  const [done, setDone] = useState<{ amount: number; summary: string } | null>(null);

  const method = (methods as PayoutMethodRow[]).find((m) => m.id === selected) ?? null;
  const numericAmount = Number(amount) || 0;
  const min = settings?.min_withdrawal ?? 0;
  const withdrawalsEnabled = settings?.withdrawals_enabled ?? true;

  if (done) {
    return (
      <AppShell title="Withdrawal">
        <div className="max-w-lg">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-sky text-sky-foreground">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold">Withdrawal Placed Successfully</h2>
          <div className="mt-6 rounded-xl border border-border p-4 text-center text-sm">
            Your withdrawal of {formatUsd(done.amount)} via {done.summary} has been placed. You will see it
            under Recent Payouts while it is reviewed.
          </div>
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setReview(false);
              setAmount("");
            }}
            className="mt-4 w-full rounded-xl bg-sky px-6 py-3 font-bold text-sky-foreground transition-opacity hover:opacity-90"
          >
            OK
          </button>
        </div>
      </AppShell>
    );
  }

  if (review && method) {
    return (
      <AppShell title="Review withdrawal">
        <div className="max-w-lg space-y-5">
          <dl className="space-y-3 rounded-2xl border border-border p-5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-bold">{formatUsd(numericAmount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Method</dt>
              <dd className="font-semibold">{summarizeMethod(method)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Fees</dt>
              <dd className="font-semibold">None</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">You receive</dt>
              <dd className="font-bold">{formatUsd(numericAmount)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={create.isPending}
              onClick={() =>
                create.mutate(
                  {
                    amount: numericAmount,
                    method_type: method.type,
                    method_summary: summarizeMethod(method),
                    payout_method_id: method.id,
                  },
                  {
                    onSuccess: () => setDone({ amount: numericAmount, summary: summarizeMethod(method) }),
                    onError: (err) =>
                      toast.error(err instanceof Error ? err.message : "Could not place withdrawal"),
                  },
                )
              }
              className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {create.isPending ? "Placing…" : "Confirm withdrawal"}
            </button>
            <button
              type="button"
              onClick={() => setReview(false)}
              className="rounded-xl bg-secondary px-6 py-3 text-sm font-bold transition-colors hover:bg-accent"
            >
              Back
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Withdraw">
      <div className="max-w-2xl space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { l: "Balance", v: balance },
            { l: "Pending", v: pending },
            { l: "Available", v: available },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">{s.l}</p>
              <p className="mt-1 text-lg font-extrabold">{formatUsd(s.v)}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold">Your payout methods</h2>
            {!adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold transition-colors hover:bg-accent"
              >
                <Plus className="h-4 w-4" /> Add method
              </button>
            )}
          </div>

          {adding && <AddMethodForm onDone={() => setAdding(false)} />}

          {(methods as PayoutMethodRow[]).length === 0 && !adding ? (
            <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              Add a Cash App tag, bank account or card to receive your payouts.
            </p>
          ) : (
            <ul className="grid gap-3">
              {(methods as PayoutMethodRow[]).map((m) => (
                <li
                  key={m.id}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-4 transition-colors ${
                    selected === m.id ? "border-navy bg-secondary" : "border-border"
                  }`}
                >
                  <button type="button" className="min-w-0 text-left" onClick={() => setSelected(m.id)}>
                    <p className="truncate text-sm font-bold">{methodTitle(m)}</p>
                    <p className="truncate text-xs text-muted-foreground">{summarizeMethod(m)}</p>
                  </button>
                  <button
                    type="button"
                    aria-label="Remove payout method"
                    onClick={() => {
                      remove.mutate(m.id, {
                        onSuccess: () => {
                          if (selected === m.id) setSelected(null);
                          toast.success("Payout method removed");
                        },
                      });
                    }}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!method) {
              toast.error("Choose a payout method first");
              return;
            }
            if (numericAmount < min) {
              toast.error(`Minimum withdrawal is ${formatUsd(min)}`);
              return;
            }
            if (numericAmount > available) {
              toast.error("Amount exceeds your available balance");
              return;
            }
            setReview(true);
          }}
        >
          <div className="space-y-2">
            <label className={labelCls} htmlFor="amount">
              Amount to withdraw
            </label>
            <input
              id="amount"
              type="number"
              min={min || 1}
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={field}
            />
            <p className="text-xs text-muted-foreground">
              Available: {formatUsd(available)} · No fees are charged on withdrawals.
            </p>
          </div>
          <button
            type="submit"
            disabled={!method || !amount || !withdrawalsEnabled}
            className="w-full rounded-xl bg-navy px-6 py-3 font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {withdrawalsEnabled ? "Review withdrawal" : "Withdrawals are paused"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
