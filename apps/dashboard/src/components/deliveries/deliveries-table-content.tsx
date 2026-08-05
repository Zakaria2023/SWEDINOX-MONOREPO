"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DeliveryLineItem,
  deliverOrderItem,
} from "@/app/(dashboard)/deliveries/actions";
import { Button } from "@/components/shadcn/button";
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

type DeliverButtonProps = {
  orderItemUuid: string;
};

const DeliverButton = ({ orderItemUuid }: DeliverButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const result = await deliverOrderItem(orderItemUuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={isPending}
      >
        {isPending ? "Delivering…" : "Deliver"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};

export const DeliveriesTable = ({ lines }: Props) => (
  <div>
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
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={18}
              className="h-24 text-center text-muted-foreground"
            >
              No deliveries found.
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
                  {row.orderCategory ?? "View line"}
                </Link>
              </TableCell>
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
              <TableCell className="text-right">
                {row.status === "reserved" ? (
                  <DeliverButton orderItemUuid={row.uuid} />
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
);
