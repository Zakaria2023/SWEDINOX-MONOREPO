import { invoiceFrequencies, invoicingMethods } from "@/lib/enums";
import { z } from "zod";

export const companyInvoicingSchema = z.object({
  invoicingMethod: z.union([
    z.enum(invoicingMethods),
    z.literal(""),
    z.undefined(),
  ]),
  collectiveInvoicing: z.boolean(),
  invoicePackagingAtZeroPrice: z.boolean(),
  printCommodityCode: z.boolean(),
  invoiceFrequency: z.enum(invoiceFrequencies),
  invoicePrintEnabled: z.boolean(),
  invoicePrintCount: z.number().int().min(1),
  invoiceEmailEnabled: z.boolean(),
  invoiceEmailTo: z.string().optional(),
  printEmailZeroValueInvoices: z.boolean(),
  sendXmlWithInvoice: z.boolean(),
});

export type CompanyInvoicingFormValues = z.infer<typeof companyInvoicingSchema>;
