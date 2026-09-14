import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { useIsAdmin } from "@/lib/auth";

const tabs = [
  { title: "Overview", to: "/admin" },
  { title: "Users", to: "/admin/users" },
  { title: "Approvals", to: "/admin/approvals" },
  { title: "Cash Loading", to: "/admin/cash" },
] as const;

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin, isPending } = useIsAdmin();

  return (
    <AppShell title={title}>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                active ? "bg-navy text-navy-foreground" : "bg-secondary hover:bg-accent"
              }`}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>

      <div className="mt-5">
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
