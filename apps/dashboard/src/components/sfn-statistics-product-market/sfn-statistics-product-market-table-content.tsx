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
import { formatNumber } from "@/lib/helpers";

type Props = {
  rows: SfnStatisticRow[];
};

export const SfnStatisticsProductMarketTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>sfn_no</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead>CBS stat no.</TableHead>
          <TableHead>SBI code</TableHead>
          <TableHead>Postal code</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              No SFN statistics found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.sfnNo ?? "—"}</TableCell>
              <TableCell className="text-right">{row.year ?? "—"}</TableCell>
              <TableCell className="text-right">{row.month ?? "—"}</TableCell>
              <TableCell>{row.cbsStatNr ?? "—"}</TableCell>
              <TableCell>{row.sbiCode ?? "—"}</TableCell>
              <TableCell>{row.postalCode ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.weightKg === null ? "—" : formatNumber(row.weightKg)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
