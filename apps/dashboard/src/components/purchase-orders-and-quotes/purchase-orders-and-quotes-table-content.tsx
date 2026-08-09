"use client";

import { PurchaseOrderQuoteRow } from "@/app/(dashboard)/purchase-orders-and-quotes/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  purchaseOrderStatusLabel,
} from "@/lib/helpers";
import { TableExportButton } from "@/components/ui/table-export-button";

type Props = {
  rows: PurchaseOrderQuoteRow[];
};

export const PurchaseOrdersAndQuotesTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="purchase-orders-and-quotes-table"
          fileName="purchase-orders-and-quotes"
          sheetName="Purchase orders and quotes"
        />
      </div>
      <Table id="purchase-orders-and-quotes-table">
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Number</TableHead>
            <TableHead>Creation date</TableHead>
            <TableHead>Purchaser</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-24 text-center text-muted-foreground"
              >
                No purchase orders or quotes found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.kind}</TableCell>
                <TableCell className="text-right">{row.id ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.createdAt)}
                </TableCell>
                <TableCell>{row.purchaser ?? "—"}</TableCell>
                <TableCell>{purchaseOrderStatusLabel(row.status)}</TableCell>
                <TableCell>{row.reference ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {row.supplierName ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.weightKg)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatMoney(row.revenue)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
