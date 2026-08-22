"use client";

import { RevenueGroupTotals } from "@/app/(dashboard)/revenue-per-revenue-group/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber } from "@/lib/helpers";
import { REVENUE_GROUP_KIND_LABELS } from "@/lib/labels";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: RevenueGroupTotals[];
};

// The material rows are the only ones a margin can be earned on: a freight
// recharge, an allowance and a price difference all move the total without
// being anything to earn a margin on. Totalling them together would print a
// margin nobody made, so the two are subtotalled apart.
const subtotal = (
  rows: RevenueGroupTotals[],
  pick: (row: RevenueGroupTotals) => boolean,
) =>
  rows.filter(pick).reduce(
    (totals, row) => ({
      salesKg: totals.salesKg + row.salesKg,
      revenue: totals.revenue + row.revenue,
      profit: totals.profit + row.profit,
    }),
    { salesKg: 0, revenue: 0, profit: 0 },
  );

export const RevenuePerRevenueGroupTable = ({ rows }: Props) => {
  const material = subtotal(rows, (row) => row.countsTowardMaterialMargin);
  const rest = subtotal(rows, (row) => !row.countsTowardMaterialMargin);

  return (
    <div>
      <div className="space-y-4">
        <div className="flex justify-end">
          <TableExportButton
            tableId="revenue-per-revenue-group-table"
            fileName="revenue-per-revenue-group"
            sheetName="Revenue per revenue group"
          />
        </div>
        <Table id="revenue-per-revenue-group-table">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Revenue group no.</TableHead>
              <TableHead>Revenue group</TableHead>
              <TableHead>Kind</TableHead>
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
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No revenue found.
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
                  <TableCell className="text-muted-foreground">
                    {REVENUE_GROUP_KIND_LABELS[row.kind]}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.salesKg)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(row.revenue)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(row.profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.countsTowardMaterialMargin
                      ? `${row.profitMargin.toFixed(1)}%`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
            {rows.length > 0 && (
              <>
                <TableRow className="font-medium">
                  <TableCell />
                  <TableCell>Material</TableCell>
                  <TableCell />
                  <TableCell className="text-right">
                    {formatNumber(material.salesKg)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(material.revenue)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(material.profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {material.revenue === 0
                      ? "—"
                      : `${((material.profit / material.revenue) * 100).toFixed(1)}%`}
                  </TableCell>
                </TableRow>
                <TableRow className="font-medium">
                  <TableCell />
                  <TableCell>Processing, freight and adjustments</TableCell>
                  <TableCell />
                  <TableCell className="text-right">
                    {formatNumber(rest.salesKg)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(rest.revenue)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatMoney(rest.profit)}
                  </TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
