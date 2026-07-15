"use client";

import Link from "next/link";
import { StockListItem } from "@/app/(dashboard)/stock/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { STOCK_STATUS_LABELS } from "@/lib/labels";

type Props = {
  stock: StockListItem[];
};

export const StockTable = ({ stock }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Purchase Order</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stock.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              No stock found.
            </TableCell>
          </TableRow>
        ) : (
          stock.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell className="font-medium">
                {[row.productCode, row.productName].filter(Boolean).join(" — ") ||
                  "—"}
              </TableCell>
              <TableCell>{row.companyName ?? "—"}</TableCell>
              <TableCell>
                {row.purchaseOrderId ? (
                  <Link
                    href={`/purchase-orders/${row.purchaseOrderUuid}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {row.purchaseOrderId}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">{row.quantity}</TableCell>
              <TableCell>{STOCK_STATUS_LABELS[row.status]}</TableCell>
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
