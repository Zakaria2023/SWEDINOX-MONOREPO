import { sparklineEndPoint, sparklinePath } from "@/lib/helpers";

type SparklineProps = {
  values: number[];
  /** What the line plots, for readers who never see it. */
  label: string;
};

const WIDTH = 120;
const HEIGHT = 32;
const PADDING = 4;

export const Sparkline = ({ values, label }: SparklineProps) => {
  if (values.length < 2) {
    return null;
  }

  const innerWidth = WIDTH - PADDING * 2;
  const innerHeight = HEIGHT - PADDING * 2;
  const path = sparklinePath(values, innerWidth, innerHeight);
  const end = sparklineEndPoint(values, innerWidth, innerHeight);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-8 w-30"
      role="img"
      aria-label={label}
    >
      <g transform={`translate(${PADDING} ${PADDING})`}>
        <path
          d={path}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-chart-2"
        />
        {/* The current month, ringed in the surface colour so it stays legible
            where the line doubles back under it. */}
        <circle
          cx={end.x}
          cy={end.y}
          r={4}
          strokeWidth={2}
          className="fill-chart-5 stroke-background"
        />
      </g>
    </svg>
  );
};
