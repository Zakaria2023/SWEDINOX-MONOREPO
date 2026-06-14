import { z } from "zod";
import { visitReportContactMethodValues } from "@/db/schema/visit-report-contact-method";

export const createVisitReportSchema = () =>
  z.object({
    companyUuid: z.string().min(1, "Company is required"),
    representative: z.string().optional(),
    visitedBy: z.string().optional(),
    address: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    telephone: z.string().optional(),
    fax: z.string().optional(),
    contact: z.string().optional(),
    contactMethod: z
      .union([z.enum(visitReportContactMethodValues), z.literal("")])
      .optional(),
    visitDate: z.string().optional(),
    visitTime: z.string().optional(),
    hasTakenPlace: z.boolean(),
    visitReason: z.string().optional(),
    attentionPoint: z.string().optional(),
    remarks: z.string().optional(),
  });

export type VisitReportFormValues = z.infer<
  ReturnType<typeof createVisitReportSchema>
>;
