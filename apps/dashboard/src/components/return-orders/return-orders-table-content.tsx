"use client";

import Link from "next/link";
import { ReturnOrderListItem } from "@/app/(dashboard)/return-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { RETURN_ORDER_REASON_LABELS } from "@/lib/labels";
import { ReturnOrderReason } from "@/lib/enums";

type Props = {
  returnOrders: ReturnOrderListItem[];
};

export const ReturnOrdersTable = ({ returnOrders }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Return Reason</TableHead>
          <TableHead>Return Date</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {returnOrders.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No return orders found.
            </TableCell>
          </TableRow>
        ) : (
          returnOrders.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/return-orders/${row.uuid}`}
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
                {row.returnReason
                  ? (RETURN_ORDER_REASON_LABELS[
                      row.returnReason as ReturnOrderReason
                    ] ?? row.returnReason)
                  : "—"}
              </TableCell>
              <TableCell>
                {row.returnDate
                  ? new Date(row.returnDate).toLocaleDateString("en-GB")
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
