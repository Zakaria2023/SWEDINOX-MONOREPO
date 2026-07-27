"use client";

import { PurchaseLineItem } from "@/app/(dashboard)/purchase-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ORDER_LINE_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  lines: PurchaseLineItem[];
};

export const PurchaseLinesTable = ({ lines }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date created</TableHead>
          <TableHead className="text-right">Purchase order</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Quality</TableHead>
          <TableHead>Stock category</TableHead>
          <TableHead>Options</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Width</TableHead>
          <TableHead className="text-right">Qty(p)</TableHead>
          <TableHead>U</TableHead>
          <TableHead className="text-right">Reserved</TableHead>
          <TableHead className="text-right">Kg(pur)</TableHead>
          <TableHead>Receipt date</TableHead>
          <TableHead>Purchaser</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={18}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase lines found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString("en-GB")}
              </TableCell>
              <TableCell className="text-right font-medium">
                {row.purchaseOrderId ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>
                {row.status ? ORDER_LINE_STATUS_LABELS[row.status] : "—"}
              </TableCell>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell>{row.qualityCode ?? "—"}</TableCell>
              <TableCell>{row.stockCategory ?? "—"}</TableCell>
              <TableCell>{row.options ?? "—"}</TableCell>
              <TableCell className="text-right">{row.lengthMm ?? "—"}</TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">{row.qtyPlanned}</TableCell>
              <TableCell>{row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}</TableCell>
              <TableCell className="text-right">{row.reservedQty}</TableCell>
              <TableCell className="text-right">{row.kgPurchased}</TableCell>
              <TableCell>{row.receiptDate ?? "—"}</TableCell>
              <TableCell>{row.purchaser ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
