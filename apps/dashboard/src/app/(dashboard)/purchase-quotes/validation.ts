import { z } from "zod";
import {
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  orderWeightTypes,
  purchaseOrderTypes,
  stockUnits,
} from "@/lib/enums";
import { todayDateString, currentYear } from "@/lib/helpers";

// One quoted line. A gross price with its two discounts, or a net price typed
// straight in — when a gross price is given the server derives the net from it.
export const purchaseQuoteItemSchema = z.object({
  productUuid: z.string().optional(),
  description: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.enum(stockUnits).optional(),
  kg: z.string().optional(),
  lengthMm: z.string().optional(),
  widthMm: z.string().optional(),
  thicknessMm: z.string().optional(),
  grossPrice: z.string().optional(),
  groupDiscountPercent: z.string().optional(),
  lineDiscountPercent: z.string().optional(),
  netPrice: z.string().optional(),
  priceUnit: z.string().optional(),
  internalText: z.string().optional(),
});

export type PurchaseQuoteItemFormValues = z.infer<
  typeof purchaseQuoteItemSchema
>;

export const DEFAULT_PURCHASE_QUOTE_ITEM: PurchaseQuoteItemFormValues = {
  productUuid: "",
  description: "",
  quantity: "",
  unit: "st",
  kg: "",
  lengthMm: "",
  widthMm: "",
  thicknessMm: "",
  grossPrice: "",
  groupDiscountPercent: "",
  lineDiscountPercent: "",
  netPrice: "",
  priceUnit: "TN",
  internalText: "",
};

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
    isOverlength: z.boolean(),
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

    // What is quoted
    items: z.array(purchaseQuoteItemSchema),
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
  isOverlength: false,
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

  items: [DEFAULT_PURCHASE_QUOTE_ITEM],
};
