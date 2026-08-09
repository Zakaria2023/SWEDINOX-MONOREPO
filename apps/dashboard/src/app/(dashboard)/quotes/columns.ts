import { QuoteListItem } from "@/app/(dashboard)/quotes/actions";
import { OrderMethod } from "@/lib/enums";
import { dateCell, ExportColumn, textCell } from "@/lib/excel";
import { ORDER_METHOD_LABELS } from "@/lib/labels";

/** The quotes overview as a sheet — see app/(dashboard)/orders/columns.ts. */

export type QuoteColumnKey =
  | "id"
  | "companyName"
  | "contact"
  | "requestMethod"
  | "validUntil"
  | "createdAt";

export const QUOTE_COLUMNS: Array<ExportColumn<QuoteListItem, QuoteColumnKey>> =
  [
    { key: "id", label: "#", defaultVisible: true, value: (row) => row.id },
    {
      key: "companyName",
      label: "Customer",
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
      key: "requestMethod",
      label: "Request",
      defaultVisible: true,
      value: (row) =>
        row.requestMethod
          ? (ORDER_METHOD_LABELS[row.requestMethod as OrderMethod] ??
            row.requestMethod)
          : null,
    },
    {
      key: "validUntil",
      label: "Valid Until",
      defaultVisible: true,
      value: (row) => dateCell(row.validUntil),
    },
    {
      key: "createdAt",
      label: "Created",
      defaultVisible: true,
      value: (row) => dateCell(row.createdAt),
    },
  ];
