import { z } from "zod";
import {
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  purchaseInvoiceBlockReasons,
  purchaseInvoiceFiscalBases,
} from "@/lib/enums";

export const purchaseInvoiceItemSchema = z.object({
  purchaseOrderItemUuid: z.string().min(1, "Order line is required"),
  quantity: z.string().min(1, "Quantity is required"),
});

export const purchaseInvoiceSurchargeSchema = z.object({
  booked: z.boolean(),
  orderRef: z.string().optional(),
  description: z
    .union([z.enum(invoiceSurchargeDescriptions), z.literal("")])
    .optional(),
  revenueGroup: z.string().optional(),
  surcharge: z.string().optional(),
  unit: z.string().optional(),
  surchargeBasis: z.string().optional(),
  amount: z.string().optional(),
  vatRate: z.string().optional(),
});

export type PurchaseInvoiceSurchargeValues = z.infer<
  typeof purchaseInvoiceSurchargeSchema
>;

export const createPurchaseInvoiceSchema = () =>
  z
    .object({
      companyUuid: z.string().optional(),
      items: z.array(purchaseInvoiceItemSchema).optional(),
      // Who billed us, when that is not the supplier themselves.
      invoiceSentByCompanyUuid: z.string().optional(),
      invoiceSentByContactUuid: z.string().optional(),
      bookingDate: z.string().optional(),
      invoiceDate: z.string().optional(),
      expirationDate: z.string().optional(),
      invoiceNumberSupplier: z.string().optional(),
      creditorNo: z.string().optional(),
      creditorNo2: z.string().optional(),
      basisForFiscalPeriod: z.enum(purchaseInvoiceFiscalBases),
      // The two figures a clerk types. Everything else in the accounting
      // summary is derived from the lines received.
      invoiceTotal: z.string(),
      creditRestriction: z.string().optional(),
      purchaseOrderNumber: z.string().optional(),
      paymentTerms: z.enum(invoicePaymentTerms).optional(),
      blocked: z.boolean(),
      blockReason: z.enum(purchaseInvoiceBlockReasons).optional(),
      remarks: z.string().optional(),
      documents: z
        .array(z.object({ id: z.string(), fileName: z.string() }))
        .optional(),
      surchargeLines: z.array(purchaseInvoiceSurchargeSchema),
    })
    .refine(
      (data) => !data.blocked || !!data.blockReason,
      { message: "Block reason is required when invoice is blocked", path: ["blockReason"] },
    );

export type PurchaseInvoiceFormValues = z.infer<ReturnType<typeof createPurchaseInvoiceSchema>>;
