"use client";

import Link from "next/link";
import { PurchaseOrderListItem } from "@/app/(dashboard)/purchase-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";
import { PurchaseOrderType } from "@/lib/enums";

type Props = {
  purchaseOrders: PurchaseOrderListItem[];
};

export const PurchaseOrdersTable = ({ purchaseOrders }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Delivery Date</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchaseOrders.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No purchase orders found.
            </TableCell>
          </TableRow>
        ) : (
          purchaseOrders.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                <Link
                  href={`/purchase-orders/${row.uuid}`}
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
                {row.purchaseOrderType
                  ? (PURCHASE_ORDER_TYPE_LABELS[
                      row.purchaseOrderType as PurchaseOrderType
                    ] ?? row.purchaseOrderType)
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
