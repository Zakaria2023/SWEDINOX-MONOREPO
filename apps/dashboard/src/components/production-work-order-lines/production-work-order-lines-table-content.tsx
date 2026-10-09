"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import {
  exportProductionWorkOrderLines,
  ProductionWorkOrderLineRow,
  ProductionWorkOrderLineStatusCount,
} from "@/app/(dashboard)/production-work-order-lines/actions";
import {
  PRODUCTION_WORK_ORDER_LINE_COLUMNS,
  ProductionWorkOrderLineColumnKey,
} from "@/app/(dashboard)/production-work-order-lines/columns";
import { ProductCodeRangeFilter } from "@/components/production-work-order-lines/product-code-range-filter";
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
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TableRowActionItem,
  TableRowToolbar,
} from "@/components/ui/table-row-toolbar";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import { buildColumnVisibility, cn } from "@/lib/helpers";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { Package, ShoppingCart } from "lucide-react";

type ColumnKey = ProductionWorkOrderLineColumnKey;

type Props = {
  page: Paged<ProductionWorkOrderLineRow>;
  filters: TableFilterControl[];
  statusCounts: ProductionWorkOrderLineStatusCount[];
};

const ALL_COLUMNS = selectorColumns(PRODUCTION_WORK_ORDER_LINE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  workOrderDate: "workOrderDate",
  workOrderNumber: "workOrderNumber",
  status: "status",
  productCode: "productCode",
  kgPlanned: "kgPlanned",
};

/**
 * The reference shows this grid grouped by `Status` — a band per status, its
 * name and size above the rows — rather than as a Status column. The action
 * orders by the band first, so a band never breaks off mid-page except at a
 * page boundary; the count beside it is the band's size over the whole view.
 *
 * `Show Product` and `Show Order` act on the selected line from the toolbar
 * above the grid, as the reference's do.
 */
export const ProductionWorkOrderLinesTable = ({
  page,
  filters,
  statusCounts,
}: Props) => {
  const [visibility, setVisibility] = useState<Record<ColumnKey, boolean>>(
    buildColumnVisibility(ALL_COLUMNS),
  );
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = page.rows.find((row) => row.uuid === selectedUuid) ?? null;

  const toggle = (key: string) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key as ColumnKey] }));

  const visible = PRODUCTION_WORK_ORDER_LINE_COLUMNS.filter(
    (col) => visibility[col.key],
  );

  const rowActions: TableRowActionItem[] = [
    {
      label: "Show Product",
      icon: <Package className="size-4" />,
      href: selected?.productUuid ? `/products/${selected.productUuid}` : null,
    },
    {
      label: "Show Order",
      icon: <ShoppingCart className="size-4" />,
      href: selected?.salesOrderUuid
        ? `/orders/${selected.salesOrderUuid}`
        : null,
    },
  ];

  const bandSize = (status: ProductionWorkOrderLineRow["status"]) =>
    statusCounts.find((band) => band.status === status)?.lines ?? 0;

  return (
    <div className="space-y-4">
      <TableToolbar searchPlaceholder="Search product or order…" filters={filters}>
        <ProductCodeRangeFilter />
        <ColumnSelector
          columns={ALL_COLUMNS}
          visibility={visibility}
          onToggle={toggle}
        />
        <PagedTableExportButton
          fileName="production-workorders"
          action={exportProductionWorkOrderLines}
          columnKeys={visible.map((col) => col.key)}
        />
      </TableToolbar>
      <TableRowToolbar
        actions={rowActions}
        selectedLabel={
          selected
            ? `${selected.workOrderNumber} line ${selected.lineNumber ?? "—"}`
            : null
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            {visible.map((col) => {
              const sortKey = SORTABLE[col.key];
              return sortKey ? (
                <TableSortHeader key={col.key} sortKey={sortKey}>
                  {col.label}
                </TableSortHeader>
              ) : (
                <TableHead key={col.key} className="whitespace-nowrap">
                  {col.label}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={Math.max(visible.length, 1)}
                className="h-24 text-center text-muted-foreground"
              >
                No production work order lines.
              </TableCell>
            </TableRow>
          ) : (
            page.rows.map((row, index) => (
              <Fragment key={row.uuid}>
                {page.rows[index - 1]?.status !== row.status && (
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell
                      colSpan={Math.max(visible.length, 1)}
                      className="font-medium"
                    >
                      Status: {WORK_ORDER_STATUS_LABELS[row.status]} (
                      {bandSize(row.status)})
                    </TableCell>
                  </TableRow>
                )}
                <TableRow
                  onClick={() => setSelectedUuid(row.uuid)}
                  className={cn(
                    "cursor-pointer",
                    row.uuid === selectedUuid && "bg-accent",
                  )}
                >
                  {visible.map((col) =>
                    col.key === "workOrderNumber" ? (
                      <TableCell key={col.key}>
                        <Link
                          href={`/production-workorders/${row.workOrderUuid}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {row.workOrderNumber}
                        </Link>
                      </TableCell>
                    ) : (
                      <ExportValueCell key={col.key} value={col.value(row)} />
                    ),
                  )}
                </TableRow>
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} singular="line" plural="lines" />
    </div>
  );
};
