import { z } from "zod";
import { invoicePaymentTerms, invoiceVatScenarios } from "@/lib/enums";

export const createInvoiceSchema = () =>
  z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    companyUuid: z.string().optional(),
    debtorNo: z.string().optional(),
    invoiceDate: z.string().optional(),
    expirationDate: z.string().optional(),
    invoiceAmountExclVat: z.string().optional(),
    invoiceAmountInclVat: z.string().optional(),
    creditRestriction: z.string().optional(),
    invoiceTotal: z.string().optional(),
    outstanding: z.string().optional(),
    calculateVat: z.boolean(),
    printed: z.boolean(),
    mailed: z.boolean(),
    vatScenario: z.enum(invoiceVatScenarios).optional(),
    paymentTerms: z.enum(invoicePaymentTerms).optional(),
    explanation: z.string().optional(),
  });

export type InvoiceFormValues = z.infer<ReturnType<typeof createInvoiceSchema>>;
