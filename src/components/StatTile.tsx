const tones = {
  navy: "bg-navy text-navy-foreground",
  ember: "bg-ember text-ember-foreground",
  jade: "bg-jade text-jade-foreground",
  sky: "bg-sky text-sky-foreground",
} as const;

export function StatTile({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: keyof typeof tones;
}) {
  return (
    <div className={`tile-stat ${tones[tone]}`}>
      <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide sm:text-sm">{label}</p>
    </div>
  );
}
