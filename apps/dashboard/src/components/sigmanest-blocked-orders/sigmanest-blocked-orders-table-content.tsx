"use client";

import { SigmaNestBlockedOrderRow } from "@/app/(dashboard)/sigmanest-blocked-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  rows: SigmaNestBlockedOrderRow[];
};

export const SigmaNestBlockedOrdersTable = ({ rows }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Work order</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead>Purchase order</TableHead>
          <TableHead>Sales order (e2t)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              No blocked SigmaNest orders.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">
                {row.workOrder ?? "—"}
              </TableCell>
              <TableCell>{row.customer ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.deliveryDate)}
              </TableCell>
              <TableCell>{row.purchaseOrder ?? "—"}</TableCell>
              <TableCell>{row.salesOrder ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
