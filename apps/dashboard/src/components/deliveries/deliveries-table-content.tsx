"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DeliveryLineItem,
  deliverOrderItem,
  exportDeliveries,
} from "@/app/(dashboard)/deliveries/actions";
import {
  DELIVERY_COLUMNS,
  DeliveryColumnKey,
} from "@/app/(dashboard)/deliveries/columns";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { ExportValueCell } from "@/components/ui/export-value-cell";
import { StatusBadge } from "@/components/ui/status-badge";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  formatDateValue,
  orDash,
  userName,
} from "@/lib/helpers";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = DeliveryColumnKey;

type Props = {
  page: Paged<DeliveryLineItem>;
  /** Clerk id -> name, for the seller column. */
  userNames: Record<string, string>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(DELIVERY_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  orderId: "order",
  lineNumber: "line",
};

const NUMBER_KEYS = new Set<ColumnKey>([
  "orderId",
  "lengthMm",
  "widthMm",
  "qtyPlanned",
  "qtyActual",
  "kgPlanned",
  "kgActual",
  "tripNumber",
  "invoiceId",
  "invoicedProducts",
  "invoicedOptions",
  "theoreticalWeight",
]);

const YES_NO_KEYS = new Set<ColumnKey>([
  "isPickup",
  "commercialBlock",
  "financialBlock",
  "transportBlock",
  "stockProduct",
]);

const DeliverButton = ({ orderItemUuid }: { orderItemUuid: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onDeliver = () =>
    startTransition(async () => {
      const result = await deliverOrderItem(orderItemUuid);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={onDeliver} disabled={isPending}>
        {isPending ? "Delivering…" : "Deliver"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
};

export const DeliveriesTable = ({ page, userNames, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: DeliveryLineItem, key: ColumnKey) => {
    // The line number opens the order line, the canonical line screen.
    if (key === "lineNumber") {
      return (
        <TableCell key={key} className="font-medium">
          <Link
            href={`/order-lines/${row.uuid}`}
            className="text-primary hover:underline"
          >
            {row.lineNumber ?? "View line"}
          </Link>
        </TableCell>
      );
    }

    if (NUMBER_KEYS.has(key)) {
      const value = row[key as keyof DeliveryLineItem];
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {value === null || value === undefined ? "—" : String(value)}
        </TableCell>
      );
    }

    if (YES_NO_KEYS.has(key)) {
      return (
        <TableCell key={key} className="text-center">
          {row[key as keyof DeliveryLineItem] ? "Yes" : ""}
        </TableCell>
      );
    }

    switch (key) {
      case "lineStatus":
        return (
          <TableCell key={key}>
            <StatusBadge
              value={row.lineStatus}
              label={
                row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null
              }
            />
          </TableCell>
        );
      case "lineType":
        return (
          <TableCell key={key}>
            {row.sourceType ? ORDER_SOURCE_TYPE_LABELS[row.sourceType] : "—"}
          </TableCell>
        );
      case "customerName":
        return (
          <TableCell key={key}>
            {row.companyUuid ? (
              <Link
                href={`/companies/${row.companyUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.customerName)}
              </Link>
            ) : (
              orDash(row.customerName)
            )}
          </TableCell>
        );
      case "seller":
        return (
          <TableCell key={key}>{userName(row.seller, userNames)}</TableCell>
        );
      case "productCode":
        return (
          <TableCell key={key} className="font-medium">
            {orDash(row.productCode)}
          </TableCell>
        );
      case "productName":
        return <TableCell key={key}>{orDash(row.productName)}</TableCell>;
      case "options":
        return <TableCell key={key}>{orDash(row.options)}</TableCell>;
      case "unit":
        return (
          <TableCell key={key}>
            {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
          </TableCell>
        );
      case "deliveryStatus":
        return (
          <TableCell key={key}>
            <StatusBadge
              value={row.deliveryStatus}
              label={
                row.deliveryStatus
                  ? DELIVERY_STATUS_LABELS[row.deliveryStatus]
                  : null
              }
            />
          </TableCell>
        );
      case "deliveryDate":
        return (
          <TableCell key={key}>{formatDateValue(row.deliveryDate)}</TableCell>
        );
      case "blockingReason":
        return (
          <TableCell key={key} className="text-muted-foreground">
            {orDash(row.blockingReason)}
          </TableCell>
        );
      case "vehicle":
        return <TableCell key={key}>{orDash(row.vehicle)}</TableCell>;
      case "transportStatus":
        return <TableCell key={key}>{orDash(row.transportStatus)}</TableCell>;
      case "theoreticalWeightUnit":
        return (
          <TableCell key={key}>{orDash(row.theoreticalWeightUnit)}</TableCell>
        );
      case "modifiedAt":
        return (
          <TableCell key={key}>{formatDateValue(row.updatedAt)}</TableCell>
        );
      default: {
        const column = DELIVERY_COLUMNS.find((col) => col.key === key);
        return (
          <ExportValueCell key={key} value={column ? column.value(row) : null} />
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search customer, product or option…"
        filters={filters}
      >
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="deliveries"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportDeliveries}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No deliverable lines</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Try clearing the search or the filters.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((col) => {
                    const sortKey = SORTABLE[col.key];
                    if (sortKey) {
                      return (
                        <TableSortHeader
                          key={col.key}
                          sortKey={sortKey}
                          className="text-right"
                        >
                          {col.label}
                        </TableSortHeader>
                      );
                    }
                    return <TableHead key={col.key}>{col.label}</TableHead>;
                  })}
                  <TableHead className="text-right">Deliver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.uuid}>
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                    <TableCell className="text-right">
                      {row.status === "reserved" ? (
                        <DeliverButton orderItemUuid={row.uuid} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} singular="line" plural="lines" />
        </>
      )}
    </div>
  );
};
