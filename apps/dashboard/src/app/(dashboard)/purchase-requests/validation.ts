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

// A request line says what is wanted, never what it costs — the price is the
// question being asked, and it comes back on the supplier's quote.
export const purchaseRequestItemSchema = z.object({
  productUuid: z.string().optional(),
  description: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.enum(stockUnits).optional(),
  lengthMm: z.string().optional(),
  kg: z.string().optional(),
  requiredDate: z.string().optional(),
  remark: z.string().optional(),
});

export type PurchaseRequestItemFormValues = z.infer<
  typeof purchaseRequestItemSchema
>;

export const DEFAULT_PURCHASE_REQUEST_ITEM: PurchaseRequestItemFormValues = {
  productUuid: "",
  description: "",
  quantity: "",
  unit: "st",
  lengthMm: "",
  kg: "",
  requiredDate: "",
  remark: "",
};

export const purchaseRequestSchema = z.object({
  // Header
  supplierUuid: z.string().optional(),
  agentUuid: z.string().optional(),
  contactUuid: z.string().optional(),
  purchaser: z.string().optional(),
  orderCategory: z.string().optional(),
  reference: z.string().optional(),
  ourReference: z.string().optional(),

  // Purchase order type
  purchaseOrderType: z.enum(purchaseOrderTypes).optional(),
  weightType: z.enum(orderWeightTypes).optional(),
  isOverlength: z.boolean(),
  isPrinted: z.boolean(),
  isMailed: z.boolean(),
  isFaxed: z.boolean(),
  messageSentViaStaalWeb: z.boolean(),

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

  // Follow-up
  deadline: z.string().optional(),

  // What is being asked for
  items: z.array(purchaseRequestItemSchema),
});

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>;

export const DEFAULT_PURCHASE_REQUEST: PurchaseRequestFormValues = {
  supplierUuid: "",
  agentUuid: "",
  contactUuid: "",
  purchaser: "",
  orderCategory: "",
  reference: "",
  ourReference: "",

  purchaseOrderType: undefined,
  weightType: undefined,
  isOverlength: false,
  isPrinted: false,
  isMailed: false,
  isFaxed: false,
  messageSentViaStaalWeb: false,

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

  deadline: "",

  items: [DEFAULT_PURCHASE_REQUEST_ITEM],
};
