import { z } from "zod";
import {
  invoicePaymentTerms,
  purchaseInvoiceBlockReasons,
  purchaseInvoiceFiscalBases,
} from "@/lib/enums";

export const purchaseInvoiceItemSchema = z.object({
  stockUuid: z.string().min(1, "Stock item is required"),
  quantity: z.string().min(1, "Quantity is required"),
});

export const createPurchaseInvoiceSchema = () =>
  z
    .object({
      companyUuid: z.string().optional(),
      items: z.array(purchaseInvoiceItemSchema).optional(),
      invoiceSentByContactUuid: z.string().optional(),
      bookingDate: z.string().optional(),
      invoiceDate: z.string().optional(),
      expirationDate: z.string().optional(),
      invoiceNumberSupplier: z.string().optional(),
      creditorNo: z.string().optional(),
      creditorNo2: z.string().optional(),
      basisForFiscalPeriod: z.enum(purchaseInvoiceFiscalBases),
      invoiceTotal: z.string(),
      purchaseOrderNumber: z.string().optional(),
      paymentTerms: z.enum(invoicePaymentTerms).optional(),
      blocked: z.boolean(),
      blockReason: z.enum(purchaseInvoiceBlockReasons).optional(),
      materials: z.string(),
      optionsAmount: z.string(),
      surcharges: z.string(),
      vatHigh: z.string(),
      vatMiddle: z.string(),
      vatLow: z.string(),
      creditRestriction: z.string(),
      remarks: z.string().optional(),
      documents: z
        .array(z.object({ id: z.string(), fileName: z.string() }))
        .optional(),
    })
    .refine(
      (data) => !data.blocked || !!data.blockReason,
      { message: "Block reason is required when invoice is blocked", path: ["blockReason"] },
    );

export type PurchaseInvoiceFormValues = z.infer<ReturnType<typeof createPurchaseInvoiceSchema>>;
