"use client";

import Link from "next/link";
import { StockMovementListItem } from "@/app/(dashboard)/stock-movements/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_MOVEMENT_TYPE_LABELS } from "@/lib/labels";

type Props = {
  stockMovements: StockMovementListItem[];
};

export const StockMovementsTable = ({ stockMovements }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stockMovements.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              No stock movements found.
            </TableCell>
          </TableRow>
        ) : (
          stockMovements.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                {[row.productCode, row.productName].filter(Boolean).join(" — ") ||
                  "—"}
              </TableCell>
              <TableCell>
                <span
                  className={
                    row.type === "in"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                      : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                  }
                >
                  {STOCK_MOVEMENT_TYPE_LABELS[row.type]}
                </span>
              </TableCell>
              <TableCell className="text-right">{row.quantity}</TableCell>
              <TableCell>
                {row.purchaseOrderId ? (
                  <Link
                    href={`/purchase-orders/${row.purchaseOrderUuid}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Purchase Order #{row.purchaseOrderId}
                  </Link>
                ) : row.purchaseInvoiceId ? (
                  <Link
                    href={`/purchase-invoices/${row.purchaseInvoiceUuid}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Purchase Invoice #{row.purchaseInvoiceId}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{new Date(row.createdAt).toLocaleString("en-GB")}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
