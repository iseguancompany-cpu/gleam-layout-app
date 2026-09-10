const styles = {
  completed: "bg-jade/15 text-jade",
  pending: "bg-ember/15 text-ember",
  declined: "bg-destructive/10 text-destructive",
} as const;

export function StatusBadge({ status }: { status: keyof typeof styles }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}
