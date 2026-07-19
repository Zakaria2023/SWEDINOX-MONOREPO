import { z } from "zod";
import {
  companyClassifications,
  visitReportCategories,
  visitReportContactMethods,
  visitReportReasons,
} from "@/lib/enums";

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

    // Marketing
    industry: z.string().optional(),
    classification: z
      .union([z.enum(companyClassifications), z.literal("")])
      .optional(),
    visitFrequency: z.string().optional(),
    callFrequencyPerYear: z.string().optional(),
    targetDateNextVisit: z.string().optional(),
    nextVisitReason: z
      .union([z.enum(visitReportReasons), z.literal("")])
      .optional(),
    potentialAnnualRevenue: z.string().optional(),
    targetAnnualRevenue: z.string().optional(),
    potentialAnnualSales: z.string().optional(),
    targetAnnualSales: z.string().optional(),
    numberOfEmployees: z.string().optional(),

    // Visit planning
    visitPlanning: z.array(z.object({ call: z.boolean(), visit: z.boolean() })),
  });

export type VisitReportFormValues = z.infer<
  ReturnType<typeof createVisitReportSchema>
>;
