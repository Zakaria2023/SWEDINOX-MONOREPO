"use client";

import { useState } from "react";
import Link from "next/link";
import { exportStock, StockListItem } from "@/app/(dashboard)/stock/actions";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { StockCorrectionDialog } from "./stock-correction-dialog";
import { cn, daysInSystem } from "@/lib/helpers";
import { STOCK_STATUS_LABELS } from "@/lib/labels";

type Props = {
  page: Paged<StockListItem>;
  filters: TableFilterControl[];
};

const DAYS_PENDING_WARNING_THRESHOLD = 30;

export const StockTable = ({ page, filters }: Props) => {
  const [correctingStock, setCorrectingStock] = useState<StockListItem | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product or charge…"
        filters={filters}
      >
        <PagedTableExportButton fileName="stock" action={exportStock} />
      </TableToolbar>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableSortHeader sortKey="product">Product</TableSortHeader>
              <TableHead>Company</TableHead>
              <TableHead>Purchase Order</TableHead>
              <TableHead className="text-right">Original / Remaining</TableHead>
              <TableHead className="text-right">Reserved / Available</TableHead>
              <TableSortHeader sortKey="status">Status</TableSortHeader>
              <TableHead>Pending For</TableHead>
              <TableSortHeader sortKey="createdAt">Created</TableSortHeader>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No stock found.
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((row) => {
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
                    <TableCell>
                      <StatusBadge
                        value={row.status}
                        label={
                          row.status ? STOCK_STATUS_LABELS[row.status] : null
                        }
                      />
                    </TableCell>
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

      <TablePagination page={page} singular="lot" plural="lots" />

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
