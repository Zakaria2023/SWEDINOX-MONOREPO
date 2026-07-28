"use client";

import { SfnStatisticRow } from "@/app/(dashboard)/sfn-statistics-product-market/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatNumber, orDash } from "@/lib/helpers";

type Props = {
  rows: SfnStatisticRow[];
};

export const SfnStatisticsTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead>CBS commodity no.</TableHead>
          <TableHead>SBI code</TableHead>
          <TableHead>Postal code</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No invoiced goods to report.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="text-right tabular-nums">
                {row.year ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.month ?? "—"}
              </TableCell>
              {/* A missing statistical code is the thing that blocks the
                  return, so it is called out rather than dashed away. */}
              <TableCell
                className={
                  row.cbsStatNr ? "font-medium" : "text-destructive italic"
                }
              >
                {row.cbsStatNr ?? "Not set"}
              </TableCell>
              <TableCell
                className={row.sbiCode ? undefined : "text-destructive italic"}
              >
                {row.sbiCode ?? "Not set"}
              </TableCell>
              <TableCell>{orDash(row.postalCode)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(row.weightKg)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
