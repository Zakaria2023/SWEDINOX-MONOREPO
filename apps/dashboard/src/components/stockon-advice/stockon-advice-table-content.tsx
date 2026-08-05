"use client";

import { StockOnAdviceRow } from "@/app/(dashboard)/stockon-advice/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { LEAD_TIME_METHOD_LABELS } from "@/lib/labels";
import { cn, formatNumber, yesNo } from "@/lib/helpers";

type Props = {
  rows: StockOnAdviceRow[];
};

export const StockOnAdviceTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Main group</TableHead>
          <TableHead>Preferred supplier</TableHead>
          <TableHead className="text-right">Techn. stk.</TableHead>
          <TableHead className="text-right">Reserved</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead className="text-right">To be received</TableHead>
          <TableHead className="text-right">Econ. stock</TableHead>
          <TableHead className="text-right">Avg. monthly cons.</TableHead>
          <TableHead className="text-right">Lead time (d)</TableHead>
          <TableHead className="text-right">Review (d)</TableHead>
          <TableHead>Lead time method</TableHead>
          <TableHead className="text-right">Order level</TableHead>
          <TableHead className="text-right">Stock − order level</TableHead>
          <TableHead className="text-right">% diff.</TableHead>
          <TableHead className="text-right">To order</TableHead>
          <TableHead className="text-center">Evaluate today?</TableHead>
          <TableHead className="text-center">Order now?</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={19}
              className="h-24 text-center text-muted-foreground"
            >
              No StockOn advice found. Enable “Use StockOp for this product” on a
              stock product’s group to see it here.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.productUuid}
              className={cn(row.orderNow && "bg-amber-50")}
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
              <TableCell className="text-right">{row.leadTimeDays}</TableCell>
              <TableCell className="text-right">
                {row.reviewPeriodDays}
              </TableCell>
              <TableCell>{LEAD_TIME_METHOD_LABELS[row.leadTimeMethod]}</TableCell>
              <TableCell className="text-right">{formatNumber(row.orderLevel)}</TableCell>
              <TableCell className="text-right">
                {formatNumber(row.stockMinusOrderLevel)}
              </TableCell>
              <TableCell className="text-right">
                {row.pctDifference === null
                  ? "—"
                  : `${row.pctDifference.toFixed(0)}%`}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right whitespace-nowrap",
                  row.toOrder > 0 && "font-semibold text-amber-700",
                )}
              >
                {formatNumber(row.toOrder)}
              </TableCell>
              <TableCell className="text-center">
                {yesNo(row.evaluateToday)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-center",
                  row.orderNow && "font-semibold text-amber-700",
                )}
              >
                {yesNo(row.orderNow)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
