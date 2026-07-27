"use client";

import { SoldProductNotAdvisedRow } from "@/app/(dashboard)/sold-products-not-advised/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney, formatNumber, yesNo } from "@/lib/helpers";

type Props = {
  rows: SoldProductNotAdvisedRow[];
};

export const SoldProductsNotAdvisedTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Main group</TableHead>
          <TableHead>Product group</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-center">Stock product</TableHead>
          <TableHead className="text-center">Standard product</TableHead>
          <TableHead className="text-right">Avg. monthly cons.</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Sales</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead>Stock U.</TableHead>
          <TableHead>PAC</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={13}
              className="h-24 text-center text-muted-foreground"
            >
              No sold products outside the order recommendation.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.productUuid}>
              <TableCell>{row.mainGroup ?? "—"}</TableCell>
              <TableCell>{row.productGroup ?? "—"}</TableCell>
              <TableCell className="font-medium whitespace-nowrap">
                {row.productCode}
              </TableCell>
              <TableCell>{row.productName}</TableCell>
              <TableCell className="text-center">
                {yesNo(row.stockProduct)}
              </TableCell>
              <TableCell className="text-center">
                {yesNo(row.standardProduct)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.avgMonthlyConsumption)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.revenue)}
              </TableCell>
              <TableCell className="text-right">{formatNumber(row.sales)}</TableCell>
              <TableCell className="text-right">{formatNumber(row.stock)}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.available)}
              </TableCell>
              <TableCell>{row.stockUnit ?? "—"}</TableCell>
              <TableCell>{row.pacClassification ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
