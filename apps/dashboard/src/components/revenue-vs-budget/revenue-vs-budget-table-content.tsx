"use client";

import { RevenueVsBudgetRow } from "@/app/(dashboard)/revenue-vs-budget/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { MONTHS } from "@/lib/constants";
import { RevenueVsBudgetView } from "@/lib/enums";
import { formatMoney, formatNumber } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: RevenueVsBudgetRow[];
  view: RevenueVsBudgetView;
};

export const RevenueVsBudgetTable = ({ rows, view }: Props) => {
  const byMonth = view === "month";
  const columnCount = byMonth ? 17 : 18;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="revenue-vs-budget-table"
          fileName="revenue-vs-budget"
          sheetName="Revenue w.r.t. Budget"
        />
      </div>
      <Table id="revenue-vs-budget-table">
        <TableHeader>
          <TableRow>
            {byMonth ? (
              <TableHead>Month</TableHead>
            ) : (
              <>
                <TableHead className="text-right">Revenue group no.</TableHead>
                <TableHead>Revenue group</TableHead>
              </>
            )}
            <TableHead className="text-right">Weight</TableHead>
            <TableHead className="text-right">Weight Budget</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Revenue Budget</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Profit budget</TableHead>
            <TableHead className="text-right">Profit %</TableHead>
            <TableHead className="text-right">Profit % Budget</TableHead>
            <TableHead className="text-right">Avg. Sales Price/Kg</TableHead>
            <TableHead className="text-right">
              Avg. Sales Price/Kg Budget
            </TableHead>
            {/* The budget's own three columns, each against its actual. */}
            <TableHead className="text-right">Revenue Stk</TableHead>
            <TableHead className="text-right">Budget Stk</TableHead>
            <TableHead className="text-right">Revenue CD</TableHead>
            <TableHead className="text-right">Budget CD</TableHead>
            <TableHead className="text-right">Revenue EXW</TableHead>
            <TableHead className="text-right">Budget EXW</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-24 text-center text-muted-foreground"
              >
                No sales and no budget in this period.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                {byMonth ? (
                  <TableCell className="font-medium">
                    {row.month === null ? "—" : MONTHS[row.month - 1]}
                  </TableCell>
                ) : (
                  <>
                    <TableCell className="text-right">
                      {row.revenueGroupNumber ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.revenueGroupName ?? "Ungrouped"}
                    </TableCell>
                  </>
                )}
                <TableCell className="text-right">
                  {formatNumber(row.weight)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weightBudget)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenueBudget)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.profit)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.profitBudget)}
                </TableCell>
                <TableCell className="text-right">
                  {row.profitMargin.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  {row.profitMarginBudget.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.avgSalesPrice)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.avgSalesPriceBudget)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenueStock)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenueStockBudget)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenueCrossDock)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenueCrossDockBudget)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenueFactory)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenueFactoryBudget)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
