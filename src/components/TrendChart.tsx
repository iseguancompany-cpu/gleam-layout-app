export type TrendPoint = { label: string; value: number };

export function TrendChart({
  data,
  title = "Balance activity",
  caption = "Last 6 months",
}: {
  data: TrendPoint[];
  title?: string;
  caption?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const empty = data.every((d) => d.value === 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        <span className="text-xs text-muted-foreground">{caption}</span>
      </div>
      {empty ? (
        <p className="mt-8 mb-8 text-center text-sm text-muted-foreground">
          No activity yet — this chart fills in as money moves on your account.
        </p>
      ) : (
        <div className="mt-5 flex h-40 items-end gap-2 sm:gap-4">
          {data.map((d) => (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-navy/85 transition-all hover:bg-navy"
                style={{ height: `${Math.max(2, Math.round((d.value / max) * 100))}%` }}
                title={`${d.label}: $${d.value.toLocaleString("en-US")}`}
              />
              <span className="text-[11px] font-semibold text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
