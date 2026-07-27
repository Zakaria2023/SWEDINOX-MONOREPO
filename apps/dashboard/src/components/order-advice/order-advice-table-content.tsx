"use client";

import { OrderAdviceRow } from "@/app/(dashboard)/order-advice/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { cn, formatCoverageMonths, formatNumber } from "@/lib/helpers";

type Props = {
  rows: OrderAdviceRow[];
};

export const OrderAdviceTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Main group</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Reserved</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead className="text-right">To be received</TableHead>
          <TableHead className="text-right">Econ. stock</TableHead>
          <TableHead className="text-right">Avg. monthly cons.</TableHead>
          <TableHead className="text-right">Cons. prev. year</TableHead>
          <TableHead className="text-right">Econ. coverage</TableHead>
          <TableHead className="text-right">Tech. coverage</TableHead>
          <TableHead className="text-right">Min level</TableHead>
          <TableHead className="text-right">Max level</TableHead>
          <TableHead className="text-right">Advice qty</TableHead>
          <TableHead className="text-right">Order qty</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={17}
              className="h-24 text-center text-muted-foreground"
            >
              No order advice found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.productUuid}
              className={cn(row.orderQty > 0 && "bg-amber-50")}
            >
              <TableCell className="font-medium whitespace-nowrap">
                {row.productCode}
              </TableCell>
              <TableCell>{row.productName}</TableCell>
              <TableCell>{row.mainGroup ?? "—"}</TableCell>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.technicalStock)}
              </TableCell>
              <TableCell className="text-right">{formatNumber(row.reserved)}</TableCell>
              <TableCell className="text-right">{formatNumber(row.available)}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.toBeReceived)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.economicStock)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.avgMonthlyConsumption)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.consumptionPreviousYear)}
              </TableCell>
              <TableCell className="text-right">
                {formatCoverageMonths(row.economicCoverage)}
              </TableCell>
              <TableCell className="text-right">
                {formatCoverageMonths(row.technicalCoverage)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.minStockLevel)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.maxStockLevel)}
              </TableCell>
              <TableCell className="text-right">{formatNumber(row.adviceQty)}</TableCell>
              <TableCell
                className={cn(
                  "text-right whitespace-nowrap",
                  row.orderQty > 0 && "font-semibold text-amber-700",
                )}
              >
                {formatNumber(row.orderQty)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
