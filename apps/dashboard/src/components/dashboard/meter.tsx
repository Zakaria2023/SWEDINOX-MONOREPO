import { formatPercentOneDecimal } from "@/lib/helpers";

type MeterProps = {
  label: string;
  /** 0–100. Anything outside that is clamped, never drawn past the track. */
  percent: number;
  /** What the filled part of the track stands for. */
  caption?: string;
};

export const Meter = ({ label, percent, caption }: MeterProps) => {
  const filled = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium tabular-nums">
          {formatPercentOneDecimal(filled)}
        </span>
      </div>
      {/* The unfilled track is a lighter step of the same ramp, so the state
          reads across the whole bar rather than only where it is filled. */}
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={filled}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-2 rounded-full bg-chart-4"
          style={{ width: `${filled}%` }}
        />
      </div>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
};
