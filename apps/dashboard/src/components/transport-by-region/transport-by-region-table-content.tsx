"use client";

import Link from "next/link";
import {
  exportTransportByRegion,
  TransportByRegionRow,
} from "@/app/(dashboard)/transport-by-region/actions";
import {
  TRANSPORT_BY_REGION_COLUMNS,
  TransportByRegionColumnKey,
} from "@/app/(dashboard)/transport-by-region/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  formatDateColumn,
  formatLengthMm,
  formatNumber,
} from "@/lib/helpers";
import { TRIP_STATUS_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = TransportByRegionColumnKey;

type Props = {
  page: Paged<TransportByRegionRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(TRANSPORT_BY_REGION_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  transportDate: "transportDate",
  city: "city",
  region: "region",
  vehicle: "vehicle",
  kgPlannedTotal: "kgPlanned",
  kgActualTotal: "kgActual",
};

export const TransportByRegionTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: TransportByRegionRow, key: ColumnKey) => {
    switch (key) {
      case "transportDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.transportDate)}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{row.city ?? "—"}</TableCell>;
      case "region":
        return <TableCell key={key}>{row.region ?? "—"}</TableCell>;
      case "postalCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {row.postalCode ?? "—"}
          </TableCell>
        );
      case "vehicle":
        return <TableCell key={key}>{row.vehicle ?? "—"}</TableCell>;
      case "deliveryName":
        // The reference's only row action is Show Company.
        return (
          <TableCell key={key} className="font-medium">
            {row.destinationCompanyUuid ? (
              <Link
                href={`/companies/${row.destinationCompanyUuid}`}
                className="text-primary hover:underline"
              >
                {row.deliveryName ?? "—"}
              </Link>
            ) : (
              (row.deliveryName ?? "—")
            )}
          </TableCell>
        );
      case "kgPlannedTotal":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.kgPlannedTotal)}
          </TableCell>
        );
      case "kgActualTotal":
        return (
          <TableCell key={key} className="text-right">
            {formatNumber(row.kgActualTotal)}
          </TableCell>
        );
      case "lengthLargest":
        return (
          <TableCell key={key} className="text-right">
            {formatLengthMm(row.lengthLargest)}
          </TableCell>
        );
      case "tripStatus":
        return (
          <TableCell key={key}>
            {row.tripStatus ? TRIP_STATUS_LABELS[row.tripStatus] : "—"}
          </TableCell>
        );
      case "sourceStatusLowest":
        return (
          <TableCell key={key}>{row.sourceStatusLowest ?? "—"}</TableCell>
        );
      case "lines":
        return (
          <TableCell key={key} className="text-right">
            {row.lines}
          </TableCell>
        );
      case "action":
        return <TableCell key={key}>{row.action ?? "—"}</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search vehicle, company or postal code…"
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
          fileName="transport-by-region"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportTransportByRegion}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No transports match this view</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A row appears for every stop a transport work order makes — a
            delivery or a pick-up at one address. Plan transports on Transport
            workorders, or clear the filters to see more.
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
                <TableRow key={row.key}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="transport"
            plural="transports"
          />
        </>
      )}
    </div>
  );
};
