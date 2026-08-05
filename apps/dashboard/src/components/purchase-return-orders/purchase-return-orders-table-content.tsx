"use client";

import Link from "next/link";
import { PurchaseReturnOrderListItem } from "@/app/(dashboard)/purchase-return-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PURCHASE_RETURN_ORDER_REASON_LABELS } from "@/lib/labels";
import { PurchaseReturnOrderReason } from "@/lib/enums";

type Props = {
  purchaseReturnOrders: PurchaseReturnOrderListItem[];
};

export const PurchaseReturnOrdersTable = ({ purchaseReturnOrders }: Props) => (
  <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Return Reason</TableHead>
          <TableHead>Return Date</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchaseReturnOrders.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase return orders found.
            </TableCell>
          </TableRow>
        ) : (
          purchaseReturnOrders.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/purchase-return-orders/${row.uuid}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {row.id}
                </Link>
              </TableCell>
              <TableCell>{row.supplierName ?? "—"}</TableCell>
              <TableCell>
                {[row.contactFirstName, row.contactLastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </TableCell>
              <TableCell>
                {row.returnReason
                  ? (PURCHASE_RETURN_ORDER_REASON_LABELS[
                      row.returnReason as PurchaseReturnOrderReason
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
