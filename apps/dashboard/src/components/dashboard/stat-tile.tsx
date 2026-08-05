import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "@/lib/helpers";

type StatTileProps = {
  label: string;
  value: string;
  /** One line of context under the value — what it is measured against. */
  hint?: ReactNode;
  /** Signed movement against a named earlier period, e.g. `+12.4% vs 2025`. */
  delta?: {
    text: string;
    direction: "up" | "down" | "flat";
  };
  /** Rendered beside the value — a sparkline, a meter. */
  visual?: ReactNode;
  /** The hero tile the page leads with: one per view. */
  emphasis?: boolean;
};

const DELTA_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export const StatTile = ({
  label,
  value,
  hint,
  delta,
  visual,
  emphasis = false,
}: StatTileProps) => {
  const DeltaIcon = delta ? DELTA_ICONS[delta.direction] : null;

  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p
          className={cn(
            "font-semibold tracking-tight",
            emphasis ? "text-5xl" : "text-2xl",
          )}
        >
          {value}
        </p>
        {visual}
      </div>
      {/* Direction is carried by the icon, not by colour, so it survives a
          greyscale print and a colour-blind reader alike. */}
      {delta && DeltaIcon && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <DeltaIcon size={16} aria-hidden />
          {delta.text}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};
