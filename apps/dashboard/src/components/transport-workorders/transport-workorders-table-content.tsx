"use client";

import { TransportWorkOrderLineItem } from "@/app/(dashboard)/transport-workorders/actions";
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={15}
              className="h-24 text-center text-muted-foreground"
            >
              No transport work orders found.
            </TableCell>
          </TableRow>
        ) : (
          lines.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="text-right font-medium">
                {row.tripNumber ?? "—"}
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
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
