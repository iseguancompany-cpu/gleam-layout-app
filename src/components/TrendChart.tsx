import { balanceTrend } from "@/lib/demo-data";

export function TrendChart() {
  const max = Math.max(...balanceTrend.map((d) => d.value));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold">Balance activity</h2>
        <span className="text-xs text-muted-foreground">Last 6 months</span>
      </div>
      <div className="mt-5 flex h-40 items-end gap-2 sm:gap-4">
        {balanceTrend.map((d) => (
          <div key={d.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-navy/85 transition-all hover:bg-navy"
              style={{ height: `${Math.round((d.value / max) * 100)}%` }}
              title={`${d.month}: $${d.value.toLocaleString("en-US")}`}
            />
            <span className="text-[11px] font-semibold text-muted-foreground">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
