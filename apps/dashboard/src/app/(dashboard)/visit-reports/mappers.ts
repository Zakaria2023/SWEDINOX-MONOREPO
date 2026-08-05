import { SelectVisitReports } from "@/db";
import { toDateInput } from "@/lib/helpers";
import { VisitReportInput } from "./actions";
import { VisitReportFormValues } from "./validation";

// The planning grid is one row per month, so a report with nothing planned
// still needs twelve empty slots for the grid to render.
const MONTHS_IN_YEAR = 12;

/** A stored visit report in the shape its form edits. */
export const visitReportToFormValues = (
  report: SelectVisitReports,
): VisitReportFormValues => ({
  companyUuid: report.companyUuid,
  representative: report.representative ?? "",
  visitedBy: report.visitedBy ?? "",
  address: report.address ?? "",
  postalCode: report.postalCode ?? "",
  city: report.city ?? "",
  telephone: report.telephone ?? "",
  fax: report.fax ?? "",
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

  industry: report.industry ?? "",
  classification: report.classification ?? "",
  visitFrequency: String(report.visitFrequency ?? 0),
  callFrequencyPerYear: String(report.callFrequencyPerYear ?? 0),
  targetDateNextVisit: toDateInput(report.targetDateNextVisit),
  nextVisitReason: report.nextVisitReason ?? "",
  potentialAnnualRevenue: report.potentialAnnualRevenue ?? "0.00",
  targetAnnualRevenue: report.targetAnnualRevenue ?? "0.00",
  potentialAnnualSales: report.potentialAnnualSales ?? "0.000",
  targetAnnualSales: report.targetAnnualSales ?? "0.000",
  numberOfEmployees: String(report.numberOfEmployees ?? 0),

  visitPlanning:
    report.visitPlanning && report.visitPlanning.length > 0
      ? report.visitPlanning
      : Array.from({ length: MONTHS_IN_YEAR }, () => ({
          call: false,
          visit: false,
        })),
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
  address: values.address || null,
  postalCode: values.postalCode || null,
  city: values.city || null,
  telephone: values.telephone || null,
  fax: values.fax || null,
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

  industry: values.industry || null,
  classification: values.classification || null,
  visitFrequency: values.visitFrequency ? Number(values.visitFrequency) : 0,
  callFrequencyPerYear: values.callFrequencyPerYear
    ? Number(values.callFrequencyPerYear)
    : 0,
  targetDateNextVisit: values.targetDateNextVisit
    ? new Date(values.targetDateNextVisit)
    : null,
  nextVisitReason: values.nextVisitReason || null,
  potentialAnnualRevenue: values.potentialAnnualRevenue || "0.00",
  targetAnnualRevenue: values.targetAnnualRevenue || "0.00",
  potentialAnnualSales: values.potentialAnnualSales || "0.000",
  targetAnnualSales: values.targetAnnualSales || "0.000",
  numberOfEmployees: values.numberOfEmployees
    ? Number(values.numberOfEmployees)
    : 0,

  visitPlanning: values.visitPlanning,
});
