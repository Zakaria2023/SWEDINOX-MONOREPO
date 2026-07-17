"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ProductionWorkOrderLineItem,
  completeProductionWorkOrderLine,
} from "@/app/(dashboard)/production-workorders/actions";
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
  MACHINE_OPTION_LABELS,
  WAREHOUSE_WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  lines: ProductionWorkOrderLineItem[];
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
      const result = await completeProductionWorkOrderLine(lineUuid);
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

export const ProductionWorkOrdersTable = ({ lines }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Machine / Option</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="text-right">Dikte</TableHead>
          <TableHead className="text-right">Qty(p)</TableHead>
          <TableHead className="text-right">Qty(a)</TableHead>
          <TableHead className="text-right">Kg(p)</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Deliver on</TableHead>
          <TableHead className="text-center">Rush</TableHead>
          <TableHead className="text-right">Priority</TableHead>
          <TableHead>Charge</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={17}
              className="h-24 text-center text-muted-foreground"
            >
              No production work orders found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>{row.date ?? row.workOrderDate ?? "—"}</TableCell>
              <TableCell>
                {[
                  row.machineName,
                  row.option ? MACHINE_OPTION_LABELS[row.option] : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </TableCell>
              <TableCell>
                {row.status
                  ? WAREHOUSE_WORK_ORDER_STATUS_LABELS[row.status]
                  : "—"}
              </TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.orderNumber ?? "—"}</TableCell>
              <TableCell>{row.companyName ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.thicknessMm ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.qtyPlanned ?? "—"}</TableCell>
              <TableCell className="text-right">{row.qtyActual ?? "—"}</TableCell>
              <TableCell className="text-right">{row.kgPlanned ?? "—"}</TableCell>
              <TableCell>{row.fromLocation ?? "—"}</TableCell>
              <TableCell>{row.toLocation ?? "—"}</TableCell>
              <TableCell>{row.deliverOn ?? "—"}</TableCell>
              <TableCell className="text-center">
                {row.rush ? "Yes" : ""}
              </TableCell>
              <TableCell className="text-right">{row.priority ?? "—"}</TableCell>
              <TableCell>{row.charge ?? "—"}</TableCell>
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
