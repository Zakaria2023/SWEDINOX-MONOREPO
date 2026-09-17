import { VisitReportDialogValues } from "@/app/(dashboard)/companies/validation";
import { SelectContacts } from "@/db/schema/contacts";
import {
  InsertVisitReports,
  SelectVisitReports,
} from "@/db/schema/visit-reports";

// The visit report dialog edits only the visit basics — date, time, contact
// method, reason, linked contact, and whether it took place. Columns the
// dialog doesn't show (marketing, categories, readers, planning) are never
// written on update, so values set elsewhere survive later edits. On this
// standalone page contacts are already persisted, so the dialog's
// `contactIndex` field carries the real contact uuid instead of an array
// index.

export const visitReportRowToDialogValues = (
  row: SelectVisitReports,
): VisitReportDialogValues => ({
  visitDate: row.visitDate ?? "",
  visitTime: row.visitTime ?? "",
  contactMethod: row.contactMethod ?? "",
  hasTakenPlace: row.hasTakenPlace,
  visitReasons: row.visitReasons ?? [],
  contactIndex: row.contactUuid ?? "",
});

export const visitReportValuesToColumns = (
  values: VisitReportDialogValues,
): Partial<InsertVisitReports> => ({
  visitDate: values.visitDate || null,
  visitTime: values.visitTime || null,
  contactMethod: (values.contactMethod ||
    null) as InsertVisitReports["contactMethod"],
  hasTakenPlace: values.hasTakenPlace,
  visitReasons: values.visitReasons,
});

export const contactDisplayName = (
  contact: Pick<SelectContacts, "firstName" | "lastName" | "email">,
): string =>
  [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
  contact.email ||
  "Contact";
