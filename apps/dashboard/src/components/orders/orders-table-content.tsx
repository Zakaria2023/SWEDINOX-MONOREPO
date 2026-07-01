"use client";

import Link from "next/link";
import { OrderListItem } from "@/app/(dashboard)/orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ORDER_METHOD_LABELS } from "@/lib/labels";
import { OrderMethod } from "@/lib/enums";

type Props = {
  orders: OrderListItem[];
};

export const OrdersTableContent = ({ orders }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Delivery Date</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No orders found.
            </TableCell>
          </TableRow>
        ) : (
          orders.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/orders/${row.uuid}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {row.id}
                </Link>
              </TableCell>
              <TableCell>{row.companyName ?? "—"}</TableCell>
              <TableCell>
                {[row.contactFirstName, row.contactLastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </TableCell>
              <TableCell>
                {row.orderMethod
                  ? (ORDER_METHOD_LABELS[row.orderMethod as OrderMethod] ??
                    row.orderMethod)
                  : "—"}
              </TableCell>
              <TableCell>
                {row.deliveryDate
                  ? new Date(row.deliveryDate).toLocaleDateString("en-GB")
                  : row.deliveryWeek && row.deliveryYear
                    ? `W${row.deliveryWeek} ${row.deliveryYear}`
                    : "—"}
              </TableCell>
              <TableCell>
                {new Date(row.createdAt).toLocaleDateString("en-GB")}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
