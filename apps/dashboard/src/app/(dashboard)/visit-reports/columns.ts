import { VisitReportListItem } from "@/app/(dashboard)/visit-reports/actions";
import { dateCell, ExportColumn, textCell, yesNoCell } from "@/lib/excel";
import {
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";

/**
 * The visit reports overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type VisitReportColumnKey =
  | "id"
  | "companyName"
  | "visitedBy"
  | "contactMethod"
  | "visitDate"
  | "hasTakenPlace"
  | "visitReason"
  | "representative"
  | "visitTime"
  | "contactUuid"
  | "city"
  | "postalCode"
  | "telephone"
  | "fax"
  | "address"
  | "attentionPoint"
  | "remarks"
  | "createdAt";

export const VISIT_REPORT_COLUMNS: Array<
  ExportColumn<VisitReportListItem, VisitReportColumnKey>
> = [
  { key: "id", label: "ID", defaultVisible: true, value: (row) => row.id },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "visitedBy",
    label: "Visited By",
    defaultVisible: true,
    value: (row) => textCell(row.visitedBy),
  },
  {
    key: "contactMethod",
    label: "Contact Method",
    defaultVisible: true,
    value: (row) =>
      row.contactMethod
        ? VISIT_REPORT_CONTACT_METHOD_LABELS[row.contactMethod]
        : null,
  },
  {
    key: "visitDate",
    label: "Visit Date",
    defaultVisible: true,
    value: (row) => dateCell(row.visitDate),
  },
  {
    key: "hasTakenPlace",
    label: "Happened",
    defaultVisible: true,
    value: (row) => yesNoCell(row.hasTakenPlace),
  },
  {
    key: "visitReason",
    label: "Visit Reason",
    defaultVisible: true,
    value: (row) =>
      row.visitReason ? VISIT_REPORT_REASON_LABELS[row.visitReason] : null,
  },
  {
    key: "representative",
    label: "Representative",
    defaultVisible: false,
    value: (row) => textCell(row.representative),
  },
  {
    key: "visitTime",
    label: "Visit Time",
    defaultVisible: false,
    value: (row) => textCell(row.visitTime),
  },
  {
    key: "contactUuid",
    label: "Contact",
    defaultVisible: false,
    value: (row) => textCell(row.contactUuid),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: false,
    value: (row) => textCell(row.city),
  },
  {
    key: "postalCode",
    label: "Postal Code",
    defaultVisible: false,
    value: (row) => textCell(row.postalCode),
  },
  {
    key: "telephone",
    label: "Telephone",
    defaultVisible: false,
    value: (row) => textCell(row.telephone),
  },
  {
    key: "fax",
    label: "Fax",
    defaultVisible: false,
    value: (row) => textCell(row.fax),
  },
  {
    key: "address",
    label: "Address",
    defaultVisible: false,
    value: (row) => textCell(row.address),
  },
  {
    key: "attentionPoint",
    label: "Attention Point",
    defaultVisible: false,
    value: (row) => textCell(row.attentionPoint),
  },
  {
    key: "remarks",
    label: "Remarks",
    defaultVisible: false,
    value: (row) => textCell(row.remarks),
  },
  {
    key: "createdAt",
    label: "Created At",
    defaultVisible: false,
    value: (row) => dateCell(row.createdAt),
  },
];
