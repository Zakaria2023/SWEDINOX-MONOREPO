"use client";

import { DeliveryLineItem } from "@/app/(dashboard)/deliveries/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  lines: DeliveryLineItem[];
};

export const DeliveriesTable = ({ lines }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order type</TableHead>
          <TableHead>Line status</TableHead>
          <TableHead className="text-right">Order</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Seller</TableHead>
          <TableHead className="text-center">Pick-up</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Width</TableHead>
          <TableHead>Options</TableHead>
          <TableHead className="text-right">Line Qty(p)</TableHead>
          <TableHead>StkU</TableHead>
          <TableHead>Delivery status</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead>Blocking reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={17}
              className="h-24 text-center text-muted-foreground"
            >
              No deliveries found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{row.orderCategory ?? "—"}</TableCell>
              <TableCell>
                {row.lineStatus
                  ? ORDER_LINE_STATUS_LABELS[row.lineStatus]
                  : "—"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {row.orderId ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>{row.customerName ?? "—"}</TableCell>
              <TableCell>{row.seller ?? "—"}</TableCell>
              <TableCell className="text-center">
                {row.isPickup ? "Yes" : ""}
              </TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lengthMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.widthMm ?? "—"}
              </TableCell>
              <TableCell>{row.options ?? "—"}</TableCell>
              <TableCell className="text-right">{row.qtyPlanned}</TableCell>
              <TableCell>{row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}</TableCell>
              <TableCell>
                {row.deliveryStatus
                  ? DELIVERY_STATUS_LABELS[row.deliveryStatus]
                  : "—"}
              </TableCell>
              <TableCell>{row.deliveryDate ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.blockingReason ?? "—"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
