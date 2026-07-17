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

type Props = {
  rows: RevenueVsBudgetRow[];
};

const money = (value: number) =>
  `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const number = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export const RevenueVsBudgetTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Revenue group no.</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead className="text-right">Weight</TableHead>
          <TableHead className="text-right">Weight Budget</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Revenue Budget</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit budget</TableHead>
          <TableHead className="text-right">Profit %</TableHead>
          <TableHead className="text-right">Profit % Budget</TableHead>
          <TableHead className="text-right">Avg. Sales Price</TableHead>
          <TableHead className="text-right">Avg. Sales Price Budget</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={12}
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
              <TableCell className="text-right">{number(row.weight)}</TableCell>
              <TableCell className="text-right">
                {number(row.weightBudget)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenue)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.revenueBudget)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.profit)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.profitBudget)}
              </TableCell>
              <TableCell className="text-right">
                {row.profitMargin.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right">
                {row.profitMarginBudget.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.avgSalesPrice)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.avgSalesPriceBudget)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
