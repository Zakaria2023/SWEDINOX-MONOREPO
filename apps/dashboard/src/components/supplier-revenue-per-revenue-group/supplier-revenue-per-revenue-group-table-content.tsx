"use client";

import { SupplierRevenuePerGroupRow } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber } from "@/lib/helpers";

type Props = {
  rows: SupplierRevenuePerGroupRow[];
};

export const SupplierRevenuePerGroupTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Group no.</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead className="text-right">Weight (kg)</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Avg. € / kg</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              No supplier revenue per revenue group found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="text-right">
                {row.revenueGroupNumber ?? "—"}
              </TableCell>
              <TableCell className="font-medium">
                {row.revenueGroupName ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.year ?? "—"}</TableCell>
              <TableCell className="text-right">{row.month ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.weightKg)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.revenue)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.avgPricePerKg)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
