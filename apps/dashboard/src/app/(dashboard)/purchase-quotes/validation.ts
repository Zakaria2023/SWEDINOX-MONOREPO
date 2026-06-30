import { z } from "zod";
import {
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  orderWeightTypes,
  purchaseOrderTypes,
} from "@/lib/enums";
import { todayDateString, currentYear } from "@/lib/helpers";

export const purchaseQuoteSchema = z
  .object({
    // Header
    supplierUuid: z.string().optional(),
    agentUuid: z.string().optional(),
    contactUuid: z.string().optional(),
    purchaser: z.string().optional(),
    reference: z.string().optional(),
    ourReference: z.string().optional(),
    orderCategory: z.string().optional(),

    // Quote
    quoteNumber: z.string().optional(),
    quoteDate: z.string().optional(),
    validUntil: z.string().optional(),

    // Purchase order type
    purchaseOrderType: z.enum(purchaseOrderTypes).optional(),
    weightType: z.enum(orderWeightTypes).optional(),
    isOverlengte: z.boolean(),
    isConsignment: z.boolean(),

    // Finances
    paymentTerms: z.enum(invoicePaymentTerms).optional(),

    // Delivery
    deliveryTerms: z.enum(deliveryTerms).optional(),
    deliveryAddressUuid: z.string().optional(),
    arrangeTransport: z.boolean(),
    pickupDropoffCdPurchases: z.boolean(),
    supplierAddressUuid: z.string().optional(),
    deliveryType: z.enum(deliveryTypes),
    deliveryDate: z.string().optional(),
    deliveryWeek: z.string().optional(),
    deliveryYear: z.string().optional(),
    deliveryRemark: z.string().optional(),

    // Documents
    documents: z
      .array(z.object({ id: z.string(), fileName: z.string() }))
      .optional(),
  })
  .refine((data) => !!data.supplierUuid !== !!data.agentUuid, {
    message: "Select either a supplier or an agent, not both",
    path: ["supplierUuid"],
  });

export type PurchaseQuoteFormValues = z.infer<typeof purchaseQuoteSchema>;

export const DEFAULT_PURCHASE_QUOTE: PurchaseQuoteFormValues = {
  supplierUuid: "",
  agentUuid: "",
  contactUuid: "",
  purchaser: "",
  reference: "",
  ourReference: "",
  orderCategory: "",

  quoteNumber: "",
  quoteDate: todayDateString(),
  validUntil: "",

  purchaseOrderType: undefined,
  weightType: undefined,
  isOverlengte: false,
  isConsignment: false,

  paymentTerms: undefined,

  deliveryTerms: undefined,
  deliveryAddressUuid: "",
  arrangeTransport: false,
  pickupDropoffCdPurchases: false,
  supplierAddressUuid: "",
  deliveryType: "date",
  deliveryDate: todayDateString(),
  deliveryWeek: "",
  deliveryYear: String(currentYear()),
  deliveryRemark: "",

  documents: [],
};
