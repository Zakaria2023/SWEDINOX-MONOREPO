import { z } from "zod";
import { visitReportContactMethods } from "@/lib/enums";

// A tick on the schedule. The month comes from the screen's own selection and
// the company from the row, so nothing here is typed by hand — but it all
// arrives over the wire, and a month of 0 or 13 would file a plan nobody could
// ever see again.
//
// One box at a time, named by the same `visit` / `telephone_contact` pair the
// visit reports use, so a plan and the report that closes it speak of the same
// two kinds of contact.
export const visitPlanSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  kind: z.enum(visitReportContactMethods),
  planned: z.boolean(),
});

export type VisitPlanInput = z.infer<typeof visitPlanSchema>;
