import { z } from "zod";
import {
  visitReportCategories,
  visitReportContactMethods,
  visitReportReasons,
} from "@/lib/enums";

export const createVisitReportSchema = () =>
  z.object({
    companyUuid: z.string().min(1, "Company is required"),
    representative: z.string().optional(),
    visitedBy: z.string().optional(),
    contactUuid: z.string().optional(),
    contactMethod: z
      .union([z.enum(visitReportContactMethods), z.literal("")])
      .optional(),
    visitDate: z.string().optional(),
    visitTime: z.string().optional(),
    hasTakenPlace: z.boolean(),
    visitReasons: z.array(z.enum(visitReportReasons)),
    attentionPoint: z.string().optional(),
    remarks: z.string().optional(),
    visitResult: z.string().optional(),

    // Categories
    categories: z.array(z.enum(visitReportCategories)),

    // Readers
    readers: z.array(
      z.object({
        userId: z.string(),
        toRead: z.boolean(),
        read: z.boolean(),
      }),
    ),
  });

export type VisitReportFormValues = z.infer<
  ReturnType<typeof createVisitReportSchema>
>;
