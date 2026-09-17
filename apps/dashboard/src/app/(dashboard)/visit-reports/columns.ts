import { VisitReportListItem } from "@/app/(dashboard)/visit-reports/actions";
import { dateCell, ExportColumn, textCell, yesNoCell } from "@/lib/excel";
import { visitReasonsLabel } from "@/lib/helpers";
import { VISIT_REPORT_CONTACT_METHOD_LABELS } from "@/lib/labels";

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
  | "visitReasons"
  | "representative"
  | "visitTime"
  | "contactUuid"
  | "attentionPoint"
  | "remarks"
  | "visitResult"
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
    key: "visitReasons",
    label: "Visit Reasons",
    defaultVisible: true,
    value: (row) => textCell(visitReasonsLabel(row.visitReasons)),
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
    key: "visitResult",
    label: "Visit Result",
    defaultVisible: false,
    value: (row) => textCell(row.visitResult),
  },
  {
    key: "createdAt",
    label: "Created At",
    defaultVisible: false,
    value: (row) => dateCell(row.createdAt),
  },
];
