import { z } from "zod";
import { invoicePaymentTerms, invoiceSurchargeDescriptions, invoiceVatScenarios } from "@/lib/enums";

export const createInvoiceSchema = () =>
  z.object({
    companyUuid: z.string().optional(),
    debtorNo: z.string().optional(),
    invoiceDate: z.string().optional(),
    expirationDate: z.string().optional(),
    calculateVat: z.boolean(),
    printed: z.boolean(),
    mailed: z.boolean(),
    vatScenario: z.enum(invoiceVatScenarios).optional(),
    paymentTerms: z.enum(invoicePaymentTerms).optional(),
    explanation: z.string().optional(),
  });

export type InvoiceFormValues = z.infer<ReturnType<typeof createInvoiceSchema>>;

export const surchargeSchema = z.object({
  order: z.number().int().min(0).optional(),
  description: z.enum(invoiceSurchargeDescriptions),
  surcharge: z.string().optional(),
  unit: z.string().optional(),
});

export type SurchargeFormValues = z.infer<typeof surchargeSchema>;
