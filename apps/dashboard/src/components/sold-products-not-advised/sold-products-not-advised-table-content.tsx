"use client";

import { SoldProductNotAdvisedRow } from "@/app/(dashboard)/sold-products-not-advised/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
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
  rows: SoldProductNotAdvisedRow[];
};

export const SoldProductsNotAdvisedTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="sold-products-not-advised-table"
          fileName="sold-products-not-advised"
          sheetName="Sold products not on the order recommendation"
        />
      </div>
      <Table id="sold-products-not-advised-table">
        <TableHeader>
          <TableRow>
            <TableHead>Main group</TableHead>
            <TableHead>Product group</TableHead>
            <TableHead>Product code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Stock product</TableHead>
            <TableHead className="text-center">Standard product</TableHead>
            <TableHead className="text-right">
              Avg. Monthly consumption last year (Stk.U.)
            </TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Stock (Stk.U.)</TableHead>
            <TableHead className="text-right">Available (StkU)</TableHead>
            <TableHead>Stock U.</TableHead>
            <TableHead>PAC-Code</TableHead>
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
                  <Checkbox checked={row.stockProduct ?? false} disabled />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={row.standardProduct ?? false} disabled />
                </TableCell>
                <TableCell className="text-right">
                  {row.avgMonthlyConsumption === null
                    ? "—"
                    : formatNumber(row.avgMonthlyConsumption)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.sales)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.stock)}
                </TableCell>
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
  </div>
);
