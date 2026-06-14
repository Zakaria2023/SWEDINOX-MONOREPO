export enum VisitReportContactMethod {
  Visit = "visit",
  TelephoneContact = "telephone_contact",
}

export const visitReportContactMethodValues = [
  VisitReportContactMethod.Visit,
  VisitReportContactMethod.TelephoneContact,
] as const;

export const VISIT_REPORT_CONTACT_METHOD_LABELS: Record<
  VisitReportContactMethod,
  string
> = {
  [VisitReportContactMethod.Visit]: "Visit",
  [VisitReportContactMethod.TelephoneContact]: "Telephone Contact",
};
