"use client";

import Link from "next/link";
import {
  AddressListItem,
  exportAddresses,
} from "@/app/(dashboard)/addresses/actions";
import {
  AddressColumnKey,
  ADDRESS_COLUMNS,
} from "@/app/(dashboard)/addresses/columns";
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
import { buildColumnVisibility } from "@/lib/helpers";
import { ADDRESS_CATEGORY_LABELS, AVAILABLE_AT_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = AddressColumnKey;

// The column selector and the export read the same declaration — see
// app/(dashboard)/addresses/columns.ts — so a column cannot be on screen and
// missing from the file.
const ALL_COLUMNS = selectorColumns(ADDRESS_COLUMNS);

// The columns a header may sort on, matching the keys actions.ts declared
// sortable. A column not named here renders as a plain header.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyName: "company",
  streetAndNo: "streetAndNo",
  postalCode: "postalCode",
  city: "city",
  country: "country",
  category: "category",
  createdAt: "createdAt",
};

type AddressesTableContentProps = {
  page: Paged<AddressListItem>;
  filters: TableFilterControl[];
};

export const AddressesTable = ({
  page,
  filters,
}: AddressesTableContentProps) => {
  const addresses = page.rows;
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));
  };

  const visibleColumns = ALL_COLUMNS.filter(
    (column) => columnVisibility[column.key],
  );
  const fallbackValue = "—";

  const boolCell = (value: boolean | null) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        value ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );

  const renderCell = (item: AddressListItem, key: ColumnKey) => {
    const address = item.CompanyAddresses;
    const company = item.Companies;

    switch (key) {
      case "id":
        return (
          <TableCell key={key} className="font-medium">
            {address.id}
          </TableCell>
        );
      case "companyCode":
        return <TableCell key={key}>{company?.id ?? fallbackValue}</TableCell>;
      case "companyName":
        return (
          <TableCell key={key}>
            {company?.companyName ?? fallbackValue}
          </TableCell>
        );
      case "altName":
        return (
          <TableCell key={key}>{address.altName || fallbackValue}</TableCell>
        );
      case "streetAndNo":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/addresses/${address.uuid}`}
              className="text-primary hover:underline"
            >
              {address.streetAndNo || fallbackValue}
            </Link>
          </TableCell>
        );
      case "postalCode":
        return (
          <TableCell key={key}>{address.postalCode || fallbackValue}</TableCell>
        );
      case "city":
        return <TableCell key={key}>{address.city || fallbackValue}</TableCell>;
      case "region":
        return (
          <TableCell key={key}>{address.region || fallbackValue}</TableCell>
        );
      case "country":
        return (
          <TableCell key={key}>{address.country || fallbackValue}</TableCell>
        );
      case "house":
        return (
          <TableCell key={key}>{address.house || fallbackValue}</TableCell>
        );
      case "poBox":
        return (
          <TableCell key={key}>{boolCell(address.poBox ?? false)}</TableCell>
        );
      case "gln":
        return <TableCell key={key}>{address.gln || fallbackValue}</TableCell>;
      case "peppolId":
        return (
          <TableCell key={key}>{address.peppolId || fallbackValue}</TableCell>
        );
      case "telephone":
        return (
          <TableCell key={key}>{address.telephone || fallbackValue}</TableCell>
        );
      case "fax":
        return <TableCell key={key}>{address.fax || fallbackValue}</TableCell>;
      case "email":
        return (
          <TableCell key={key}>{address.email || fallbackValue}</TableCell>
        );
      case "website":
        return (
          <TableCell key={key}>{address.website || fallbackValue}</TableCell>
        );
      case "billingAttention":
        return (
          <TableCell key={key}>
            {address.billingAttention || fallbackValue}
          </TableCell>
        );
      case "billingAttentionAdditional":
        return (
          <TableCell key={key}>
            {address.billingAttentionAdditional || fallbackValue}
          </TableCell>
        );
      case "sequenceNumber":
        return (
          <TableCell key={key}>
            {address.sequenceNumber ?? fallbackValue}
          </TableCell>
        );
      case "category":
        return (
          <TableCell key={key}>
            <div className="flex flex-wrap gap-1">
              {address.category.length > 0 ? (
                address.category.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {ADDRESS_CATEGORY_LABELS[category]}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">{fallbackValue}</span>
              )}
            </div>
          </TableCell>
        );
      case "addressComplete":
        return (
          <TableCell key={key}>
            {boolCell(address.addressComplete ?? false)}
          </TableCell>
        );
      case "needCrane":
        return (
          <TableCell key={key}>
            {boolCell(address.needCrane ?? false)}
          </TableCell>
        );
      case "canopyRequired":
        return (
          <TableCell key={key}>
            {boolCell(address.canopyRequired ?? false)}
          </TableCell>
        );
      case "bundleSeparately":
        return (
          <TableCell key={key}>
            {boolCell(address.bundleSeparately ?? false)}
          </TableCell>
        );
      case "specialTransport":
        return (
          <TableCell key={key}>
            {boolCell(address.specialTransport ?? false)}
          </TableCell>
        );
      case "availableAt":
        return (
          <TableCell key={key}>
            {address.availableAt
              ? AVAILABLE_AT_LABELS[address.availableAt]
              : fallbackValue}
          </TableCell>
        );
      case "unloadingStartTime":
        return (
          <TableCell key={key}>
            {address.unloadingStartTime || fallbackValue}
          </TableCell>
        );
      case "unloadingEndTime":
        return (
          <TableCell key={key}>
            {address.unloadingEndTime || fallbackValue}
          </TableCell>
        );
      case "maxLength":
        return (
          <TableCell key={key}>{address.maxLength ?? fallbackValue}</TableCell>
        );
      case "maxBundleWeight":
        return (
          <TableCell key={key}>
            {address.maxBundleWeight ?? fallbackValue}
          </TableCell>
        );
      case "loadingInstructions":
        return (
          <TableCell key={key} className="max-w-48 truncate">
            {address.loadingInstructions || fallbackValue}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(address.createdAt).toLocaleDateString()}
          </TableCell>
        );
      case "updatedAt":
        return (
          <TableCell key={key}>
            {new Date(address.updatedAt).toLocaleDateString()}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search street, city, postcode or company…"
        filters={filters}
      >
        <ColumnSelector
          columns={ALL_COLUMNS.map((column) => ({
            key: column.key,
            label: column.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="addresses"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportAddresses}
        />
      </TableToolbar>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => {
                const sortKey = SORTABLE[column.key];
                return sortKey ? (
                  <TableSortHeader key={column.key} sortKey={sortKey}>
                    {column.label}
                  </TableSortHeader>
                ) : (
                  <TableHead key={column.key}>{column.label}</TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {addresses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No addresses found
                </TableCell>
              </TableRow>
            ) : (
              addresses.map((item) => (
                <TableRow key={item.CompanyAddresses.id}>
                  {visibleColumns.map((column) => renderCell(item, column.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={page} singular="address" plural="addresses" />
    </div>
  );
};
