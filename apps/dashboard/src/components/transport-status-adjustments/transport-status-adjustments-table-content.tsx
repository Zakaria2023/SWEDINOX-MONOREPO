"use client";

import Link from "next/link";
import { TransportStatusAdjustmentListItem } from "@/app/(dashboard)/transport-status-adjustments/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DELIVERY_STATUS_LABELS } from "@/lib/labels";

type Props = {
  adjustments: TransportStatusAdjustmentListItem[];
};

export const TransportStatusAdjustmentsTable = ({ adjustments }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Modifier</TableHead>
          <TableHead>Time modified</TableHead>
          <TableHead>Trip status</TableHead>
          <TableHead>Bill of lading</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Order line</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adjustments.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No transport status adjustments found.
            </TableCell>
          </TableRow>
        ) : (
          adjustments.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                <Link
                  href={`/transport-status-adjustments/${row.uuid}`}
                  className="text-primary hover:underline"
                >
                  {row.modifier ?? `Adjustment #${row.id}`}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {new Date(row.timeModified).toLocaleString("en-GB")}
              </TableCell>
              <TableCell>
                {row.tripStatus ? DELIVERY_STATUS_LABELS[row.tripStatus] : "—"}
              </TableCell>
              <TableCell>{row.billOfLading ?? "—"}</TableCell>
              <TableCell>
                {row.orderId ? (
                  <Link
                    href={`/orders/${row.orderUuid}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    #{row.orderId}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{row.orderLineNumber ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
