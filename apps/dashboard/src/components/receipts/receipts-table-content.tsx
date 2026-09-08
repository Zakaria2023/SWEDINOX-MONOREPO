"use client";

import { ReceiptRow } from "@/app/(dashboard)/receipts/actions";
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
  rows: ReceiptRow[];
};

export const ReceiptsTable = ({ rows }: Props) => (
  <div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <TableExportButton
          tableId="receipts-table"
          fileName="receipts"
          sheetName="Receipts"
        />
      </div>
      <Table id="receipts-table">
        <TableHeader>
          <TableRow>
            <TableHead>Receipt date</TableHead>
            <TableHead>Company code</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Kg</TableHead>
            <TableHead>Order no</TableHead>
            <TableHead>Receipt status</TableHead>
            <TableHead className="text-right">
              Material still to receive
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-24 text-center text-muted-foreground"
              >
                No receipts found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.receiptDate ?? "—"}</TableCell>
                <TableCell>{row.companyCode ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {row.companyName ?? "—"}
                </TableCell>
                <TableCell>
                  {[row.productCode, row.productName]
                    .filter(Boolean)
                    .join(" — ") || "—"}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.qty)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(row.kg)}
                </TableCell>
                <TableCell>{row.purchaseOrderCode ?? "—"}</TableCell>
                <TableCell>{row.receiptStatus ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(row.materialStillToInvoice)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);
