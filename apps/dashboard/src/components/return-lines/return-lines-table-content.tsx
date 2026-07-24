"use client";

import { ReturnLineItem } from "@/app/(dashboard)/return-lines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMoney } from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  RETURN_ORDER_REASON_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  lines: ReturnLineItem[];
};

export const ReturnLinesTable = ({ lines }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Return</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Line status</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>QtyU</TableHead>
          <TableHead className="text-right">Return Qty</TableHead>
          <TableHead>Return reason</TableHead>
          <TableHead className="text-right">Net price</TableHead>
          <TableHead className="text-right">Cost price</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit margin</TableHead>
          <TableHead>Delivery date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={17}
              className="h-24 text-center text-muted-foreground"
            >
              No return lines found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                {row.returnOrderId ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>{row.reference ?? "—"}</TableCell>
              <TableCell>{row.customerName ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell>
                {row.lineStatus
                  ? ORDER_LINE_STATUS_LABELS[row.lineStatus]
                  : "—"}
              </TableCell>
              <TableCell className="text-right">{row.quantity}</TableCell>
              <TableCell>{row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}</TableCell>
              <TableCell className="text-right">{row.returnQty}</TableCell>
              <TableCell>
                {row.returnReason
                  ? RETURN_ORDER_REASON_LABELS[row.returnReason]
                  : "—"}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.netPrice}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.costPrice}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.amount}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatMoney(row.profit)}
              </TableCell>
              <TableCell className="text-right">
                {row.profitMargin.toFixed(1)}%
              </TableCell>
              <TableCell>{row.deliveryDate ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
