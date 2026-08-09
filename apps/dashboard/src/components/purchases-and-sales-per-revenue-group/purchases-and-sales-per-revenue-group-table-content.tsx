"use client";

import { PurchasesAndSalesRow } from "@/app/(dashboard)/purchases-and-sales-per-revenue-group/actions";
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
  rows: PurchasesAndSalesRow[];
};

export const PurchasesAndSalesPerRevenueGroupTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="purchases-and-sales-per-revenue-group-table"
          fileName="purchases-and-sales-per-revenue-group"
          sheetName="Purchases and sales per revenue group"
        />
      </div>
      <Table id="purchases-and-sales-per-revenue-group-table">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Revenue group no.</TableHead>
            <TableHead>Revenue group</TableHead>
            <TableHead className="text-right">Year</TableHead>
            <TableHead className="text-right">Month</TableHead>
            <TableHead className="text-right">Purchase (kg)</TableHead>
            <TableHead className="text-right">Purchase revenue</TableHead>
            <TableHead className="text-right">Weight</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit %</TableHead>
            <TableHead className="text-right">Avg. Sales Price/Kg</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={11}
                className="h-24 text-center text-muted-foreground"
              >
                No data found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-right">
                  {row.revenueGroupNumber ?? "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {row.revenueGroupName ?? "Ungrouped"}
                </TableCell>
                <TableCell className="text-right">{row.year ?? "—"}</TableCell>
                <TableCell className="text-right">{row.month ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.purchaseKg)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.purchaseRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weight)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.profit)}
                </TableCell>
                <TableCell className="text-right">
                  {row.profitMargin.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.avgSalesPricePerKg)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
