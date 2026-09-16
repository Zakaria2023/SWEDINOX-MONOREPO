import { ComplaintListItem } from "@/app/(dashboard)/complaints/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { customerGroupLabel, salesRepresentativeLabel } from "@/lib/helpers";
import { ComplaintOverviewFields } from "@/lib/server/complaint-overview";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_CAUSE_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/lib/labels";

/**
 * The complaints overview as a sheet: the reference's 29 columns, in its order,
 * all on its screen.
 *
 * The Complaint lines overview is these same columns repeated per line plus
 * two of its own, so the list is a factory both overviews build from.
 */

export type ComplaintOverviewRow = ComplaintOverviewFields & {
  productCode: string | null;
  productDescription: string | null;
};

export type ComplaintOverviewColumnKey =
  | "reportYear"
  | "reportMonth"
  | "reportDate"
  | "complaintNumber"
  | "companyCode"
  | "companyName"
  | "customerGroup"
  | "accountManager"
  | "category"
  | "status"
  | "resolutionDays"
  | "description"
  | "cause"
  | "explanationOfCause"
  | "solution"
  | "explanationOfSolution"
  | "complaintType"
  | "correspondenceName"
  | "deadline"
  | "document"
  | "productCode"
  | "productDescription"
  | "responsible"
  | "statusDate"
  | "capturedBy"
  | "purchaserSeller"
  | "representative"
  | "creationDate"
  | "totalCosts";

export type ComplaintColumnKey = ComplaintOverviewColumnKey;

export const complaintOverviewColumns = <T extends ComplaintOverviewRow>(
  labels: Partial<Record<ComplaintOverviewColumnKey, string>> = {},
): Array<ExportColumn<T, ComplaintOverviewColumnKey>> =>
  [
    {
      key: "reportYear" as const,
      label: "Year (Report date)",
      value: (row: T) => numberCell(row.reportYear),
    },
    {
      key: "reportMonth" as const,
      label: "Month (Report date)",
      value: (row: T) => numberCell(row.reportMonth),
    },
    {
      key: "reportDate" as const,
      label: "Report date",
      value: (row: T) => dateCell(row.reportDate),
    },
    {
      key: "complaintNumber" as const,
      label: "Complaint number",
      value: (row: T) => numberCell(row.complaintNumber),
    },
    {
      key: "companyCode" as const,
      label: "Company code",
      value: (row: T) => numberCell(row.companyCode),
    },
    {
      key: "companyName" as const,
      label: "Company",
      value: (row: T) => textCell(row.companyName),
    },
    {
      key: "customerGroup" as const,
      label: "Customer group",
      value: (row: T) =>
        textCell(row.customerGroup ? customerGroupLabel(row.customerGroup) : null),
    },
    {
      key: "accountManager" as const,
      label: "Account manager",
      value: (row: T) =>
        textCell(
          row.accountManager
            ? salesRepresentativeLabel(row.accountManager)
            : null,
        ),
    },
    {
      key: "category" as const,
      label: "Category",
      value: (row: T) =>
        textCell(row.category ? COMPLAINT_CATEGORY_LABELS[row.category] : null),
    },
    {
      key: "status" as const,
      label: "Status",
      value: (row: T) =>
        textCell(row.status ? COMPLAINT_STATUS_LABELS[row.status] : null),
    },
    {
      key: "resolutionDays" as const,
      label: "Resolution time (calendar days)",
      value: (row: T) => numberCell(row.resolutionDays),
    },
    {
      key: "description" as const,
      label: "Complaint description",
      value: (row: T) => textCell(row.description),
    },
    {
      key: "cause" as const,
      label: "Cause",
      value: (row: T) =>
        textCell(row.cause ? COMPLAINT_CAUSE_LABELS[row.cause] : null),
    },
    {
      key: "explanationOfCause" as const,
      label: "Explanation cause",
      value: (row: T) => textCell(row.explanationOfCause),
    },
    {
      key: "solution" as const,
      label: "Solution",
      value: (row: T) =>
        textCell(row.solution ? COMPLAINT_SOLUTION_LABELS[row.solution] : null),
    },
    {
      key: "explanationOfSolution" as const,
      label: "Explanation solution",
      value: (row: T) => textCell(row.explanationOfSolution),
    },
    {
      key: "complaintType" as const,
      label: "Complaint type",
      value: (row: T) =>
        textCell(
          row.complaintType ? COMPLAINT_TYPE_LABELS[row.complaintType] : null,
        ),
    },
    {
      key: "correspondenceName" as const,
      label: "Correspondence name",
      value: (row: T) => textCell(row.correspondenceName),
    },
    {
      key: "deadline" as const,
      label: "Deadline",
      value: (row: T) => dateCell(row.deadline),
    },
    {
      key: "document" as const,
      label: "Order/quote",
      value: (row: T) => textCell(row.documentCode),
    },
    {
      key: "productCode" as const,
      label: "Product code",
      value: (row: T) => textCell(row.productCode),
    },
    {
      key: "productDescription" as const,
      label: "Product description",
      value: (row: T) => textCell(row.productDescription),
    },
    {
      key: "responsible" as const,
      label: "Responsible",
      value: (row: T) => textCell(row.responsible),
    },
    {
      key: "statusDate" as const,
      label: "Status date",
      value: (row: T) => dateCell(row.statusDate),
    },
    {
      key: "capturedBy" as const,
      label: "Captured by",
      value: (row: T) => textCell(row.capturedBy),
    },
    {
      key: "purchaserSeller" as const,
      label: "Purchaser/seller",
      value: (row: T) => textCell(row.purchaserSeller),
    },
    {
      key: "representative" as const,
      label: "Representative",
      value: (row: T) =>
        textCell(
          row.representative
            ? salesRepresentativeLabel(row.representative)
            : null,
        ),
    },
    {
      key: "creationDate" as const,
      label: "Creation date",
      value: (row: T) => dateCell(row.creationDate),
    },
    {
      key: "totalCosts" as const,
      label: "Total costs",
      value: (row: T) => numberCell(row.totalCosts),
    },
  ].map((column) => ({
    ...column,
    label: labels[column.key] ?? column.label,
    defaultVisible: true,
  }));

export const COMPLAINT_COLUMNS = complaintOverviewColumns<ComplaintListItem>();
