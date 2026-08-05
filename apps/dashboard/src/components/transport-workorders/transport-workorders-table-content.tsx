"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TransportWorkOrderLineItem,
  completeTransportWorkOrderLine,
} from "@/app/(dashboard)/transport-workorders/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { WAREHOUSE_WORK_ORDER_STATUS_LABELS } from "@/lib/labels";

type Props = {
  lines: TransportWorkOrderLineItem[];
};

type CompleteButtonProps = {
  lineUuid: string;
};

const CompleteButton = ({ lineUuid }: CompleteButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const result = await completeTransportWorkOrderLine(lineUuid);
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
        {isPending ? "Completing…" : "Complete"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};

export const TransportWorkOrdersTable = ({ lines }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Trip</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Destination</TableHead>
          <TableHead>Postal Code</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Length</TableHead>
          <TableHead className="text-right">Qty(p)</TableHead>
          <TableHead className="text-right">Qty(loaded)</TableHead>
          <TableHead className="text-right">Kg(p)</TableHead>
          <TableHead className="text-right">Colli</TableHead>
          <TableHead className="text-right">Priority</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={16}
              className="h-24 text-center text-muted-foreground"
            >
              No transport work orders found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                <Link
                  href={`/transport-workorders/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.tripNumber ?? `#${row.id}`}
                </Link>
              </TableCell>
              <TableCell>{row.workOrderDate ?? "—"}</TableCell>
              <TableCell>{row.vehicle ?? "—"}</TableCell>
              <TableCell>{row.destinationName ?? "—"}</TableCell>
              <TableCell>{row.postalCode ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.orderNumber ?? "—"}</TableCell>
              <TableCell>{row.action ?? "—"}</TableCell>
              <TableCell>
                {row.status
                  ? WAREHOUSE_WORK_ORDER_STATUS_LABELS[row.status]
                  : "—"}
              </TableCell>
              <TableCell className="text-right">{row.lengthMm ?? "—"}</TableCell>
              <TableCell className="text-right">{row.qtyPlanned ?? "—"}</TableCell>
              <TableCell className="text-right">{row.qtyLoaded ?? "—"}</TableCell>
              <TableCell className="text-right">{row.kgPlanned ?? "—"}</TableCell>
              <TableCell className="text-right">{row.colli ?? "—"}</TableCell>
              <TableCell className="text-right">{row.priority ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.status === "completed" ? (
                  "—"
                ) : (
                  <CompleteButton lineUuid={row.uuid} />
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
