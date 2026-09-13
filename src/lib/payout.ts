import { payoutLabels, type PayoutType } from "@/lib/api";

export type PayoutMethodRow = {
  id: string;
  type: PayoutType;
  label: string | null;
  holder_name: string | null;
  cashtag: string | null;
  bank_name: string | null;
  account_number_last4: string | null;
  card_last4: string | null;
  card_expiry: string | null;
};

export function summarizeMethod(m: PayoutMethodRow): string {
  if (m.type === "cashapp") return `Cash App ${m.cashtag ?? ""}`.trim();
  if (m.type === "bank")
    return `${m.bank_name ?? "Bank"} ••••${m.account_number_last4 ?? "0000"}`;
  return `Card ••••${m.card_last4 ?? "0000"}`;
}

export function methodTitle(m: PayoutMethodRow): string {
  return m.label?.trim() || payoutLabels[m.type];
}

export const last4 = (value: string) => value.replace(/\D/g, "").slice(-4);
