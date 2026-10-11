"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  FileText,
  Package,
  Pencil,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { BatchRow, exportBatches } from "@/app/(dashboard)/batches/actions";
import {
  BATCH_COLUMNS,
  BatchColumnKey,
} from "@/app/(dashboard)/batches/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { ColumnSelector } from "@/components/ui/column-selector";
import { Button } from "@/components/shadcn/button";
import {
  TableRowActionItem,
  TableRowToolbar,
} from "@/components/ui/table-row-toolbar";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  cn,
  formatDateColumn,
  formatLengthMm,
  formatNumber,
  orDash,
} from "@/lib/helpers";
import { CERTIFICAAT_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { AdjustChargeDialog } from "./adjust-charge-dialog";

type Props = {
  page: Paged<BatchRow>;
  filters: TableFilterControl[];
};

type BatchCellProps = {
  row: BatchRow;
  column: BatchColumnKey;
};

const ALL_COLUMNS = selectorColumns(BATCH_COLUMNS);

const SORTABLE: Partial<Record<BatchColumnKey, string>> = {
  purchaseOrder: "purchaseOrder",
  supplier: "supplier",
  productCode: "productCode",
  internalCharge: "internalCharge",
  receiptDate: "receiptDate",
  kg: "kg",
};

const BatchCell = ({ row, column }: BatchCellProps) => {
  switch (column) {
    case "purchaseOrder":
      return (
        <TableCell className="text-right">
          {row.purchaseOrderUuid ? (
            <Link
              href={`/purchase-orders/${row.purchaseOrderUuid}`}
              className="text-primary hover:underline"
            >
              {row.purchaseOrderId ?? row.purchaseOrderCode}
            </Link>
          ) : (
            orDash(row.purchaseOrderCode)
          )}
        </TableCell>
      );
    case "supplierCode":
      return (
        <TableCell className="text-right">
          {orDash(row.supplierCode)}
        </TableCell>
      );
    case "supplier":
      return <TableCell>{orDash(row.supplierName)}</TableCell>;
    case "productCode":
      return (
        <TableCell className="whitespace-nowrap">
          {orDash(row.productCode)}
        </TableCell>
      );
    case "product":
      return <TableCell>{orDash(row.productName)}</TableCell>;
    case "length":
      return (
        <TableCell className="text-right">
          {formatLengthMm(row.lengthMm)}
        </TableCell>
      );
    case "width":
      return (
        <TableCell className="text-right">{orDash(row.widthMm)}</TableCell>
      );
    case "qty":
      return (
        <TableCell className="text-right">
          {formatNumber(Number(row.qty ?? 0))}
        </TableCell>
      );
    case "unit":
      return (
        <TableCell>{row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}</TableCell>
      );
    case "kg":
      return (
        <TableCell className="text-right">
          {formatNumber(Number(row.kg ?? 0))}
        </TableCell>
      );
    case "charge":
      return <TableCell>{orDash(row.charge)}</TableCell>;
    case "internalCharge":
      return (
        <TableCell className="font-medium whitespace-nowrap">
          <Link
            href={`/batches/${row.uuid}`}
            className="text-primary hover:underline"
          >
            {row.internalCharge ?? `Batch #${row.id}`}
          </Link>
        </TableCell>
      );
    case "sheetNumber":
      return <TableCell>{orDash(row.sheetNumber)}</TableCell>;
    case "documentCode":
      return <TableCell>{orDash(row.documentCode)}</TableCell>;
    case "fileName":
      return <TableCell>{orDash(row.fileName)}</TableCell>;
    case "mandatoryIgnoreDocument":
      return (
        <TableCell>
          <BooleanFlag
            on={row.mandatoryIgnoreDocument ?? false}
            label="Mandatory, ignore document"
          />
        </TableCell>
      );
    case "receiptDate":
      return (
        <TableCell className="whitespace-nowrap">
          {formatDateColumn(row.receiptDate)}
        </TableCell>
      );
    case "thickness":
      return (
        <TableCell className="text-right">
          {orDash(row.thicknessMm)}
        </TableCell>
      );
    case "stockCategory":
      return <TableCell>{orDash(row.stockCategory)}</TableCell>;
    case "qualityCode":
      return <TableCell>{orDash(row.qualityCode)}</TableCell>;
    case "documentCertificate":
      return (
        <TableCell>
          {row.documentCertificate
            ? CERTIFICAAT_LABELS[row.documentCertificate]
            : "—"}
        </TableCell>
      );
    case "producer":
      return <TableCell>{orDash(row.producer)}</TableCell>;
    case "options":
      return <TableCell>{orDash(row.options)}</TableCell>;
  }
};

export const BatchesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<BatchColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));
  const [adjusting, setAdjusting] = useState<BatchRow | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = page.rows.find((row) => row.uuid === selectedUuid) ?? null;

  // `Show Product · Show Company · Show Purchase order · Show File`, above the
  // grid and acting on the selected row (Batches, 11-10-2026).
  const rowActions: TableRowActionItem[] = [
    {
      label: "Show Product",
      icon: <Package className="size-4" />,
      href: selected?.productUuid ? `/products/${selected.productUuid}` : null,
    },
    {
      label: "Show Company",
      icon: <Building2 className="size-4" />,
      href: selected?.supplierUuid ? `/companies/${selected.supplierUuid}` : null,
    },
    {
      label: "Show Purchase order",
      icon: <ShoppingCart className="size-4" />,
      href: selected?.purchaseOrderUuid
        ? `/purchase-orders/${selected.purchaseOrderUuid}`
        : null,
    },
    {
      label: "Show File",
      icon: <FileText className="size-4" />,
      // A batch names its certificate file but holds no link to it yet.
      href: null,
    },
  ];

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as BatchColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search charge, purchase order, product or supplier…"
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
          fileName="batches"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportBatches}
        />
      </TableToolbar>

      <div className="flex flex-wrap items-center gap-2">
        <TableRowToolbar
          actions={rowActions}
          selectedLabel={selected?.internalCharge ?? null}
        />
        {/* Ours beyond the reference's four: the charge correction and the
            stock label, on the same selected row. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdjusting(selected)}
          disabled={!selected}
        >
          <Pencil className="me-1.5 size-4" />
          Adjust charge
        </Button>
        {selected ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/batches/${selected.uuid}/label`} />}
          >
            <Tag className="me-1.5 size-4" />
            Stock label
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            <Tag className="me-1.5 size-4" />
            Stock label
          </Button>
        )}
      </div>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No batches match this view</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A batch is written when goods are unloaded, and again when a
            production run books its output into stock. Clear the search or the
            filters to see more.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((col) => {
                  const sortKey = SORTABLE[col.key];
                  return sortKey ? (
                    <TableSortHeader key={col.key} sortKey={sortKey}>
                      {col.label}
                    </TableSortHeader>
                  ) : (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((row) => (
                <TableRow
                  key={row.uuid}
                  onClick={() => setSelectedUuid(row.uuid)}
                  className={cn(
                    "cursor-pointer",
                    row.uuid === selectedUuid && "bg-accent",
                  )}
                >
                  {visibleColumns.map((col) => (
                    <BatchCell key={col.key} row={row} column={col.key} />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} singular="batch" plural="batches" />
        </>
      )}

      {adjusting && (
        <AdjustChargeDialog
          key={adjusting.uuid}
          batchUuid={adjusting.uuid}
          charge={adjusting.charge}
          sheetNumber={adjusting.sheetNumber}
          internalCharge={adjusting.internalCharge}
          open
          onOpenChange={(open) => {
            if (!open) {
              setAdjusting(null);
            }
          }}
        />
      )}
    </div>
  );
};
