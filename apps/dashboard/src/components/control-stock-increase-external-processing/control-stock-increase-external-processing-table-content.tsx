"use client";

import Link from "next/link";
import { StockIncreaseExtProcessingRow } from "@/app/(dashboard)/control-stock-increase-external-processing/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { cn, formatDateValue, formatMoney, formatNumber } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: StockIncreaseExtProcessingRow[];
};

type SignedProps = {
  value: number | null;
  format: (value: number) => string;
};

/**
 * A signed measure, with the outbound leg marked.
 *
 * The list carries both legs of the trip to the processor, so a negative figure
 * is metal leaving rather than an error. Colouring it is the only way to read
 * the two apart at a glance when the rows are interleaved by date.
 */
const SignedCell = ({ value, format }: SignedProps) => {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={cn("tabular-nums", value < 0 && "text-muted-foreground")}>
      {format(value)}
    </span>
  );
};

export const StockIncreaseExternalProcessingTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="control-stock-increase-external-processing-table"
          fileName="control-stock-increase-external-processing"
          sheetName="Control: Stock Increase due to External Processing"
        />
      </div>
      <Table id="control-stock-increase-external-processing-table">
        <TableHeader>
          <TableRow>
            <TableHead>Product code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Company code</TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="text-right">Financial year</TableHead>
            <TableHead className="text-right">Financial month</TableHead>
            <TableHead>GLA# Stock Increase ext.edit.</TableHead>
            <TableHead>GLA Stock Increase ext.edit.</TableHead>
            <TableHead>Mutation date / time</TableHead>
            <TableHead className="text-right">Mutation qty (€)</TableHead>
            <TableHead className="text-right">Mutation qty (StkU)</TableHead>
            <TableHead>StkU</TableHead>
            <TableHead className="text-right">Mutation qty (kg)</TableHead>
            <TableHead className="text-right">Revenue group #</TableHead>
            <TableHead>Revenue group</TableHead>
            <TableHead className="text-right">Order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={16}
                className="h-24 text-center text-muted-foreground"
              >
                No stock increases due to external processing.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">
                  {row.productCode ?? "—"}
                </TableCell>
                <TableCell>{row.description ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.companyCode ?? "—"}
                </TableCell>
                <TableCell>{row.companyName ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.financialYear ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.financialPeriod ?? "—"}
                </TableCell>
                <TableCell>{row.glAccountNumber}</TableCell>
                <TableCell>{row.glAccountName}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.mutationDateTime)}
                </TableCell>
                <TableCell className="text-right">
                  <SignedCell
                    value={row.mutationValueEur}
                    format={formatMoney}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <SignedCell value={row.mutationQty} format={formatNumber} />
                </TableCell>
                {/* Printed as stored: this is the product's stock unit
                    (`ST`, `KG`), which the reference prints verbatim in its
                    `StkU` column. */}
                <TableCell>{row.stockUnit ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <SignedCell value={row.mutationKg} format={formatNumber} />
                </TableCell>
                <TableCell className="text-right">
                  {row.revenueGroupNumber ?? "—"}
                </TableCell>
                <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.purchaseOrderUuid && row.purchaseOrderId !== null ? (
                    <Link
                      href={`/purchase-orders/${row.purchaseOrderUuid}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {row.purchaseOrderId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
