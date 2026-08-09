"use client";

import { CustomerRevenueRow } from "@/app/(dashboard)/customer-revenue/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: CustomerRevenueRow[];
};

export const CustomerRevenueTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="customer-revenue-table"
          fileName="customer-revenue"
          sheetName="Customer revenue"
        />
      </div>
      <Table id="customer-revenue-table">
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Debtor number</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="text-right">Month</TableHead>
            <TableHead className="text-right">Year</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit margin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="h-24 text-center text-muted-foreground"
              >
                No customer revenue found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {row.customerName ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.customerCode ?? "—"}
                </TableCell>
                <TableCell>{row.city ?? "—"}</TableCell>
                <TableCell>{row.country ?? "—"}</TableCell>
                <TableCell className="text-right">{row.month ?? "—"}</TableCell>
                <TableCell className="text-right">{row.year ?? "—"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weightKg)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.profit)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.profitMargin)}%
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
