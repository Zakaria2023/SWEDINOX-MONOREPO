import { z } from "zod";
import {
  contractTierUnits,
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  orderMethods,
  orderWeightTypes,
  stockUnits,
} from "@/lib/enums";
import { todayDateString, currentYear } from "@/lib/helpers";

// A line the salesperson adds to the quote. Only the product and a positive
// quantity are required; the price is resolved on the server, so it is not
// part of the form.
export const quoteLineSchema = z.object({
  productUuid: z.string().min(1, "Pick a product"),
  quantity: z
    .string()
    .refine((v) => Number(v) > 0, "Quantity must be greater than 0"),
  unit: z.enum(stockUnits).optional(),
  lengthMm: z.string().optional(),
  widthMm: z.string().optional(),
  thicknessMm: z.string().optional(),
  options: z.string().optional(),
});

export type QuoteLineFormValues = z.infer<typeof quoteLineSchema>;

// A surcharge quoted on top of the material — scrap/alloy surcharge, small
// order fee. Every field is optional so a half-filled row can still be typed
// out of order; the sequence and the creation stamp are set on save rather than
// entered, so they are not part of the form.
export const quoteSurchargeSchema = z.object({
  description: z
    .union([z.enum(invoiceSurchargeDescriptions), z.literal("")])
    .optional(),
  surcharge: z.string().optional(),
  unit: z.string().optional(),
  fromValue: z.string().optional(),
  unitIndication: z.string().optional(),
  tierUnit: z.union([z.enum(contractTierUnits), z.literal("")]).optional(),
  amount: z.string().optional(),
  profit: z.string().optional(),
  thirdParties: z.boolean(),
  companyCode: z.string().optional(),
  companyUuid: z.string().optional(),
});

export type QuoteSurchargeFormValues = z.infer<typeof quoteSurchargeSchema>;

export const quoteSchema = z.object({
  // Header
  companyUuid: z.string().min(1, "Customer is required"),
  contactUuid: z.string().optional(),
  customerRef: z.string().optional(),
  leaveCustomerRef: z.boolean(),
  requestMethod: z.enum(orderMethods).optional(),
  ourReference: z.string().optional(),
  seller: z.string().optional(),
  projectUuid: z.string().optional(),
  contractUuid: z.string().optional(),
  priceDate: z.string().optional(),
  decisionDate: z.string().optional(),
  quoteDate: z.string().optional(),
  validityPeriodDays: z.string().optional(),
  validUntil: z.string().optional(),
  handlingBlocked: z.boolean(),

  // Order type
  isPickup: z.boolean(),
  isIncidental: z.boolean(),
  isConsignment: z.boolean(),
  consignmentDuration: z.string().optional(),
  consignmentDurationUnit: z.string().optional(),
  isInternalProduction: z.boolean(),
  isCustomerMaterial: z.boolean(),
  weightType: z.enum(orderWeightTypes).optional(),
  isOverlength: z.boolean(),
  isPrinted: z.boolean(),
  isMailed: z.boolean(),
  isFaxed: z.boolean(),

  // Finances
  showNetPrice: z.boolean(),
  scrapSurchargeSeparate: z.boolean(),
  calculateVatIfApplicable: z.boolean(),
  financialBlockage: z.boolean(),
  onlyTotalAmountOnInvoice: z.boolean(),
  doNotShowTotalAmount: z.boolean(),
  includeOptionPricesInMaterialPrices: z.boolean(),
  paymentTerms: z.enum(invoicePaymentTerms).optional(),
  billingAddressUuid: z.string().optional(),
  blockingReason: z.string().optional(),

  // Delivery
  deliveryTerms: z.enum(deliveryTerms).optional(),
  deliveryAddressUuid: z.string().optional(),
  deliveryType: z.enum(deliveryTypes),
  deliveryDate: z.string().optional(),
  deliveryWeek: z.string().optional(),
  deliveryYear: z.string().optional(),
  deliveryRemark: z.string().optional(),

  // Follow-up
  expired: z.boolean(),

  // Remarks
  remarks: z.string().optional(),

  // Documents
  documents: z
    .array(z.object({ id: z.string(), fileName: z.string() }))
    .optional(),

  // Line items
  items: z.array(quoteLineSchema),

  // Surcharges
  surcharges: z.array(quoteSurchargeSchema),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;

export const DEFAULT_QUOTE: QuoteFormValues = {
  companyUuid: "",
  contactUuid: "",
  customerRef: "",
  leaveCustomerRef: false,
  requestMethod: undefined,
  ourReference: "",
  seller: "",
  projectUuid: "",
  contractUuid: "",
  priceDate: todayDateString(),
  decisionDate: "",
  quoteDate: todayDateString(),
  validityPeriodDays: "",
  validUntil: "",
  handlingBlocked: false,

  isPickup: false,
  isIncidental: false,
  isConsignment: false,
  consignmentDuration: "",
  consignmentDurationUnit: "",
  isInternalProduction: false,
  isCustomerMaterial: false,
  weightType: undefined,
  isOverlength: false,
  isPrinted: false,
  isMailed: false,
  isFaxed: false,

  showNetPrice: false,
  scrapSurchargeSeparate: false,
  calculateVatIfApplicable: false,
  financialBlockage: false,
  onlyTotalAmountOnInvoice: false,
  doNotShowTotalAmount: false,
  includeOptionPricesInMaterialPrices: false,
  paymentTerms: undefined,
  billingAddressUuid: "",
  blockingReason: "",

  deliveryTerms: undefined,
  deliveryAddressUuid: "",
  deliveryType: "date",
  deliveryDate: todayDateString(),
  deliveryWeek: "",
  deliveryYear: String(currentYear()),
  deliveryRemark: "",

  expired: false,

  remarks: "",

  documents: [],

  items: [],

  surcharges: [],
};
