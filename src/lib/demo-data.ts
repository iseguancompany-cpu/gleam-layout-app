export const account = {
  name: "Sabrina Mackins",
  email: "sabrina.mackins@example.com",
  country: "United States",
  referrer: "Admin",
  memberSince: "Mar 2024",
  balance: 10210,
  pendingWithdrawals: 0,
  totalWithdrawals: 0,
  totalDeposits: 230,
  activeCards: 2,
};

export const formatUsd = (value: number) =>
  `$ ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type Activity = {
  id: string;
  label: string;
  date: string;
  amount: number;
  type: "deposit" | "withdrawal" | "transfer";
  status: "completed" | "pending" | "declined";
};

export const activity: Activity[] = [
  { id: "TX-10241", label: "Deposit · Bank transfer", date: "Sep 09, 2026", amount: 120, type: "deposit", status: "completed" },
  { id: "TX-10236", label: "Withdrawal · Cash App", date: "Sep 06, 2026", amount: 340, type: "withdrawal", status: "pending" },
  { id: "TX-10228", label: "Transfer · Connected balance", date: "Sep 02, 2026", amount: 75, type: "transfer", status: "completed" },
  { id: "TX-10219", label: "Deposit · Card top-up", date: "Aug 28, 2026", amount: 110, type: "deposit", status: "completed" },
  { id: "TX-10203", label: "Withdrawal · Bank transfer", date: "Aug 21, 2026", amount: 480, type: "withdrawal", status: "declined" },
  { id: "TX-10188", label: "Deposit · Referral bonus", date: "Aug 14, 2026", amount: 45, type: "deposit", status: "completed" },
];

export const payouts = [
  { id: "PO-882", method: "Cash App", date: "Sep 06, 2026", amount: 340, status: "pending" as const },
  { id: "PO-861", method: "Bank Transfer", date: "Aug 30, 2026", amount: 900, status: "completed" as const },
  { id: "PO-844", method: "Card", date: "Aug 12, 2026", amount: 250, status: "completed" as const },
];

export const balanceTrend = [
  { month: "Apr", value: 6200 },
  { month: "May", value: 7100 },
  { month: "Jun", value: 6850 },
  { month: "Jul", value: 8400 },
  { month: "Aug", value: 9600 },
  { month: "Sep", value: 10210 },
];
