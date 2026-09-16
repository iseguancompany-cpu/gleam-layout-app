import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import {
  formatUsd,
  payoutLabels,
  useAccountSummary,
  useCreateWithdrawal,
  useSettings,
  type PayoutType,
} from "@/lib/api";

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

type Details = {
  name: string;
  phone: string;
  email: string;
  address: string;
  loadingCode: string;
};

function Withdraw() {
  const { data: settings } = useSettings();
  const { available, balance, pending } = useAccountSummary();
  const create = useCreateWithdrawal();

  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<PayoutType | null>(null);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState<Details>({
    name: "",
    phone: "",
    email: "",
    address: "",
    loadingCode: "",
  });
  const [done, setDone] = useState<{
    amount: number;
    summary: string;
    id: string;
    status: string;
    createdAt: string;
  } | null>(null);

  const numericAmount = Number(amount) || 0;
  const min = settings?.min_withdrawal ?? 0;
  const withdrawalsEnabled = settings?.withdrawals_enabled ?? true;

  const setDetail = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDetails((d) => ({ ...d, [k]: e.target.value }));

  if (done) {
    return (
      <AppShell title="Withdraw">
        <div className="mx-auto max-w-xl p-4 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold">Withdrawal Pending</h2>
            <div className="mt-6 space-y-4 rounded-xl border border-border p-4 text-sm w-full max-w-md text-left">
              <p className="text-center font-semibold">
                Your withdrawal of {formatUsd(done.amount)} is pending review.
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Your withdrawal is being reviewed, please check your email for further information.
              </p>
              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Request ID</dt>
                  <dd className="font-mono text-xs font-bold">{done.id}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-bold capitalize">{done.status}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="font-semibold">{done.summary}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd className="text-xs text-muted-foreground">
                    {new Date(done.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => {
                setDone(null);
                setAmount("");
                setType(null);
                setDetails({ name: "", phone: "", email: "", address: "", loadingCode: "" });
                setStep(1);
              }}
              className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Done
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

        <p className="text-sm font-semibold text-muted-foreground">Step {step} of 2</p>

        {step === 1 && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!type) {
                toast.error("Choose how you wish to withdraw");
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
              setStep(2);
            }}
          >
            <div className="rounded-2xl bg-sky p-5">
              <p className="mb-4 font-bold text-sky-foreground">How do you wish to withdraw?</p>
              <div className="grid grid-cols-2 gap-3">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-2xl px-4 py-5 text-sm font-bold transition-colors ${
                      type === t
                        ? "bg-navy text-navy-foreground"
                        : "bg-card text-card-foreground hover:bg-accent"
                    }`}
                  >
                    {payoutLabels[t]}
                  </button>
                ))}
              </div>
            </div>

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
              disabled={!type || !amount || !withdrawalsEnabled}
              className="w-full rounded-xl bg-navy px-6 py-3 font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {withdrawalsEnabled ? "Continue" : "Withdrawals are paused"}
            </button>
          </form>
        )}

        {step === 2 && type && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const summaryParts = [
                `${payoutLabels[type]}`,
                details.name && `Name: ${details.name}`,
                details.phone && `Phone: ${details.phone}`,
                details.email && `Email: ${details.email}`,
                details.address && `Address: ${details.address}`,
                details.loadingCode && `Loading Code: ${details.loadingCode}`,
              ]
                .filter(Boolean)
                .join(" · ");

              create.mutate(
                {
                  amount: numericAmount,
                  method_type: type,
                  method_summary: summaryParts,
                  payout_method_id: null,
                },
                {
                  onSuccess: (row) =>
                    setDone({
                      amount: Number(row.amount),
                      summary: row.method_summary || summaryParts,
                      id: row.id,
                      status: row.status,
                      createdAt: row.created_at,
                    }),
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Could not place withdrawal"),
                },
              );
            }}
          >
            <div className="space-y-2">
              <label className={labelCls}>Full name</label>
              <input required className={field} value={details.name} onChange={setDetail("name")} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Phone number</label>
              <input
                required
                type="tel"
                className={field}
                value={details.phone}
                onChange={setDetail("phone")}
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Email address</label>
              <input
                required
                type="email"
                className={field}
                value={details.email}
                onChange={setDetail("email")}
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Address</label>
              <input required className={field} value={details.address} onChange={setDetail("address")} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Loading Code</label>
              <input
                required
                className={field}
                value={details.loadingCode}
                onChange={setDetail("loadingCode")}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={create.isPending}
                className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-navy-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {create.isPending ? "Submitting…" : "Continue"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl bg-secondary px-6 py-3 text-sm font-bold transition-colors hover:bg-accent"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
