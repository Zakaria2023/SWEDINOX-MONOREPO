"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChargeListItem,
  exportCharges,
} from "@/app/(dashboard)/charges/actions";
import {
  CHARGE_COLUMNS,
  ChargeColumnKey,
} from "@/app/(dashboard)/charges/columns";
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
import { GenerateChargesButton } from "@/components/charges/generate-charges-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  formatDateValue,
  orDash,
  salesDocumentStatusLabel,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = ChargeColumnKey;

type Props = {
  page: Paged<ChargeListItem>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(CHARGE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  creationDate: "creationDate",
  customerName: "customer",
  amount: "amount",
  surcharge: "surcharge",
};

const MONEY_KEYS = new Set<ColumnKey>([
  "profit",
  "profitMargin",
  "amount",
  "cost",
  "price",
  "weightKg",
]);

const PLAIN_NUMBER_KEYS = new Set<ColumnKey>([
  "customerCode",
  "priceFrom",
  "priceTo",
]);

const decimal = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const ChargesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: ChargeListItem, key: ColumnKey) => {
    if (MONEY_KEYS.has(key)) {
      const value =
        key === "profitMargin"
          ? Number(row.amount ?? 0) === 0
            ? 0
            : (Number(row.profit ?? 0) / Math.abs(Number(row.amount ?? 0))) *
              100
          : Number(row[key as keyof ChargeListItem] ?? 0);
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {decimal(value)}
        </TableCell>
      );
    }

    if (PLAIN_NUMBER_KEYS.has(key)) {
      const value = row[key as keyof ChargeListItem];
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {value === null || value === undefined ? "—" : String(value)}
        </TableCell>
      );
    }

    switch (key) {
      case "orderType":
        return <TableCell key={key}>{orDash(row.orderType)}</TableCell>;
      case "code":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/charges/${row.uuid}`}
              className="text-primary hover:underline"
            >
              {orDash(row.code)}
            </Link>
          </TableCell>
        );
      case "creationDate":
        return (
          <TableCell key={key}>{formatDateValue(row.creationDate)}</TableCell>
        );
      case "deliveryDate":
        return (
          <TableCell key={key}>{formatDateValue(row.deliveryDate)}</TableCell>
        );
      case "revenueGroupName":
        return <TableCell key={key}>{orDash(row.revenueGroupName)}</TableCell>;
      case "customerName":
        return (
          <TableCell key={key} className="font-medium">
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
      case "surcharge":
        return <TableCell key={key}>{orDash(row.surcharge)}</TableCell>;
      case "contract":
        return <TableCell key={key}>{orDash(row.contract)}</TableCell>;
      case "unit":
        return <TableCell key={key}>{orDash(row.unit)}</TableCell>;
      case "debtorNo":
        return <TableCell key={key}>{orDash(row.debtorNo)}</TableCell>;
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      case "country":
        return <TableCell key={key}>{orDash(row.country)}</TableCell>;
      case "vatNumber":
        return <TableCell key={key}>{orDash(row.vatNumber)}</TableCell>;
      case "status":
        return (
          <TableCell key={key}>
            {orDash(salesDocumentStatusLabel(row.status))}
          </TableCell>
        );
      default: {
        const column = CHARGE_COLUMNS.find((col) => col.key === key);
        return (
          <ExportValueCell key={key} value={column ? column.value(row) : null} />
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search customer, code or surcharge…"
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
          fileName="charges"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportCharges}
        />
        <GenerateChargesButton />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No charges</p>
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
                        <TableSortHeader key={col.key} sortKey={sortKey}>
                          {col.label}
                        </TableSortHeader>
                      );
                    }
                    return <TableHead key={col.key}>{col.label}</TableHead>;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.uuid}>
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} singular="charge" plural="charges" />
        </>
      )}
    </div>
  );
};
