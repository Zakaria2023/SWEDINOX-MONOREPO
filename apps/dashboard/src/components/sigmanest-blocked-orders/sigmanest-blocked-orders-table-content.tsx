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
import { formatDateColumn, orDash } from "@/lib/helpers";

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
          <TableHead>Sales order</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              No blocked orders.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">{row.workOrder}</TableCell>
              {/* The linked company wins when the reference resolves; the name
                  SigmaNest reported stands in when it does not, which is often
                  the very reason the order is blocked. */}
              <TableCell>
                {orDash(row.linkedCustomerName ?? row.customerName)}
              </TableCell>
              <TableCell>{formatDateColumn(row.deliveryDate)}</TableCell>
              <TableCell>{orDash(row.purchaseOrderCode)}</TableCell>
              <TableCell>{orDash(row.salesOrderCode)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
