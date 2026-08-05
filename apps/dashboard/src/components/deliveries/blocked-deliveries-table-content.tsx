"use client";

import Link from "next/link";
import { DeliveryLineItem } from "@/app/(dashboard)/deliveries/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DELIVERY_STATUS_LABELS, ORDER_LINE_STATUS_LABELS } from "@/lib/labels";

type Props = {
  lines: DeliveryLineItem[];
};

export const BlockedDeliveriesTable = ({ lines }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Order</TableHead>
          <TableHead>Customer reference</TableHead>
          <TableHead>Order type</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Line status</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Qty(p)</TableHead>
          <TableHead className="text-right">Qty(call-off)</TableHead>
          <TableHead className="text-right">Kg(p)</TableHead>
          <TableHead className="text-right">Gross price</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead>Delivery status</TableHead>
          <TableHead>Blocking reason</TableHead>
          <TableHead>Reservation date</TableHead>
          <TableHead className="text-right">Qty(res)</TableHead>
          <TableHead className="text-right">Kg(res)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={18}
              className="h-24 text-center text-muted-foreground"
            >
              No blocked deliveries found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                <Link
                  href={`/order-lines/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.customerName ?? "View line"}
                </Link>
              </TableCell>
              <TableCell className="text-right">{row.orderId ?? "—"}</TableCell>
              <TableCell>{row.customerRef ?? "—"}</TableCell>
              <TableCell>{row.orderCategory ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.lineNumber ?? "—"}
              </TableCell>
              <TableCell>
                <StatusBadge
                  value={row.lineStatus}
                  label={
                    row.lineStatus
                      ? ORDER_LINE_STATUS_LABELS[row.lineStatus]
                      : null
                  }
                />
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.qtyPlanned}</TableCell>
              <TableCell className="text-right">{row.qtyCallOff}</TableCell>
              <TableCell className="text-right">{row.kgPlanned}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.grossPrice}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                € {row.amount}
              </TableCell>
              <TableCell>{row.deliveryDate ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge
                  value={row.deliveryStatus}
                  label={
                    row.deliveryStatus
                      ? DELIVERY_STATUS_LABELS[row.deliveryStatus]
                      : null
                  }
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.blockingReason ?? "—"}
              </TableCell>
              <TableCell>{row.reservationDate ?? "—"}</TableCell>
              <TableCell className="text-right">{row.qtyReserved}</TableCell>
              <TableCell className="text-right">{row.kgReserved}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
