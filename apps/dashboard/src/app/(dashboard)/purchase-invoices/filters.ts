import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { invoiceDocumentTypes, purchaseInvoiceBlockReasons } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  INVOICE_DOCUMENT_TYPE_LABELS,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseInvoiceFilters = (
  suppliers: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "documentType",
    kind: "select",
    label: "Type",
    options: invoiceDocumentTypes.map((type) => ({
      value: type,
      label: INVOICE_DOCUMENT_TYPE_LABELS[type],
    })),
  },
  {
    key: "supplier",
    kind: "select",
    label: "Supplier",
    placeholder: "All suppliers",
    options: suppliers.map((supplier) => ({
      value: supplier.uuid,
      label: companyOptionLabel(supplier),
    })),
  },
  {
    key: "blockReason",
    kind: "select",
    label: "Block reason",
    options: purchaseInvoiceBlockReasons.map((reason) => ({
      value: reason,
      label: PURCHASE_INVOICE_BLOCK_REASON_LABELS[reason],
    })),
  },
  { key: "invoiceDate", kind: "dateRange", label: "Invoice date" },
  { key: "bookingDate", kind: "dateRange", label: "Booking date" },
  { key: "outstanding", kind: "numberRange", label: "Outstanding" },
  {
    key: "blocked",
    kind: "select",
    label: "Blocked",
    placeholder: "Any",
    options: [
      { value: "true", label: "Blocked" },
      { value: "false", label: "Not blocked" },
    ],
  },
  {
    key: "cancelled",
    kind: "select",
    label: "Cancelled",
    placeholder: "Any",
    options: [
      { value: "false", label: "Not cancelled" },
      { value: "true", label: "Cancelled" },
    ],
  },
];
