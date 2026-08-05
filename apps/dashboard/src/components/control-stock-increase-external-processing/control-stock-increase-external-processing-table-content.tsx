"use client";

import { StockIncreaseExtProcessingRow } from "@/app/(dashboard)/control-stock-increase-external-processing/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue, formatNumber } from "@/lib/helpers";

type Props = {
  rows: StockIncreaseExtProcessingRow[];
};

export const StockIncreaseExternalProcessingTable = ({ rows }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Company code</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="text-right">Financial year</TableHead>
          <TableHead className="text-right">Financial period</TableHead>
          <TableHead>GLA# Stock Increase</TableHead>
          <TableHead>GLA Stock Increase ext.edit.</TableHead>
          <TableHead>Mutation date / time</TableHead>
          <TableHead className="text-right">Mutation qty (p)</TableHead>
          <TableHead className="text-right">Mutation qty (a)</TableHead>
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
              <TableCell className="text-muted-foreground">—</TableCell>
              <TableCell className="text-muted-foreground">—</TableCell>
              <TableCell className="text-right">
                {row.financialYear ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.financialPeriod ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">—</TableCell>
              <TableCell className="text-muted-foreground">—</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.mutationDateTime)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.mutationQty ?? 0))}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(Number(row.mutationQty ?? 0))}
              </TableCell>
              <TableCell>{row.stockUnit ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                —
              </TableCell>
              <TableCell className="text-right">
                {row.revenueGroupNumber ?? "—"}
              </TableCell>
              <TableCell>{row.revenueGroupName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.orderId ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
