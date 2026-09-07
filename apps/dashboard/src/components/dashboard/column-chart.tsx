"use client";

import { useState } from "react";

import {
  axisTicks,
  ChartValueFormat,
  cn,
  columnPath,
  formatChartTick,
  formatChartValue,
  niceAxisMax,
} from "@/lib/helpers";

const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 260;
const PADDING = { top: 16, right: 8, bottom: 28, left: 62 };
const PLOT_WIDTH = VIEW_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
const MAX_BAR_WIDTH = 24;
/** The surface gap that separates two touching bars — never a stroke. */
const BAR_GAP = 2;
const TICK_COUNT = 4;

const SERIES_FILL = {
  strong: "fill-chart-5",
  muted: "fill-chart-2",
};

const SERIES_SWATCH = {
  strong: "bg-chart-5",
  muted: "bg-chart-2",
};

type ColumnSeries = {
  key: string;
  label: string;
  /** One value per label, in the same order. */
  values: number[];
  tone: "strong" | "muted";
};

type ColumnChartProps = {
  labels: string[];
  series: ColumnSeries[];
  valueFormat: ChartValueFormat;
  /** What the whole plot shows, for a reader who never sees it. */
  ariaLabel: string;
  emptyMessage: string;
};

export const ColumnChart = ({
  labels,
  series,
  valueFormat,
  ariaLabel,
  emptyMessage,
}: ColumnChartProps) => {
  const [activeBand, setActiveBand] = useState<number | null>(null);

  const highest = Math.max(
    0,
    ...series.flatMap((entry) =>
      entry.values.map((value) => Math.max(0, value)),
    ),
  );

  if (highest === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md bg-muted/40 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const axisMax = niceAxisMax(highest);
  const ticks = axisTicks(axisMax, TICK_COUNT);
  const band = PLOT_WIDTH / labels.length;
  const groupWidth = Math.min(
    band * 0.68,
    series.length * MAX_BAR_WIDTH + (series.length - 1) * BAR_GAP,
  );
  const barWidth = (groupWidth - BAR_GAP * (series.length - 1)) / series.length;
  const baseline = PADDING.top + PLOT_HEIGHT;
  // A single series is direct-labelled at its tallest column; two series lean on
  // the legend, the axis and the tooltip instead, which never collide.
  const peakIndex =
    series.length === 1 && series[0]
      ? series[0].values.indexOf(Math.max(...series[0].values))
      : -1;

  return (
    <div className="space-y-3">
      {series.length > 1 && (
        <ul className="flex flex-wrap items-center gap-4">
          {series.map((entry) => (
            <li
              key={entry.key}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  SERIES_SWATCH[entry.tone],
                )}
                aria-hidden
              />
              {entry.label}
            </li>
          ))}
        </ul>
      )}

      {/* The viewBox is 720 x 260 and the svg has no intrinsic height, so a
          full-width card scales the whole drawing — text included — by however
          wide it happens to be. On a 1800px screen that is 2.5x, which turns
          11px axis labels into 28px ones. Capping the width at the design width
          keeps the chart at its own scale and lets it shrink, never grow. */}
      <div className="relative mx-auto w-full" style={{ maxWidth: VIEW_WIDTH }}>
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={ariaLabel}
        >
          {ticks.map((tick) => {
            const y = baseline - (tick / axisMax) * PLOT_HEIGHT;
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  x2={VIEW_WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  strokeWidth={1}
                  className="stroke-border"
                />
                <text
                  x={PADDING.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  className="fill-muted-foreground tabular-nums"
                >
                  {formatChartTick(tick, valueFormat)}
                </text>
              </g>
            );
          })}

          {labels.map((label, index) => {
            const bandStart = PADDING.left + band * index;
            const groupStart = bandStart + (band - groupWidth) / 2;

            return (
              <g key={label + String(index)}>
                {activeBand === index && (
                  <rect
                    x={bandStart}
                    y={PADDING.top}
                    width={band}
                    height={PLOT_HEIGHT}
                    className="fill-muted/60"
                  />
                )}

                {series.map((entry, seriesIndex) => {
                  const value = Math.max(0, entry.values[index] ?? 0);
                  const height = (value / axisMax) * PLOT_HEIGHT;
                  if (height <= 0) {
                    return null;
                  }
                  return (
                    <path
                      key={entry.key}
                      d={columnPath({
                        x: groupStart + seriesIndex * (barWidth + BAR_GAP),
                        y: baseline - height,
                        width: barWidth,
                        height,
                      })}
                      className={SERIES_FILL[entry.tone]}
                    />
                  );
                })}

                {peakIndex === index && series[0] && (
                  <text
                    x={bandStart + band / 2}
                    y={
                      baseline -
                      ((series[0].values[index] ?? 0) / axisMax) * PLOT_HEIGHT -
                      8
                    }
                    textAnchor="middle"
                    fontSize={11}
                    className="fill-foreground"
                  >
                    {formatChartTick(series[0].values[index] ?? 0, valueFormat)}
                  </text>
                )}

                <text
                  x={bandStart + band / 2}
                  y={VIEW_HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={11}
                  className="fill-muted-foreground"
                >
                  {label}
                </text>

                {/* The hit target is the whole band, so a short column is as
                    easy to reach as a tall one — and it takes keyboard focus. */}
                <rect
                  x={bandStart}
                  y={PADDING.top}
                  width={band}
                  height={PLOT_HEIGHT}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${label}: ${series
                    .map(
                      (entry) =>
                        `${entry.label} ${formatChartValue(
                          entry.values[index] ?? 0,
                          valueFormat,
                        )}`,
                    )
                    .join(", ")}`}
                  onMouseEnter={() => setActiveBand(index)}
                  onMouseLeave={() => setActiveBand(null)}
                  onFocus={() => setActiveBand(index)}
                  onBlur={() => setActiveBand(null)}
                />
              </g>
            );
          })}

          <line
            x1={PADDING.left}
            x2={VIEW_WIDTH - PADDING.right}
            y1={baseline}
            y2={baseline}
            strokeWidth={1}
            className="stroke-border"
          />
        </svg>

        {activeBand !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border bg-background px-3 py-2 shadow-sm"
            style={{
              left: `${((PADDING.left + band * (activeBand + 0.5)) / VIEW_WIDTH) * 100}%`,
            }}
          >
            <p className="text-xs font-medium">{labels[activeBand]}</p>
            <ul className="mt-1 space-y-0.5">
              {series.map((entry) => (
                <li
                  key={entry.key}
                  className="flex items-center gap-2 text-xs whitespace-nowrap text-muted-foreground"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      SERIES_SWATCH[entry.tone],
                    )}
                    aria-hidden
                  />
                  {entry.label}
                  <span className="ms-auto text-foreground tabular-nums">
                    {formatChartValue(
                      entry.values[activeBand] ?? 0,
                      valueFormat,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
