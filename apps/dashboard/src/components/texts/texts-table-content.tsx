"use client";

import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import { Paged, TableFilterControl } from "@/lib/table-query";
import Link from "next/link";
import { useState } from "react";
import { exportTexts, TextListItem } from "@/app/(dashboard)/texts/actions";
import { TEXT_COLUMNS, TextColumnKey } from "@/app/(dashboard)/texts/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  activeTextUsageCategories,
  buildColumnVisibility,
  TEXT_USAGE_CATEGORY_FIELDS,
  TextUsageCategoryField,
} from "@/lib/helpers";

type UsageCategoryField = TextUsageCategoryField;

type ColumnKey = TextColumnKey;

// The column selector and the export read the same declaration — see
// app/(dashboard)/texts/columns.ts — so a column cannot be on screen and
// missing from the file.
const ALL_COLUMNS = selectorColumns(TEXT_COLUMNS);

const USAGE_FIELD_SET = new Set<string>(
  TEXT_USAGE_CATEGORY_FIELDS.map((m) => m.field),
);

// The columns a header may sort on, matching the keys actions.ts declared.
// A key not named here renders as a plain header.
const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyName: "company",
  textCategoryName: "category",
  createdAt: "createdAt",
};

type TextsTableContentProps = {
  page: Paged<TextListItem>;
  filters: TableFilterControl[];
};

const BooleanCheckbox = ({ checked }: { checked: boolean }) => (
  <input
    type="checkbox"
    checked={checked}
    readOnly
    className="size-4 cursor-default rounded border-border accent-primary"
  />
);

export const TextsTable = ({ page, filters }: TextsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);
  const fallback = "—";

  const renderCell = (text: TextListItem, key: ColumnKey) => {
    if (USAGE_FIELD_SET.has(key)) {
      return (
        <TableCell key={key} className="text-center">
          <BooleanCheckbox checked={!!text[key as UsageCategoryField]} />
        </TableCell>
      );
    }

    switch (key) {
      case "companyId":
        return (
          <TableCell key={key} className="font-medium">
            {text.companyId ?? fallback}
          </TableCell>
        );
      case "companyName":
        // The reference row menu holds one jump, to the company. This is it.
        return (
          <TableCell key={key} className="font-medium">
            {text.companyUuid && text.companyName ? (
              <Link
                href={`/companies/${text.companyUuid}`}
                className="text-primary hover:underline"
              >
                {text.companyName}
              </Link>
            ) : (
              fallback
            )}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{text.city ?? fallback}</TableCell>;
      case "customer":
        return (
          <TableCell key={key} className="text-center">
            <BooleanCheckbox
              checked={text.roles?.includes("customer") ?? false}
            />
          </TableCell>
        );
      case "supplier":
        return (
          <TableCell key={key} className="text-center">
            <BooleanCheckbox
              checked={text.roles?.includes("supplier") ?? false}
            />
          </TableCell>
        );
      case "processor":
        return (
          <TableCell key={key} className="text-center">
            <BooleanCheckbox
              checked={text.roles?.includes("processor") ?? false}
            />
          </TableCell>
        );
      case "textCategoryName":
        return (
          <TableCell key={key}>{text.textCategoryName ?? fallback}</TableCell>
        );
      case "textBlock":
        // The note is the row. It is shown whole and wrapped, the way the
        // reference shows it — an opening time cut off at "Warenannahme Vre…"
        // tells nobody anything. Clicking it opens the text itself.
        return (
          <TableCell key={key} className="max-w-md">
            <Link
              href={`/texts/${text.uuid}`}
              className="whitespace-pre-wrap hover:underline"
            >
              {text.textBlock}
            </Link>
          </TableCell>
        );
      case "categories": {
        const enabled = activeTextUsageCategories(text);
        return (
          <TableCell key={key}>
            {enabled.length > 0 ? enabled.join(", ") : fallback}
          </TableCell>
        );
      }
      case "updatedAt":
        return (
          <TableCell key={key}>
            {new Date(text.updatedAt).toLocaleDateString()}
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key={key}>
            {new Date(text.createdAt).toLocaleDateString()}
          </TableCell>
        );
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search text or company…"
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
          fileName="texts"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportTexts}
        />
      </TableToolbar>

      <div>
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
            {page.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No texts found
                </TableCell>
              </TableRow>
            ) : (
              page.rows.map((text) => (
                <TableRow key={text.uuid}>
                  {visibleColumns.map((col) => renderCell(text, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} singular="text" plural="texts" />
    </div>
  );
};
