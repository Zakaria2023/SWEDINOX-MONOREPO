import { currencies, invoicePaymentTerms } from "@/lib/enums";
import { z } from "zod";

export const companyDebtorSchema = z.object({
  debtorNumber: z
    .string()
    .max(20, "A debtor number is at most 20 characters")
    .optional(),
  debtorCompanyUuid: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  bankAccount: z.string().optional(),
  postbankAccount: z.string().optional(),
  purchaseOrgCompanyUuid: z.string().optional(),
  memberNumberPurchaseOrg: z.string().optional(),
  calculateVat: z.boolean(),
  reminder: z.boolean(),
  collectInvoicesInMandate: z.boolean(),
  insuranceValidUntil: z.string().optional(),
  creditLimitInsurance: z.string().optional(),
  creditLimit: z.string().optional(),
  creditLimitUninsured: z.string().optional(),
  creditLimitUninsuredDate: z.string().optional(),
  paymentTerms: z.union([
    z.enum(invoicePaymentTerms),
    z.literal(""),
    z.undefined(),
  ]),
  differentPaymentTermsExWorks: z.union([
    z.enum(invoicePaymentTerms),
    z.literal(""),
    z.undefined(),
  ]),
  journalCode: z.number().int().optional().catch(undefined),
  vatNumber: z.string().optional(),
  cocNumber: z.string().optional(),
  currency: z.union([z.enum(currencies), z.literal(""), z.undefined()]),
  isBlocked: z.boolean(),
  blockedByNote: z.string().optional(),
});

export type CompanyDebtorFormValues = z.infer<typeof companyDebtorSchema>;
