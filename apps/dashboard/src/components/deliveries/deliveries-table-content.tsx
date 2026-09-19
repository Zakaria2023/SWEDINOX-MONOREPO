"use client";

import { userName } from "@/lib/helpers";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DeliveryLineItem,
  deliverOrderItem,
  exportDeliveries,
} from "@/app/(dashboard)/deliveries/actions";
import { DELIVERY_COLUMNS } from "@/app/(dashboard)/deliveries/columns";
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
import {
  DELIVERY_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<DeliveryLineItem>;
  /** Clerk id -> name, for the seller column. */
  userNames: Record<string, string>;
  filters: TableFilterControl[];
};

type DeliverButtonProps = {
  orderItemUuid: string;
};

const DeliverButton = ({ orderItemUuid }: DeliverButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const result = await deliverOrderItem(orderItemUuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={isPending}
      >
        {isPending ? "Delivering…" : "Deliver"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};

export const DeliveriesTable = ({ page, userNames, filters }: Props) => (
  <div className="space-y-4">
    <TableToolbar
      searchPlaceholder="Search customer, product or option…"
      filters={filters}
    >
      <PagedTableExportButton
        fileName="deliveries"
        columnKeys={DELIVERY_COLUMNS.map((column) => column.key)}
        action={exportDeliveries}
      />
    </TableToolbar>

    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order type</TableHead>
            <TableHead>Line status</TableHead>
            <TableSortHeader sortKey="order" className="text-right">
              Order
            </TableSortHeader>
            <TableSortHeader sortKey="line" className="text-right">
              Line
            </TableSortHeader>
            <TableSortHeader sortKey="customer">Customer</TableSortHeader>
            <TableHead>Seller</TableHead>
            <TableHead className="text-center">Pick-up</TableHead>
            <TableHead>Product code</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Length</TableHead>
            <TableHead className="text-right">Width</TableHead>
            <TableHead>Options</TableHead>
            <TableHead className="text-right">Line Qty(p)</TableHead>
            <TableHead>StkU</TableHead>
            <TableHead>Delivery status</TableHead>
            <TableSortHeader sortKey="deliveryDate">
              Delivery date
            </TableSortHeader>
            <TableHead>Blocking reason</TableHead>
            <TableHead data-export-ignore className="text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={18}
                className="h-24 text-center text-muted-foreground"
              >
                No deliverable lines. Try clearing the search or the filters.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell className="font-medium">
                  <Link
                    href={`/order-lines/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.orderCategory ?? "View line"}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    value={row.lineStatus}
                    label={
                      row.lineStatus
                        ? ORDER_LINE_STATUS_LABELS[row.lineStatus]
                        : null
                    }
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.orderId ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.lineNumber ?? "—"}
                </TableCell>
                <TableCell>{row.customerName ?? "—"}</TableCell>
                <TableCell>{userName(row.seller, userNames)}</TableCell>
                <TableCell className="text-center">
                  {row.isPickup ? "Yes" : ""}
                </TableCell>
                <TableCell className="font-medium">
                  {row.productCode ?? "—"}
                </TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.lengthMm ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.widthMm ?? "—"}
                </TableCell>
                <TableCell>{row.options ?? "—"}</TableCell>
                <TableCell className="text-right">{row.qtyPlanned}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    value={row.deliveryStatus}
                    label={
                      row.deliveryStatus
                        ? DELIVERY_STATUS_LABELS[row.deliveryStatus]
                        : null
                    }
                  />
                </TableCell>
                <TableCell>{row.deliveryDate ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.blockingReason ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.status === "reserved" ? (
                    <DeliverButton orderItemUuid={row.uuid} />
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>

    <TablePagination page={page} singular="line" plural="lines" />
  </div>
);
