import { z } from "zod";
import { visitReportContactMethods, visitReportReasons } from "@/lib/enums";

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
    contactUuid: z.string().optional(),
    contactMethod: z
      .union([z.enum(visitReportContactMethods), z.literal("")])
      .optional(),
    visitDate: z.string().optional(),
    visitTime: z.string().optional(),
    hasTakenPlace: z.boolean(),
    visitReason: z
      .union([z.enum(visitReportReasons), z.literal("")])
      .optional(),
    attentionPoint: z.string().optional(),
    remarks: z.string().optional(),
  });

export type VisitReportFormValues = z.infer<
  ReturnType<typeof createVisitReportSchema>
>;
