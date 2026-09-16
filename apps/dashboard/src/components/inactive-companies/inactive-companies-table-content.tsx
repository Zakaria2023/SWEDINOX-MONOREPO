"use client";

import Link from "next/link";
import {
  exportInactiveCompanies,
  InactiveCompanyRow,
} from "@/app/(dashboard)/inactive-companies/actions";
import {
  INACTIVE_COMPANY_COLUMNS,
  InactiveCompanyColumnKey,
} from "@/app/(dashboard)/inactive-companies/columns";
import { Checkbox } from "@/components/shadcn/checkbox";
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
  salesRepresentativeLabel,
} from "@/lib/helpers";
import { Paged, TableFilterControl } from "@/lib/table-query";
import { useState } from "react";

type ColumnKey = InactiveCompanyColumnKey;

type Props = {
  page: Paged<InactiveCompanyRow>;
  filters: TableFilterControl[];
};

type RoleTickProps = {
  checked: boolean;
};

const ALL_COLUMNS = selectorColumns(INACTIVE_COMPANY_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  code: "code",
  company: "company",
  lastModifiedAt: "lastModified",
};

const RoleTick = ({ checked }: RoleTickProps) => (
  <Checkbox checked={checked} disabled aria-readonly />
);

export const InactiveCompaniesTable = ({ page, filters }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: InactiveCompanyRow, key: ColumnKey) => {
    switch (key) {
      case "code":
        return (
          <TableCell key={key} className="text-right">
            {row.code}
          </TableCell>
        );
      case "company":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/companies/${row.companyUuid}`}
              className="text-primary hover:underline"
            >
              {row.companyName}
            </Link>
          </TableCell>
        );
      case "visitingAddress":
        return <TableCell key={key}>{row.visitingAddress ?? "—"}</TableCell>;
      case "postalCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {row.postalCode ?? "—"}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{row.city ?? "—"}</TableCell>;
      case "country":
        return <TableCell key={key}>{row.country ?? "—"}</TableCell>;
      case "customer":
        return (
          <TableCell key={key}>
            <RoleTick checked={row.isCustomer} />
          </TableCell>
        );
      case "prospect":
        return (
          <TableCell key={key}>
            <RoleTick checked={row.isProspect} />
          </TableCell>
        );
      case "supplier":
        return (
          <TableCell key={key}>
            <RoleTick checked={row.isSupplier} />
          </TableCell>
        );
      case "processor":
        return (
          <TableCell key={key}>
            <RoleTick checked={row.isProcessor} />
          </TableCell>
        );
      case "transporter":
        return (
          <TableCell key={key}>
            <RoleTick checked={row.isTransporter} />
          </TableCell>
        );
      case "agent":
        return (
          <TableCell key={key}>
            <RoleTick checked={row.isAgent} />
          </TableCell>
        );
      case "other":
        return (
          <TableCell key={key}>
            <RoleTick checked={row.isOther} />
          </TableCell>
        );
      case "lastModifiedBy":
        return <TableCell key={key}>{row.lastModifiedBy ?? "—"}</TableCell>;
      case "lastModifiedAt":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.lastModifiedAt)}
          </TableCell>
        );
      case "representative":
        return (
          <TableCell key={key}>
            {salesRepresentativeLabel(row.representative)}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar searchPlaceholder="Search company…" filters={filters}>
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="inactive-companies"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportInactiveCompanies}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No inactive companies</p>
          <p className="max-w-md text-sm text-muted-foreground">
            A company appears here once someone marks it inactive on the
            Companies overview. Clear the search or the filters to see more.
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
                <TableRow key={row.companyUuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="inactive company"
            plural="inactive companies"
          />
        </>
      )}
    </div>
  );
};
