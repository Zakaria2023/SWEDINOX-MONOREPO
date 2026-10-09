"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, FileText, Package } from "lucide-react";
import {
  DeliveryLineItem,
  releaseCommercialBlock,
} from "@/app/(dashboard)/deliveries/actions";
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
import { TableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TableRowActionItem,
  TableRowToolbar,
} from "@/components/ui/table-row-toolbar";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { cn } from "@/lib/helpers";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

const COLUMN_COUNT = 22;

type Props = {
  page: Paged<DeliveryLineItem>;
  filters: TableFilterControl[];
};

type ReleaseCommercialButtonProps = {
  orderUuid: string;
};

// A commercial release covers the whole order, as it does in the reference.
export const ReleaseCommercialButton = ({
  orderUuid,
}: ReleaseCommercialButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRelease = () =>
    startTransition(async () => {
      const result = await releaseCommercialBlock(orderUuid);
      setError(result.error ?? null);
      router.refresh();
    });

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleRelease}
      >
        {isPending ? "Releasing..." : "Commercial unblock"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
};

export const BlockedDeliveriesTable = ({ page, filters }: Props) => {
  // The reference acts on a selected row from a toolbar at the top — `Show`
  // stays grey until a row is picked, then reads `Show Order`.
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const selected = page.rows.find((row) => row.uuid === selectedUuid) ?? null;

  const rowActions: TableRowActionItem[] = [
    {
      label: "Show Product",
      icon: <Package className="size-4" />,
      href: selected ? `/products/${selected.productUuid}` : null,
    },
    {
      label: "Show Company",
      icon: <Building2 className="size-4" />,
      href: selected?.companyUuid ? `/companies/${selected.companyUuid}` : null,
    },
    {
      label: selected ? "Show Order" : "Show",
      icon: <FileText className="size-4" />,
      href: selected ? `/orders/${selected.orderUuid}` : null,
    },
  ];

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search customer or product…"
        filters={filters}
      >
        <TableExportButton
          tableId="blocked-deliveries-table"
          fileName="blocked-deliveries"
          sheetName="Blocked deliveries"
        />
      </TableToolbar>

      <div className="flex flex-wrap items-start gap-2">
        <TableRowToolbar
          actions={rowActions}
          selectedLabel={
            selected
              ? `${selected.orderId ?? "—"} line ${selected.lineNumber ?? "—"}`
              : null
          }
        />
        {selected?.commercialBlock ? (
          <ReleaseCommercialButton orderUuid={selected.orderUuid} />
        ) : null}
      </div>

      <Table id="blocked-deliveries-table">
        <TableHeader>
          <TableRow>
            <TableSortHeader sortKey="customer">Customer</TableSortHeader>
            <TableSortHeader sortKey="order" className="text-right">
              Order
            </TableSortHeader>
            <TableHead>Customer reference</TableHead>
            <TableHead>Order type</TableHead>
            <TableSortHeader sortKey="line" className="text-right">
              Line
            </TableSortHeader>
            <TableHead>Line status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty(p)</TableHead>
            <TableHead className="text-right">Qty(a)</TableHead>
            <TableHead className="text-right">Qty(call-off)</TableHead>
            <TableHead>QtyU</TableHead>
            <TableHead className="text-right">Kg(p)</TableHead>
            <TableHead className="text-right">Kg(a)</TableHead>
            <TableHead className="text-right">Gross price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableSortHeader sortKey="deliveryDate">Delivery date</TableSortHeader>
            <TableHead>Delivery status</TableHead>
            <TableHead>Blocking reason</TableHead>
            <TableHead>Reservation date</TableHead>
            <TableHead className="text-right">Qty(res)</TableHead>
            <TableHead className="text-right">Kg(res)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-muted-foreground"
              >
                No blocked deliveries found.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row) => (
              <TableRow
                key={row.uuid}
                onClick={() => setSelectedUuid(row.uuid)}
                className={cn(
                  "cursor-pointer",
                  row.uuid === selectedUuid && "bg-muted",
                )}
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/order-lines/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.customerName ?? "View line"}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  {row.orderId ?? "—"}
                </TableCell>
                <TableCell>{row.customerRef ?? "—"}</TableCell>
                <TableCell>{row.orderCategory ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.lineNumber ?? "—"}
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
                <TableCell>{ORDER_SOURCE_TYPE_LABELS[row.sourceType]}</TableCell>
                <TableCell>{row.productName ?? "—"}</TableCell>
                <TableCell className="text-right">{row.qtyPlanned}</TableCell>
                <TableCell className="text-right">{row.qtyActual}</TableCell>
                <TableCell className="text-right">{row.qtyCallOff}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">{row.kgPlanned}</TableCell>
                <TableCell className="text-right">{row.kgActual}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.grossPrice}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  € {row.amount}
                </TableCell>
                <TableCell>{row.deliveryDate ?? "—"}</TableCell>
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
                <TableCell className="text-muted-foreground">
                  {row.blockingReason ?? "—"}
                </TableCell>
                <TableCell>{row.reservationDate ?? "—"}</TableCell>
                <TableCell className="text-right">{row.qtyReserved}</TableCell>
                <TableCell className="text-right">{row.kgReserved}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        singular="blocked line"
        plural="blocked lines"
      />
    </div>
  );
};
