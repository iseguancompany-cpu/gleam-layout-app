function WithdrawalDetailsModal({
  withdrawal,
  onClose,
}: {
  withdrawal: WithdrawalRow;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isPending = withdrawal.status === "pending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular Warning Icon */}
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-500">
          <span className="text-3xl font-extrabold leading-none">!</span>
        </div>

        {/* Title & Amount Subtitle */}
        <h2 className="mt-4 text-2xl font-extrabold text-foreground">
          {isPending ? "Withdrawal Pending" : `Withdrawal ${withdrawal.status.toUpperCase()}`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPending
            ? `Waiting for your ${formatUsd(Number(withdrawal.amount))} withdrawal to process.`
            : `Your withdrawal of ${formatUsd(Number(withdrawal.amount))} is ${withdrawal.status}.`}
        </p>

        {/* Details Card */}
        <div className="mt-5 space-y-2 rounded-2xl border border-border bg-muted/20 p-4 text-left text-xs sm:text-sm">
          <div className="flex justify-between gap-2">
            <span className="font-semibold text-muted-foreground">Request ID</span>
            <span className="font-mono text-xs font-bold text-foreground truncate max-w-[200px]">
              {withdrawal.id}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="font-semibold text-muted-foreground">Status</span>
            <span className="font-bold capitalize text-foreground">{withdrawal.status}</span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="font-semibold text-muted-foreground">Submitted</span>
            <span className="text-muted-foreground">
              {new Date(withdrawal.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Admin Note / Reason */}
          {withdrawal.admin_note?.trim() && (
            <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-primary">
                Admin Note
              </span>
              <p className="mt-1 text-xs sm:text-sm text-foreground">
                {withdrawal.admin_note}
              </p>
            </div>

)}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full max-w-[140px] rounded-xl bg-navy px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          OK
        </button>
      </div>
    </div>
  );
}

