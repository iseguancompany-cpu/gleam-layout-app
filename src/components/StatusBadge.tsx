const styles: Record<string, string> = {
  completed: "bg-jade/15 text-jade",
  approved: "bg-jade/15 text-jade",
  deposit: "bg-jade/15 text-jade",
  pending: "bg-ember/15 text-ember",
  declined: "bg-destructive/10 text-destructive",
  rejected: "bg-destructive/10 text-destructive",
};

const labels: Record<string, string> = { rejected: "declined" };

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
        styles[status] ?? "bg-secondary text-secondary-foreground"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
