"use client";

import Link from "next/link";
import { StockDetail } from "@/app/(dashboard)/stock/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  stock: StockDetail;
};

export const StockDetailView = ({ stock }: Props) => {
  const available = (
    Number(stock.quantity) - Number(stock.reservedQuantity)
  ).toFixed(3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </p>
          <p className="text-sm">{STOCK_STATUS_LABELS[stock.status]}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Original / Remaining
          </p>
          <p className="text-sm">
            {stock.originalQuantity ?? stock.quantity} / {stock.quantity}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Reserved
          </p>
          <p className="text-sm">{stock.reservedQuantity}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Available
          </p>
          <p className="text-sm">{available}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          <p className="text-sm">{stock.companyName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Purchase Order
          </p>
          <p className="text-sm">
            {stock.purchaseOrderId ? (
              <Link
                href={`/purchase-orders/${stock.purchaseOrderUuid}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                #{stock.purchaseOrderId}
              </Link>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Received
          </p>
          <p className="text-sm">
            {new Date(stock.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Movement History
        </h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.movements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No movements recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                stock.movements.map((movement) => (
                  <TableRow key={movement.uuid}>
                    <TableCell>
                      <span
                        className={
                          movement.type === "in"
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                            : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                        }
                      >
                        {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {STOCK_MOVEMENT_REASON_LABELS[movement.reason]}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.note ?? "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(movement.createdAt).toLocaleString("en-GB")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
