"use client";

import { CountListDeviationListItem } from "@/app/(dashboard)/count-list-deviations/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  TableRowActionItem,
  TableRowToolbar,
} from "@/components/ui/table-row-toolbar";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { cn, formatDateValue } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { Eye, Package } from "lucide-react";
import { useState } from "react";

type Props = {
  page: Paged<CountListDeviationListItem>;
  filters: TableFilterControl[];
};

// The reference prints no `#` and no `Workorder date` column — the date is a
// filter there, not a column.
export const CountListDeviationsTable = ({ page, filters }: Props) => {
  // The reference's `Show Product` acts on the selected row from the toolbar.
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = page.rows.find((row) => row.uuid === selectedUuid) ?? null;

  const rowActions: TableRowActionItem[] = [
    {
      label: "Show Product",
      icon: <Package className="size-4" />,
      href: selected ? `/products/${selected.productUuid}` : null,
    },
    {
      label: "Open deviation",
      icon: <Eye className="size-4" />,
      href: selected ? `/count-list-deviations/${selected.uuid}` : null,
    },
  ];

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product, workorder or location…"
        filters={filters}
      >
        <TableExportButton
          tableId="count-list-deviations-table"
          fileName="count-list-deviations"
          sheetName="Deviations in Count Lists"
        />
      </TableToolbar>
      <TableRowToolbar
        actions={rowActions}
        selectedLabel={
          selected
            ? `${selected.workOrderNumber ?? "—"} · ${selected.productCode ?? "—"}`
            : null
        }
      />
      <Table id="count-list-deviations-table">
        <TableHeader>
          <TableRow>
            <TableHead>Workorder #</TableHead>
            <TableHead>Booked by</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Length (mm)</TableHead>
            <TableHead className="text-right">Qty.</TableHead>
            <TableHead>U.</TableHead>
            <TableHead className="text-right">Kg.</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Document</TableHead>
            <TableHead className="text-right">Old stk.</TableHead>
            <TableHead className="text-right">Old stk. Kg.</TableHead>
            <TableHead className="text-right">New stk.</TableHead>
            <TableHead className="text-right">New stk. Kg.</TableHead>
            <TableHead>Date reported as completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={15}
                className="h-24 text-center text-muted-foreground"
              >
                No count-list deviations found.
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
                  {row.workOrderNumber ?? "—"}
                </TableCell>
                <TableCell>{row.bookedBy ?? "—"}</TableCell>
                <TableCell>{row.location ?? "—"}</TableCell>
                <TableCell className="font-medium">
                  {[row.productCode, row.productName]
                    .filter(Boolean)
                    .join(" — ") || "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.length ?? "—"}
                </TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell>
                  {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
                </TableCell>
                <TableCell className="text-right">{row.kg ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.amount ?? "—"}
                </TableCell>
                <TableCell>{row.documentReference ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.oldStockQty ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.oldStockKg ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.newStockQty ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {row.newStockKg ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateValue(row.dateReportedAsCompleted)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} singular="deviation" plural="deviations" />
    </div>
  );
};
