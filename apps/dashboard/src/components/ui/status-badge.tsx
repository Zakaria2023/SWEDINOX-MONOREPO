import { cn, statusTone, StatusTone } from "@/lib/helpers";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  active: "border-primary/25 bg-primary/10 text-primary",
  done: "border-emerald-600/25 bg-emerald-500/10 text-emerald-700",
  attention: "border-amber-600/25 bg-amber-500/10 text-amber-700",
  critical: "border-destructive/25 bg-destructive/10 text-destructive",
};

const DOT_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  active: "bg-primary",
  done: "bg-emerald-600",
  attention: "bg-amber-600",
  critical: "bg-destructive",
};

type StatusBadgeProps = {
  /** The stored status. Its own words decide the colour. */
  value: string | null | undefined;
  /** What the reader sees. Falls back to the stored value. */
  label?: string | null;
  className?: string;
};

// A status as a pill rather than a word in a column of words. The label always
// says what the state is — the colour and the dot only make it findable, so a
// reader who cannot tell the tones apart loses nothing.
export const StatusBadge = ({ value, label, className }: StatusBadgeProps) => {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  const tone = statusTone(value);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", DOT_CLASS[tone])}
        aria-hidden
      />
      {label ?? value}
    </span>
  );
};
