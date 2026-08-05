"use client";

import { useState } from "react";
import Link from "next/link";
import { StockListItem } from "@/app/(dashboard)/stock/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StockCorrectionDialog } from "./stock-correction-dialog";
import { cn, daysInSystem } from "@/lib/helpers";
import { STOCK_STATUS_LABELS } from "@/lib/labels";

type Props = {
  stock: StockListItem[];
};

const DAYS_PENDING_WARNING_THRESHOLD = 30;

export const StockTable = ({ stock }: Props) => {
  const [correctingStock, setCorrectingStock] = useState<StockListItem | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Purchase Order</TableHead>
              <TableHead className="text-right">Original / Remaining</TableHead>
              <TableHead className="text-right">Reserved / Available</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pending For</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No stock found.
                </TableCell>
              </TableRow>
            ) : (
              stock.map((row) => {
                const pendingDays =
                  row.status === "pending" ? daysInSystem(row.createdAt) : null;
                const available = (
                  Number(row.quantity) - Number(row.reservedQuantity)
                ).toFixed(3);

                return (
                  <TableRow key={row.uuid}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/stock/${row.uuid}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {[row.productCode, row.productName]
                          .filter(Boolean)
                          .join(" — ") || "—"}
                      </Link>
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
                    <TableCell className="text-right">
                      {row.originalQuantity ?? row.quantity} / {row.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.reservedQuantity} / {available}
                    </TableCell>
                    <TableCell>{STOCK_STATUS_LABELS[row.status]}</TableCell>
                    <TableCell>
                      {pendingDays === null ? (
                        "—"
                      ) : (
                        <span
                          className={cn({
                            "font-medium text-amber-600":
                              pendingDays >= DAYS_PENDING_WARNING_THRESHOLD,
                          })}
                        >
                          {pendingDays} {pendingDays === 1 ? "day" : "days"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(row.createdAt).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell>
                      {row.status !== "cancelled" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCorrectingStock(row)}
                        >
                          Correct
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <StockCorrectionDialog
        stock={correctingStock}
        onOpenChange={(open) => {
          if (!open) {
            setCorrectingStock(null);
          }
        }}
      />
    </div>
  );
};
