"use client";

import { OrderAdviceRow } from "@/app/(dashboard)/order-advice/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableExportButton } from "@/components/ui/table-export-button";
import { cn, formatNumber } from "@/lib/helpers";

type Props = {
  rows: OrderAdviceRow[];
};

const COLUMN_COUNT = 18;

const orDash = (value: number | null) =>
  value === null ? "—" : formatNumber(value);

const sum = (rows: OrderAdviceRow[], pick: (row: OrderAdviceRow) => number) =>
  rows.reduce((total, row) => total + pick(row), 0);

// Coverage is a duration, so a column of them totals to nothing meaningful.
// The reference system averages these two and sums the rest, and its footer
// says so — "AVR=" against the coverages, "Σ=" against everything else.
const average = (
  rows: OrderAdviceRow[],
  pick: (row: OrderAdviceRow) => number | null,
) => {
  const values = rows
    .map(pick)
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
};

export const OrderAdviceTable = ({ rows }: Props) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <TableExportButton tableId="order-advice-table" fileName="order-advice" />
    </div>

    <div className="overflow-x-auto">
      <Table id="order-advice-table">
        <TableHeader>
          <TableRow>
            <TableHead>Product code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Main group</TableHead>
            <TableHead className="text-right">Stock (Pur.U.)</TableHead>
            <TableHead className="text-right">Reserved</TableHead>
            <TableHead className="text-right">Available (Kg)</TableHead>
            <TableHead className="text-right">
              To be received short term (Kg)
            </TableHead>
            <TableHead className="text-right">Econ. stock (Kg)</TableHead>
            <TableHead className="text-right">
              Avg. Monthly consumption last year (Kg)
            </TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">
              Consumption previous month (Kg)
            </TableHead>
            <TableHead className="text-right">
              Avg. Monthly consumption last 3 years (Kg)
            </TableHead>
            <TableHead className="text-right">Advice Weight rounded</TableHead>
            <TableHead className="text-right">Economic Coverage</TableHead>
            <TableHead className="text-right">Technical Coverage</TableHead>
            <TableHead>Stock product</TableHead>
            <TableHead className="text-right">Advice Qty. (Pur.U.)</TableHead>
            <TableHead className="text-right">OrderQty (Pur.U.)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="text-muted-foreground h-24 text-center"
              >
                No stock products to advise on.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.productUuid}
                // A line with something to buy is the reason the buyer opened
                // this screen, so it is picked out of a page of zeroes.
                className={cn(
                  (row.orderQtyPurchaseUnit ?? 0) > 0 && "bg-amber-50",
                )}
              >
                <TableCell className="font-medium">{row.productCode}</TableCell>
                <TableCell>{row.description ?? "—"}</TableCell>
                <TableCell>{row.mainGroup ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(row.stockPurchaseUnit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.reservedKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.availableKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.toBeReceivedShortTermKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.economicStockKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.avgMonthlyConsumptionLastYearKg)}
                </TableCell>
                <TableCell>{row.supplierName ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.consumptionPreviousMonthKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.avgMonthlyConsumptionLast3YearsKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.adviceWeightRounded)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(row.economicCoverage)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(row.technicalCoverage)}
                </TableCell>
                <TableCell>
                  <Checkbox checked={row.stockProduct ?? false} disabled />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(row.adviceQtyPurchaseUnit)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    (row.orderQtyPurchaseUnit ?? 0) > 0 &&
                      "font-semibold text-amber-700",
                  )}
                >
                  {orDash(row.orderQtyPurchaseUnit)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} />
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.stockPurchaseUnit ?? 0))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.reservedKg))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.availableKg))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.toBeReceivedShortTermKg))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.economicStockKg))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.avgMonthlyConsumptionLastYearKg))}`}
              </TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.consumptionPreviousMonthKg))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.avgMonthlyConsumptionLast3YearsKg))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.adviceWeightRounded))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(() => {
                  const value = average(rows, (row) => row.economicCoverage);
                  return value === null ? "—" : `AVR=${formatNumber(value)}`;
                })()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(() => {
                  const value = average(rows, (row) => row.technicalCoverage);
                  return value === null ? "—" : `AVR=${formatNumber(value)}`;
                })()}
              </TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.adviceQtyPurchaseUnit ?? 0))}`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`Σ=${formatNumber(sum(rows, (row) => row.orderQtyPurchaseUnit ?? 0))}`}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  </div>
);
