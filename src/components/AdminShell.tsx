import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useIsAdmin } from "@/lib/auth";

const navItems = [
  { title: "Users", to: "/admin/users" },
  { title: "Transactions", to: "/admin/approvals" },
  { title: "Wallet Address", to: "/admin/cash" },
  { title: "Supports", to: "/admin/support" },
  { title: "Control Panel", to: "/admin" },
] as const;

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin, isPending } = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AppShell title={title}>
      {/* Top Admin Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 rounded-xl mb-4">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-md hover:bg-secondary text-foreground"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          ADMIN PANEL
        </span>
      </div>

      {/* Vertical Navigation Links */}
      <nav
        className={`${
          mobileMenuOpen ? "block" : "hidden md:block"
        } mb-6 space-y-1 rounded-xl border border-border bg-card p-2 shadow-sm`}
      >
        {navItems.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-emerald-100 text-emerald-900 font-bold"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <div>
        {isPending ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Checking access…</p>
        ) : isAdmin ? (
          children
        ) : (
          <div className="rounded-2xl border border-border p-6 text-center">
            <p className="text-base font-bold">Administrator access required</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account does not have permission to view this area.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 inline-block rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-navy-foreground"
            >
              Back to dashboard
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
