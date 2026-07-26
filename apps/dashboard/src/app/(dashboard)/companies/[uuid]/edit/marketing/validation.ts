import { companyClassifications, visitReportReasons } from "@/lib/enums";
import { z } from "zod";

export const companyMarketingSchema = z.object({
  industry: z.string().optional(),
  classification: z.union([
    z.enum(companyClassifications),
    z.literal(""),
    z.undefined(),
  ]),
  visitFrequency: z.string().optional(),
  callFrequencyPerYear: z.string().optional(),
  targetDateNextVisit: z.string().optional(),
  visitReason: z.union([
    z.enum(visitReportReasons),
    z.literal(""),
    z.undefined(),
  ]),
  potentialAnnualRevenue: z.string().optional(),
  targetAnnualRevenue: z.string().optional(),
  potentialAnnualSales: z.string().optional(),
  targetAnnualSales: z.string().optional(),
  numberOfEmployees: z.string().optional(),
  visitPlanning: z.array(z.object({ call: z.boolean(), visit: z.boolean() })),
});

export type CompanyMarketingFormValues = z.infer<typeof companyMarketingSchema>;
