"use client";

import {
  ScorecardRow,
  ScorecardStatus,
  ScorecardTrend,
} from "@/app/(dashboard)/balanced-scorecard/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { cn } from "@/lib/helpers";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

type Props = {
  rows: ScorecardRow[];
};

const STATUS_STYLES: Record<ScorecardStatus, string> = {
  on_target: "bg-green-500",
  warning: "bg-amber-500",
  off_target: "bg-red-500",
};

const TrendIcon = ({ trend }: { trend: ScorecardTrend }) => {
  if (trend === "up") {
    return <ArrowUp className="size-4 text-green-600" />;
  }
  if (trend === "down") {
    return <ArrowDown className="size-4 text-red-600" />;
  }
  return <ArrowRight className="size-4 text-muted-foreground" />;
};

export const BalancedScorecardTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>KPI</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Target</TableHead>
          <TableHead>U.</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>{row.category}</TableCell>
            <TableCell className="font-medium">{row.kpi}</TableCell>
            <TableCell className="text-right">{row.value.toFixed(2)}</TableCell>
            <TableCell className="text-right">
              {row.target.toFixed(2)}
            </TableCell>
            <TableCell>{row.unit}</TableCell>
            <TableCell>
              <span
                className={cn(
                  "inline-block size-3 rounded-full",
                  STATUS_STYLES[row.status],
                )}
                aria-label={row.status}
              />
            </TableCell>
            <TableCell>
              <TrendIcon trend={row.trend} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
