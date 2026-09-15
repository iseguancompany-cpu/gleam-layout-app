import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  User,
  ArrowDownToLine,
  Info,
  QrCode,
  History,
  Receipt,
  Link2,
  CreditCard,
  LogOut,
  MessageCircle,
  Menu,
  X,
  Power,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { formatUsd, useProfile, useAccountSummary } from "@/lib/api";
import { useIsAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", to: "/profile", icon: User },
  { title: "Withdraw", to: "/withdraw", icon: ArrowDownToLine },
  { title: "Support and Privacy", to: "/support", icon: Info },
  { title: "Payment Address", to: "/payment-address", icon: QrCode },
  { title: "Recent Payouts", to: "/payouts", icon: Receipt },
  { title: "Transaction History", to: "/transactions", icon: History },
  { title: "Connect Balance", to: "/connect-balance", icon: Link2 },
  { title: "Card", to: "/card", icon: CreditCard },
] as const;

function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin } = useIsAdmin();
  const signOut = useSignOut();

  const items = [
    ...navItems,
    ...(isAdmin ? [{ title: "Admin Dashboard", to: "/admin", icon: ShieldCheck } as const] : []),
  ];

  return (
    <nav className="flex flex-col gap-2 p-4">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
              active
                ? "bg-navy text-navy-foreground shadow-card"
                : "bg-card text-card-foreground shadow-card hover:bg-accent"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          void signOut();
        }}
        className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 text-sm font-semibold shadow-card transition-colors hover:bg-accent"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>Logout</span>
      </button>
    </nav>
  );
}

function BalancePanel() {
  const { balance } = useAccountSummary();
  return (
    <div className="border-b border-border/60 px-6 py-6 text-center">
      <p className="text-sm text-muted-foreground">My Balance</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatUsd(balance)}</p>
    </div>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const { balance } = useAccountSummary();
  const signOut = useSignOut();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const displayName = profile?.full_name?.trim() || profile?.email || "My account";

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-40 bg-topbar text-topbar-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-1 transition-opacity hover:opacity-70 lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <User className="hidden h-5 w-5 shrink-0 lg:block" />
            <span className="truncate text-sm font-bold sm:text-base">{displayName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold sm:inline">
              Balance: {formatUsd(balance)}
            </span>
            <button
              type="button"
              aria-label="Log out"
              onClick={() => void signOut()}
              className="rounded-md p-1 transition-opacity hover:opacity-70"
            >
              <Power className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl">
        <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-72 shrink-0 overflow-y-auto bg-sidebar text-sidebar-foreground lg:block">
          <BalancePanel />
          <NavList />
        </aside>

        {open && (
          <div className="fixed inset-0 top-[56px] z-30 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setOpen(false)}
            />
            <div className="relative h-full w-[76%] max-w-xs overflow-y-auto bg-secondary shadow-tile">
              <BalancePanel />
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-3 sm:p-6">
          <div className="rounded-2xl bg-card p-4 shadow-card sm:p-6">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            <div className="mt-5">{children}</div>
          </div>
        </main>
      </div>

      <Link
        to="/customer-care"
        aria-label="Contact support"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-700"
      >
        <MessageCircle className="h-6 w-6" />
      </Link>
    </div>
  );
}
