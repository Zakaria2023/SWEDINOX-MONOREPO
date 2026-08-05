import Link from "next/link";

import { ChartValueFormat, cn, formatChartValue } from "@/lib/helpers";

/**
 * The ordinal ramp: one hue, light to dark, for rows that carry a natural order
 * (ageing buckets, order statuses). Its lightest step still clears the surface,
 * so no row reads as background.
 */
const ORDINAL_FILL = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

const UNIFORM_FILL = "bg-chart-4";

type BarListItem = {
  key: string;
  label: string;
  value: number;
  /** Sits under the label — the count behind an amount, a share, a status. */
  meta?: string;
  href?: string;
};

type BarListProps = {
  items: BarListItem[];
  valueFormat: ChartValueFormat;
  /** `ordinal` shades the rows light → dark; use it only where order means something. */
  tone?: "uniform" | "ordinal";
  emptyMessage: string;
};

export const BarList = ({
  items,
  valueFormat,
  tone = "uniform",
  emptyMessage,
}: BarListProps) => {
  if (items.length === 0) {
    return (
      <p className="rounded-md bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  // Bars are drawn against the largest row, so the shortest row is still
  // visible; the number beside each one carries the value itself.
  const widest = Math.max(...items.map((item) => Math.abs(item.value)), 0);

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const share = widest === 0 ? 0 : (Math.abs(item.value) / widest) * 100;
        const fill =
          tone === "ordinal"
            ? (ORDINAL_FILL[index % ORDINAL_FILL.length] ?? UNIFORM_FILL)
            : UNIFORM_FILL;

        return (
          <li key={item.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="line-clamp-1 text-sm">
                {item.href ? (
                  <Link href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {formatChartValue(item.value, valueFormat)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-2 rounded-full", fill)}
                style={{ width: `${share > 0 ? Math.max(share, 2) : 0}%` }}
              />
            </div>
            {item.meta && (
              <p className="text-xs text-muted-foreground">{item.meta}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
};
