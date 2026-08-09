import { ComplaintListItem } from "@/app/(dashboard)/complaints/actions";
import { ComplaintCategory, ComplaintType } from "@/lib/enums";
import { dateCell, ExportColumn, textCell } from "@/lib/excel";
import { COMPLAINT_CATEGORY_LABELS, COMPLAINT_TYPE_LABELS } from "@/lib/labels";

/**
 * The complaints overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type ComplaintColumnKey =
  | "id"
  | "companyName"
  | "contact"
  | "complaintType"
  | "category"
  | "reportDate"
  | "productCode";

export const COMPLAINT_COLUMNS: Array<
  ExportColumn<ComplaintListItem, ComplaintColumnKey>
> = [
  { key: "id", label: "ID", defaultVisible: true, value: (row) => row.id },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "contact",
    label: "Contact",
    defaultVisible: true,
    value: (row) =>
      textCell(
        [row.contactFirstName, row.contactLastName].filter(Boolean).join(" "),
      ),
  },
  {
    key: "complaintType",
    label: "Type",
    defaultVisible: true,
    value: (row) =>
      row.complaintType
        ? (COMPLAINT_TYPE_LABELS[row.complaintType as ComplaintType] ??
          row.complaintType)
        : null,
  },
  {
    key: "category",
    label: "Category",
    defaultVisible: true,
    value: (row) =>
      row.category
        ? (COMPLAINT_CATEGORY_LABELS[row.category as ComplaintCategory] ??
          row.category)
        : null,
  },
  {
    key: "reportDate",
    label: "Report Date",
    defaultVisible: true,
    value: (row) => dateCell(row.reportDate),
  },
  {
    key: "productCode",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
];
