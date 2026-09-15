import { SelectVisitReports } from "@/db";
import { VisitReportInput } from "./actions";
import { VisitReportFormValues } from "./validation";

/** A stored visit report in the shape its form edits. */
export const visitReportToFormValues = (
  report: SelectVisitReports,
): VisitReportFormValues => ({
  companyUuid: report.companyUuid,
  representative: report.representative ?? "",
  visitedBy: report.visitedBy ?? "",
  contactUuid: report.contactUuid ?? "",
  contactMethod: report.contactMethod ?? "",
  visitDate: report.visitDate ?? "",
  visitTime: report.visitTime ?? "",
  hasTakenPlace: report.hasTakenPlace,
  visitReason: report.visitReason ?? "",
  attentionPoint: report.attentionPoint ?? "",
  remarks: report.remarks ?? "",

  categories: report.categories ?? [],
  readers: report.readers ?? [],
});

/**
 * The form's values as columns.
 *
 * Both creating and saving a section go through here, so the two can't
 * disagree about how a blank select or an empty number reaches the database.
 */
export const formValuesToVisitReportInput = (
  values: VisitReportFormValues,
): VisitReportInput => ({
  companyUuid: values.companyUuid,
  representative: values.representative || null,
  visitedBy: values.visitedBy || null,
  contactUuid: values.contactUuid || null,
  contactMethod: values.contactMethod || null,
  visitDate: values.visitDate || null,
  visitTime: values.visitTime || null,
  hasTakenPlace: values.hasTakenPlace,
  visitReason: values.visitReason || null,
  attentionPoint: values.attentionPoint || null,
  remarks: values.remarks || null,

  categories: values.categories,
  readers: values.readers,
});
