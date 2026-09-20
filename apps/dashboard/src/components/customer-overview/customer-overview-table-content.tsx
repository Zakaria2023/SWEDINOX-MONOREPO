"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CustomerOverviewRow,
  exportCustomerOverview,
} from "@/app/(dashboard)/customer-overview/actions";
import {
  CUSTOMER_OVERVIEW_COLUMNS,
  CustomerOverviewColumnKey,
} from "@/app/(dashboard)/customer-overview/columns";
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
  customerGroupLabel,
  formatDateValue,
  orDash,
  representativeInitials,
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = CustomerOverviewColumnKey;

type Props = {
  page: Paged<CustomerOverviewRow>;
  filters: TableFilterControl[];
};

const ALL_COLUMNS = selectorColumns(CUSTOMER_OVERVIEW_COLUMNS);

// The columns a header may sort on, matching the keys actions.ts declared.
// The tallies are counted per page, so they cannot be sorted on: a sort would
// have to see every customer's documents to order ten of them.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  customerCode: "customerCode",
  companyName: "companyName",
  searchCode3: "searchCode3",
  representative: "representative",
  customerGroup: "customerGroup",
  region: "region",
};

// Everything the screen counts. They render right-aligned, as figures.
const COUNT_KEYS = new Set<ColumnKey>([
  "quotes",
  "outstandingQuotes",
  "outstandingOrders",
  "orderLines",
  "orders",
  "invoices",
  "invoiceLines",
  "visits",
  "visitFrequency",
  "counterOrders",
  "counterOrderLines",
  "outstandingCounterOrders",
  "returnOrders",
  "returnOrderLines",
  "outstandingReturnOrders",
  "complaints",
  "outstandingComplaints",
  "ordersUnder200Eur",
  "ordersUnder500Eur",
  "ordersUnder2000Eur",
  "ordersUnder200Kg",
  "ordersUnder500Kg",
  "ordersUnder2000Kg",
  "invoicedOrders",
  "customerCode",
]);

const MONEY_KEYS = new Set<ColumnKey>([
  "invoicedOrdersRevenue",
  "avgOrderSize",
]);

const money = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const CustomerOverviewTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: CustomerOverviewRow, key: ColumnKey) => {
    if (COUNT_KEYS.has(key)) {
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {row[key as keyof CustomerOverviewRow] as number}
        </TableCell>
      );
    }

    if (MONEY_KEYS.has(key)) {
      return (
        <TableCell key={key} className="text-right tabular-nums">
          {money(row[key as "invoicedOrdersRevenue" | "avgOrderSize"])}
        </TableCell>
      );
    }

    switch (key) {
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/companies/${row.companyUuid}`}
              className="text-primary hover:underline"
            >
              {orDash(row.companyName)}
            </Link>
          </TableCell>
        );
      case "initials":
        return (
          <TableCell key={key}>
            {orDash(representativeInitials(row.representative))}
          </TableCell>
        );
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
      case "customerGroup":
        return (
          <TableCell key={key}>
            {customerGroupLabel(row.customerGroup)}
          </TableCell>
        );
      case "lastOrderDate":
        return (
          <TableCell key={key}>{formatDateValue(row.lastOrderDate)}</TableCell>
        );
      // The window the counts were taken over, printed back on every row the
      // way the reference does, so a sheet is never read out of context.
      case "referenceFrom":
        return (
          <TableCell key={key}>
            {row.referenceFrom ? formatDateValue(row.referenceFrom) : "All"}
          </TableCell>
        );
      case "referenceTo":
        return (
          <TableCell key={key}>
            {row.referenceTo ? formatDateValue(row.referenceTo) : "All"}
          </TableCell>
        );
      case "invoiceEmailEnabled":
        return (
          <TableCell key={key}>
            {row.invoiceEmailEnabled ? "Yes" : "No"}
          </TableCell>
        );
      case "searchCode1":
        return <TableCell key={key}>{orDash(row.searchCode1)}</TableCell>;
      case "searchCode2":
        return <TableCell key={key}>{orDash(row.searchCode2)}</TableCell>;
      case "searchCode3":
        return <TableCell key={key}>{orDash(row.searchCode3)}</TableCell>;
      case "streetAndNo":
        return <TableCell key={key}>{orDash(row.streetAndNo)}</TableCell>;
      case "city":
        return <TableCell key={key}>{orDash(row.city)}</TableCell>;
      case "postalCode":
        return <TableCell key={key}>{orDash(row.postalCode)}</TableCell>;
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      case "invoiceEmailTo":
        return <TableCell key={key}>{orDash(row.invoiceEmailTo)}</TableCell>;
      case "vatNumber":
        return <TableCell key={key}>{orDash(row.vatNumber)}</TableCell>;
      default:
        return <TableCell key={key}>—</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search customer or search code…"
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
          fileName="customer-overview"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportCustomerOverview}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No customers</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Try clearing the search, the reference date or the filters.
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
                  <TableRow key={row.companyUuid}>
                    {visibleColumns.map((col) => renderCell(row, col.key))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} singular="customer" plural="customers" />
        </>
      )}
    </div>
  );
};
