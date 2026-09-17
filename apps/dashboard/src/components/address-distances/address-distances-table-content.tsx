"use client";

import Link from "next/link";
import {
  AddressDistanceListItem,
  exportAddressDistances,
} from "@/app/(dashboard)/address-distances/actions";
import {
  ADDRESS_DISTANCE_COLUMNS,
  AddressDistanceColumnKey,
} from "@/app/(dashboard)/address-distances/columns";
import { EditDistanceDialog } from "@/components/address-distances/edit-distance-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { RowAction } from "@/components/ui/row-action";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import { buildColumnVisibility, formatNumber, orDash } from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { Pencil } from "lucide-react";
import { useState } from "react";

type ColumnKey = AddressDistanceColumnKey;

type Props = {
  page: Paged<AddressDistanceListItem>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(ADDRESS_DISTANCE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  country: "country",
  city: "city",
  km: "km",
};

export const AddressDistancesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));
  const [editing, setEditing] = useState<AddressDistanceListItem | null>(null);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: AddressDistanceListItem, key: ColumnKey) => {
    switch (key) {
      case "country":
        return <TableCell key={key}>{orDash(row.country)}</TableCell>;
      case "city":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/address-distances/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {orDash(row.city)}
            </Link>
          </TableCell>
        );
      case "street":
        return <TableCell key={key}>{orDash(row.street)}</TableCell>;
      case "postalCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.postalCode)}
          </TableCell>
        );
      case "km":
        return (
          <TableCell key={key} className="text-right">
            {row.km === null ? "—" : formatNumber(Number(row.km))}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar searchPlaceholder="Search city, street or postal code…" filters={filters}>
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="address-distances"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportAddressDistances}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No address distances</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A distance is recorded per address, in kilometres from our own
            depot, and is what bands a transporter&apos;s tariff.
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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((row) => (
                <TableRow key={row.uuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                  {/* The reference's row menu holds one item: edit the line. */}
                  <TableCell>
                    <RowAction
                      label="Edit selected line"
                      tone="edit"
                      onClick={() => setEditing(row)}
                    >
                      <Pencil className="size-4" />
                    </RowAction>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} singular="distance" plural="distances" />
        </>
      )}

      {editing && (
        <EditDistanceDialog
          distance={editing}
          open={editing !== null}
          onOpenChange={(open) => setEditing(open ? editing : null)}
        />
      )}
    </div>
  );
};
