"use client";

import { RevenueGroupPeriodTotals } from "@/app/(dashboard)/revenue-per-revenue-group-period/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber, formatPercent } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: RevenueGroupPeriodTotals[];
};

export const RevenuePerRevenueGroupPeriodTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="revenue-per-revenue-group-period-table"
          fileName="revenue-per-revenue-group-period"
          sheetName="Revenue per revenue group (period)"
        />
      </div>
      <Table id="revenue-per-revenue-group-period-table">
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Order type</TableHead>
            <TableHead className="text-right">Revenue group no.</TableHead>
            <TableHead>Revenue group</TableHead>
            <TableHead className="text-right">Sales (kg)</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit margin (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-muted-foreground"
              >
                No revenue found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={`${row.period}-${row.orderType}-${index}`}>
                <TableCell className="font-medium">{row.period}</TableCell>
                <TableCell>{row.orderType}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.revenueGroupNumber ?? "—"}
                </TableCell>
                <TableCell>{row.revenueGroupName ?? "Ungrouped"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.salesKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {formatMoney(row.profit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(row.profitMargin)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
