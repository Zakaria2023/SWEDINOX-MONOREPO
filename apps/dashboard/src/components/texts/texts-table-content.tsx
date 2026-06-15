"use client";

import { useState } from "react";
import type { TextListItem } from "@/app/(dashboard)/texts/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { type TextUsageCategory } from "@/lib/enums";
import { COMMON_TEXT, TEXT_USAGE_CATEGORY_LABELS } from "@/lib/labels";

import type { SelectTexts } from "@/db";

type UsageCategoryField = keyof Omit<
  SelectTexts,
  | "id"
  | "uuid"
  | "companyUuid"
  | "textCategoryUuid"
  | "title"
  | "textBlock"
  | "sequenceNumber"
  | "isActive"
  | "createdByUserId"
  | "createdAt"
  | "updatedAt"
>;

const USAGE_CATEGORY_MAP: Array<{
  field: UsageCategoryField;
  key: TextUsageCategory;
}> = [
  { key: "visit_report", field: "visitReport" },
  { key: "purchase_quote_request", field: "purchaseQuoteRequest" },
  { key: "purchase_order", field: "purchaseOrder" },
  { key: "purchase_order_tool_tip", field: "purchaseOrderToolTip" },
  { key: "purchase_return_order", field: "purchaseReturnOrder" },
  { key: "sales_quote", field: "salesQuote" },
  { key: "sales_order", field: "salesOrder" },
  { key: "sales_order_tool_tip", field: "salesOrderToolTip" },
  { key: "sales_invoice", field: "salesInvoice" },
  { key: "warehouse_order", field: "warehouseOrder" },
  { key: "production_order", field: "productionOrder" },
  { key: "loadlist", field: "loadlist" },
  { key: "waybill", field: "waybill" },
  { key: "ride_list", field: "rideList" },
  { key: "customer_label", field: "customerLabel" },
  { key: "transport_planning", field: "transportPlanning" },
  { key: "website_in_advance", field: "websiteInAdvance" },
  { key: "website_after", field: "websiteAfter" },
];

type ColumnKey =
  | "companyId"
  | "companyName"
  | "city"
  | "customer"
  | "supplier"
  | "processor"
  | "textCategoryName"
  | "textBlock"
  | "categories"
  | "updatedAt"
  | "createdAt"
  | UsageCategoryField;

const BASE_COLUMNS: Array<{ defaultVisible: boolean; key: ColumnKey; label: string }> = [
  { key: "companyId", label: "Company code", defaultVisible: true },
  { key: "companyName", label: "Customer", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "customer", label: "Customer", defaultVisible: true },
  { key: "supplier", label: "Supplier", defaultVisible: true },
  { key: "processor", label: "Processor", defaultVisible: true },
  { key: "textCategoryName", label: "Text group", defaultVisible: true },
  { key: "textBlock", label: "Text", defaultVisible: true },
  { key: "categories", label: "Categories", defaultVisible: true },
  { key: "updatedAt", label: "Modified", defaultVisible: true },
  { key: "createdAt", label: "Created", defaultVisible: true },
];

const USAGE_COLUMNS: Array<{ defaultVisible: boolean; key: ColumnKey; label: string }> =
  USAGE_CATEGORY_MAP.map(({ key, field }) => ({
    key: field as ColumnKey,
    label: TEXT_USAGE_CATEGORY_LABELS[key],
    defaultVisible: true,
  }));

const ALL_COLUMNS = [...BASE_COLUMNS, ...USAGE_COLUMNS];

const initialVisibility = ALL_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: col.defaultVisible }),
  {} as Record<ColumnKey, boolean>,
);

const USAGE_FIELD_SET = new Set<string>(USAGE_CATEGORY_MAP.map((m) => m.field));

type TextsTableContentProps = {
  texts: TextListItem[];
};

const BooleanCheckbox = ({ checked }: { checked: boolean }) => (
  <input
    type="checkbox"
    checked={checked}
    readOnly
    className="size-4 cursor-default rounded border-border accent-primary"
  />
);

export const TextsTableContent = ({ texts }: TextsTableContentProps) => {
  const [columnVisibility, setColumnVisibility] =
    useState<Record<ColumnKey, boolean>>(initialVisibility);

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);
  const fallback = COMMON_TEXT.notAvailable;

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
        return (
          <TableCell key={key} className="font-medium">
            {text.companyName ?? fallback}
          </TableCell>
        );
      case "city":
        return <TableCell key={key}>{text.city ?? fallback}</TableCell>;
      case "customer":
        return (
          <TableCell key={key} className="text-center">
            <BooleanCheckbox checked={text.roles?.includes("customer") ?? false} />
          </TableCell>
        );
      case "supplier":
        return (
          <TableCell key={key} className="text-center">
            <BooleanCheckbox checked={text.roles?.includes("supplier") ?? false} />
          </TableCell>
        );
      case "processor":
        return (
          <TableCell key={key} className="text-center">
            <BooleanCheckbox checked={text.roles?.includes("processor") ?? false} />
          </TableCell>
        );
      case "textCategoryName":
        return <TableCell key={key}>{text.textCategoryName ?? fallback}</TableCell>;
      case "textBlock":
        return (
          <TableCell key={key} className="max-w-xs truncate">
            {text.textBlock}
          </TableCell>
        );
      case "categories": {
        const enabled = USAGE_CATEGORY_MAP.filter(({ field }) => text[field]).map(
          ({ key: cat }) => TEXT_USAGE_CATEGORY_LABELS[cat],
        );
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
      <div className="flex justify-end">
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({ key: col.key, label: col.label }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {texts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No texts found
                </TableCell>
              </TableRow>
            ) : (
              texts.map((text) => (
                <TableRow key={text.uuid}>
                  {visibleColumns.map((col) => renderCell(text, col.key))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
