"use client";

import { StockHistoryRow } from "@/app/(dashboard)/stock-history/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

type Props = {
  rows: StockHistoryRow[];
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

export const StockHistoryTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Revenue group no.</TableHead>
          <TableHead>Revenue group</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Stock (Kg)</TableHead>
          <TableHead className="text-right">PriceU</TableHead>
          <TableHead className="text-right">Stock (Stk.U.)</TableHead>
          <TableHead className="text-right">Stock (€)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="h-24 text-center text-muted-foreground"
            >
              No stock found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="text-right">
                {row.revenueGroupNumber ?? "—"}
              </TableCell>
              <TableCell>{row.revenueGroupName ?? "Ungrouped"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.length ?? "—"}</TableCell>
              <TableCell className="text-right">{number(row.stockKg)}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.pricePerUnit)}
              </TableCell>
              <TableCell className="text-right">
                {number(row.stockQty)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {money(row.stockEuro)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
