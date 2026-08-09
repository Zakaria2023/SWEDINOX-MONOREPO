import { TextListItem } from "@/app/(dashboard)/texts/actions";
import { dateCell, ExportColumn, textCell, yesNoCell } from "@/lib/excel";
import {
  activeTextUsageCategories,
  TEXT_USAGE_CATEGORY_FIELDS,
  TextUsageCategoryField,
} from "@/lib/helpers";
import { TEXT_USAGE_CATEGORY_LABELS } from "@/lib/labels";

/**
 * The texts overview as a sheet — see app/(dashboard)/orders/columns.ts.
 *
 * The tail of this list is generated rather than written out: a text carries one
 * boolean per document it may appear on, and those columns are declared once in
 * TEXT_USAGE_CATEGORY_FIELDS. Spelling them out here would be a second list to
 * keep in step with the schema.
 */

export type TextColumnKey =
  | "title"
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
  | TextUsageCategoryField;

const BASE_COLUMNS: Array<ExportColumn<TextListItem, TextColumnKey>> = [
  {
    key: "title",
    label: "Title",
    defaultVisible: true,
    value: (row) => textCell(row.title),
  },
  {
    key: "companyId",
    label: "Company code",
    defaultVisible: true,
    value: (row) => row.companyId ?? null,
  },
  {
    key: "companyName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "customer",
    label: "Customer",
    defaultVisible: true,
    value: (row) => yesNoCell(row.roles?.includes("customer") ?? false),
  },
  {
    key: "supplier",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => yesNoCell(row.roles?.includes("supplier") ?? false),
  },
  {
    key: "processor",
    label: "Processor",
    defaultVisible: true,
    value: (row) => yesNoCell(row.roles?.includes("processor") ?? false),
  },
  {
    key: "textCategoryName",
    label: "Text group",
    defaultVisible: true,
    value: (row) => textCell(row.textCategoryName),
  },
  {
    key: "textBlock",
    label: "Text",
    defaultVisible: true,
    value: (row) => textCell(row.textBlock),
  },
  {
    key: "categories",
    label: "Categories",
    defaultVisible: true,
    value: (row) => textCell(activeTextUsageCategories(row).join(", ")),
  },
  {
    key: "updatedAt",
    label: "Modified",
    defaultVisible: true,
    value: (row) => dateCell(row.updatedAt),
  },
  {
    key: "createdAt",
    label: "Created",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
];

const USAGE_COLUMNS: Array<ExportColumn<TextListItem, TextColumnKey>> =
  TEXT_USAGE_CATEGORY_FIELDS.map(({ key, field }) => ({
    key: field,
    label: TEXT_USAGE_CATEGORY_LABELS[key],
    defaultVisible: true,
    value: (row: TextListItem) => yesNoCell(row[field]),
  }));

export const TEXT_COLUMNS: Array<ExportColumn<TextListItem, TextColumnKey>> = [
  ...BASE_COLUMNS,
  ...USAGE_COLUMNS,
];
