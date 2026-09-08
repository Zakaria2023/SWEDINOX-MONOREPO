"use client";

import { PurchaseResultRow } from "@/app/(dashboard)/purchase-results/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateColumn, formatMoney } from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: PurchaseResultRow[];
};

export const PurchaseResultsTable = ({ rows }: Props) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <TableExportButton
        tableId="purchase-results-table"
        fileName="purchase-results"
        sheetName="Purchase results"
      />
    </div>
    <Table id="purchase-results-table">
      <TableHeader>
        <TableRow>
          <TableHead>Main group</TableHead>
          <TableHead>Subgroup</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Year</TableHead>
          <TableHead className="text-right">Month</TableHead>
          <TableHead>Receipt date</TableHead>
          <TableHead className="text-right">Purchase value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase results found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{row.mainGroup ?? "—"}</TableCell>
              <TableCell>{row.subgroup ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.year ?? "—"}</TableCell>
              <TableCell className="text-right">{row.month ?? "—"}</TableCell>
              <TableCell>{formatDateColumn(row.receiptDate)}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.purchaseValue)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
