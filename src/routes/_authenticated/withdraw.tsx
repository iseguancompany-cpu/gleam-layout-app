import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
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
  cashtag: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  cardName: string;
  cardLast4: string;
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
    cashtag: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    cardName: "",
    cardLast4: "",
  });
  const [done, setDone] = useState<{
    amount: number;
    id: string;
  } | null>(null);

  const numericAmount = Number(amount) || 0;
  const min = settings?.min_withdrawal ?? 0;
  const withdrawalsEnabled = settings?.withdrawals_enabled ?? true;

  const setDetail = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDetails((d) => ({ ...d, [k]: e.target.value }));

  const closeDone = () => {
    setDone(null);
    setAmount("");
    setType(null);
    setDetails({
      name: "",
      phone: "",
      email: "",
      cashtag: "",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      cardName: "",
      cardLast4: "",
    });
    setStep(1);
  };

  const getMethodSummary = () => {
    if (type === "cashapp") {
      return `Cashtag: ${details.cashtag} · Name: ${details.name}`;
    }
    if (type === "bank") {
      return `Bank: ${details.bankName} · Acc: ${details.accountNumber} · Routing: ${details.routingNumber}`;
    }
    return `Cardholder: ${details.cardName} · Last 4: ${details.cardLast4}`;
  };

  return (
    <AppShell title="Wit
hdraw">
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
              <label className={labelCls} htmlFor="withdraw-amount">
                Amount (USD)
              </label>
              <input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min={min}
                max={available}
                placeholder="0.00"
                required
                className={field}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: {formatUsd(available)} · Minimum: {formatUsd(min)}
              </p>
            </div>

            <button
              type="submit"
              disabled={!withdrawalsEnabled}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          </form>
        )}

        {step === 2 && type && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(
                {
                  amount: numericAmount,
                  method_type: type,
                  method_summary: getMethodSummary(),
                },
                {
                  onSuccess: (row) => {
                    setDone({
                      amount: numericAmount,
                      id: row.id,
                    });
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Could not place withdrawal",
                    ),
                },
              );
            }}
          >
            {/* CASH APP FIELDS */}
            {type === "cashapp" && (
              <>
                <div className="space-y-2">
                  <label className={labelCls}>Cashtag</label>
                  <input
                    required
                    placeholder="$cashtag"
                    className={field}
                    value={details.cashtag}
                    onChange={setDetail("cashtag")}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Recipient Name</label>
                  <input
                    required
                    placeholder="Full Name"
                    className={field}
                    value={details.name}
                    onChange={setDetail("name")}
                  />
                </div>
              </>
            )}

            {/* BANK TRANSFER FIELDS */}
            {type === "bank" && (
              <>
                <div className="space-y-2">
                  <label className={labelCls}>Bank Name</label>
                  <input
                    required
                    placeholder="Chase, Bank of America, etc."
                    className={field}
                    value={details.bankName}
                    onChange={setDetail("bankName")}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Account Holder Name</label>
                  <input
                    required
                    placeholder="Full Legal Name"
                    className={field}
                    value={details.name}
                    onChange={setDetail("name")}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Routing Number</label>
                  <input
                    required
                    placeholder="9-digit Routing Number"
                    className={field}
                    value={details.routingNumber}
                    onChange={setDetail("routingNumber")}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Account Number</label>
                  <input
                    required
                    placeholder="Account Number"
                    className={field}
                    value={details.accountNumber}
                    onChange={setDetail("accountNumber")}
                  />
                </div>
              </>
            )}

            {/* CARD FIELDS */}
            {type === "card" && (
              <>
                <div className="space-y-2">
                  <label className={labelCls}>Cardholder Name</label>
                  <input
                    required
                    placeholder="Name as it appears on card"
                    className={field}
                    value={details.cardName}
                    onChange={setDetail("cardName")}
                  />
                </div>
                <div className="space-y-2">
                  <label
className={labelCls}>Last 4 Digits of Card</label>
                  <input
                    required
                    maxLength={4}
                    placeholder="1234"
                    className={field}
                    value={details.cardLast4}
                    onChange={setDetail("cardLast4")}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className={labelCls}>Phone Number</label>
              <input
                type="tel"
                required
                placeholder="Phone number"
                className={field}
                value={details.phone}
                onChange={setDetail("phone")}
              />
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Email</label>
              <input
                type="email"
                required
                placeholder="Email address"
                className={field}
                value={details.email}
                onChange={setDetail("email")}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 rounded-2xl border border-border py-4 font-bold transition-colors hover:bg-accent"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="w-2/3 rounded-2xl bg-primary py-4 font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {create.isPending ? "Submitting…" : "Confirm Withdrawal"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SUCCESS POPUP */}
      {done && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl text-center">
            {/* Green Success Icon */}
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-500">
              <CircleCheck className="h-9 w-9 text-emerald-600" />
            </div>

            {/* Popup Title */}
            <h2 className="mt-4 text-2xl font-extrabold text-foreground">
              Withdrawal Placed Successfully
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your withdrawal of {formatUsd(done.amount)} has been submitted.
            </p>

            {/* Custom Note Section above the OK button */}
            <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              {/* Note placeholder: tell me what text or elements to place here */}
              <p>Check your email for confirmation.</p>
            </div>

            <button
              type="button"
              onClick={closeDone}
              className="mt-6 w-full rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
