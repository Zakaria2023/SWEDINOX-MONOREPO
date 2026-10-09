"use client";

import Link from "next/link";
import { ProductionBatchListItem } from "@/app/(dashboard)/production-batches/actions";
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
import { cn } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { Eye, FileText, Tag } from "lucide-react";
import { useState } from "react";

type Props = {
  page: Paged<ProductionBatchListItem>;
  filters: TableFilterControl[];
};

export const ProductionBatchesTable = ({ page, filters }: Props) => {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = page.rows.find((row) => row.uuid === selectedUuid) ?? null;

  // The reference's toolbar is `Batch labels` · `Texts`, greyed until a batch
  // is picked. Neither is built here — no batch label print, no texts on a
  // batch — so both stay greyed; `Open batch` is the one that goes somewhere.
  const rowActions: TableRowActionItem[] = [
    {
      label: "Open batch",
      icon: <Eye className="size-4" />,
      href: selected ? `/production-batches/${selected.uuid}` : null,
    },
    { label: "Batch labels", icon: <Tag className="size-4" />, href: null },
    { label: "Texts", icon: <FileText className="size-4" />, href: null },
  ];

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search code, machine or location…"
        filters={filters}
      >
        <TableExportButton
          tableId="production-batches-table"
          fileName="production-batches"
          sheetName="Production batches"
        />
      </TableToolbar>
      <TableRowToolbar
        actions={rowActions}
        selectedLabel={selected?.code ?? null}
      />
      <Table id="production-batches-table">
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Machine</TableHead>
            <TableHead>To location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                No production batches found.
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
                    href={`/production-batches/${row.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {row.code}
                  </Link>
                </TableCell>
                <TableCell>{row.createdOn ?? "—"}</TableCell>
                <TableCell>{row.machineName ?? "—"}</TableCell>
                <TableCell>{row.toLocationName ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination page={page} singular="batch" plural="batches" />
    </div>
  );
};
