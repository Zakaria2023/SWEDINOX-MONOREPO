import {
  contractTierUnits,
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  orderMethods,
  orderTypes,
  orderWeightTypes,
  orderSourceTypes,
} from "@/lib/enums";
import { currentYear, todayDateString } from "@/lib/helpers";
import { z } from "zod";

export const orderItemSchema = z
  .object({
    stockUuid: z.string().optional(),
    // 🔴 A `CD` line names the article to be bought, not a lot: sales order
    // `O108183` was entered ten days before the lot it was sold from existed
    // (8-10-2026). The receipt of the purchase gives the line its lot.
    productUuid: z.string().optional(),
    // What the chosen article reads as, for the form only.
    productLabel: z.string().optional(),
    quantity: z.string().min(1, "Quantity is required"),
    // The reference's line `Type` — `Stk` unless the line is cross-docked or
    // sold ex works. It picks the margin floor the line is held to.
    sourceType: z.enum(orderSourceTypes).optional(),
  })
  .refine(
    (item) =>
      Boolean(item.stockUuid) ||
      (item.sourceType === "cross_dock" && Boolean(item.productUuid)),
    {
      message:
        "Choose a stock lot — or, for a CD line, the article to be bought",
      path: ["stockUuid"],
    },
  );

export const orderSurchargeSchema = z.object({
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

export const orderTextSchema = z.object({
  title: z.string().min(1, "Title is required"),
  textCategoryUuid: z.string().optional(),
  textBlock: z.string().min(1, "Text is required"),
});

export const orderSchema = z.object({
  // Header
  companyUuid: z.string().min(1, "Company is required"),
  items: z.array(orderItemSchema).optional(),
  contactUuid: z.string().optional(),
  orderMethod: z.enum(orderMethods).optional(),
  customerRef: z.string().optional(),
  leaveCustomer: z.boolean(),
  ourReference: z.string().optional(),
  seller: z.string().optional(),
  projectUuid: z.string().optional(),
  priceDate: z.string().optional(),
  orderCategory: z.string().optional(),
  handlingBlocked: z.boolean(),

  // Order type
  isPickup: z.boolean(),
  isIncidental: z.boolean(),
  isConsignment: z.boolean(),
  consignmentDuration: z.string().optional(),
  isInternalProduction: z.boolean(),
  isCustomerMaterial: z.boolean(),
  orderType: z.enum(orderTypes),
  callOffPeriodFrom: z.string().optional(),
  callOffPeriodTo: z.string().optional(),
  weightType: z.enum(orderWeightTypes).optional(),
  isOverlength: z.boolean(),
  isPrinted: z.boolean(),
  isMailed: z.boolean(),
  isFaxed: z.boolean(),

  // Delivery
  deliveryTerms: z.enum(deliveryTerms).optional(),
  deliveryAddressUuid: z.string().optional(),
  deliveryType: z.enum(deliveryTypes),
  deliveryDate: z.string().optional(),
  deliveryWeek: z
    .number()
    .int()
    .min(1, "Week must be between 1 and 53")
    .max(53, "Week must be between 1 and 53")
    .optional(),
  deliveryYear: z
    .number()
    .int()
    .min(2000, "Enter a valid year")
    .max(2099, "Enter a valid year")
    .optional(),
  deliveryRemark: z.string().optional(),

  // Logistics
  completeDelivery: z.boolean(),
  transportBlockage: z.boolean(),
  vehicleWithCrane: z.boolean(),
  vehicleWithCanopy: z.boolean(),
  bundlingSeparate: z.boolean(),
  transportRegion: z.string().optional(),
  maxLengthMm: z.string().optional(),
  maxBundleWeightKg: z.string().optional(),
  deliveryAfterTime: z.string().optional(),
  deliverForTime: z.string().optional(),
  transportMode: z.string().optional(),

  // Finances
  showNetPrice: z.boolean(),
  scrapSurchargeSeparate: z.boolean(),
  calculateVatIfApplicable: z.boolean(),
  financialBlockage: z.boolean(),
  invoiceBlockage: z.boolean(),
  onlyTotalAmountOnInvoice: z.boolean(),
  includeOptionPricesInMaterialPrices: z.boolean(),
  paymentTerms: z.enum(invoicePaymentTerms).optional(),
  billingAddressUuid: z.string().optional(),
  blockingReason: z.string().optional(),

  // Remarks
  remarks: z.string().optional(),

  // Surcharges
  surcharges: z.array(orderSurchargeSchema),

  // Documents
  documents: z.array(z.object({ id: z.string(), fileName: z.string() })),

  // Contracts
  contractUuids: z.array(z.string()),

  // Texts
  texts: z.array(orderTextSchema),
});

export type OrderSurchargeValues = z.infer<typeof orderSurchargeSchema>;
export type OrderTextValues = z.infer<typeof orderTextSchema>;
export type OrderFormValues = z.infer<typeof orderSchema>;

export const DEFAULT_ORDER: OrderFormValues = {
  companyUuid: "",
  items: [],
  contactUuid: "",
  orderMethod: undefined,
  customerRef: "",
  leaveCustomer: false,
  ourReference: "",
  seller: "",
  projectUuid: "",
  priceDate: todayDateString(),
  orderCategory: "",
  handlingBlocked: false,

  isPickup: false,
  isIncidental: false,
  isConsignment: false,
  consignmentDuration: "",
  isInternalProduction: false,
  isCustomerMaterial: false,
  orderType: "normal" as const,
  callOffPeriodFrom: "",
  callOffPeriodTo: "",
  weightType: undefined,
  isOverlength: false,
  isPrinted: false,
  isMailed: false,
  isFaxed: false,

  deliveryTerms: undefined,
  deliveryAddressUuid: "",
  deliveryType: "date",
  deliveryDate: todayDateString(),
  deliveryWeek: undefined,
  deliveryYear: currentYear(),
  deliveryRemark: "",

  completeDelivery: false,
  transportBlockage: false,
  vehicleWithCrane: false,
  vehicleWithCanopy: false,
  bundlingSeparate: false,
  transportRegion: "",
  maxLengthMm: "",
  maxBundleWeightKg: "",
  deliveryAfterTime: "00:00",
  deliverForTime: "00:00",
  transportMode: "",

  showNetPrice: false,
  scrapSurchargeSeparate: false,
  calculateVatIfApplicable: false,
  financialBlockage: false,
  invoiceBlockage: false,
  onlyTotalAmountOnInvoice: false,
  includeOptionPricesInMaterialPrices: false,
  paymentTerms: undefined,
  billingAddressUuid: "",
  blockingReason: "",

  remarks: "",

  surcharges: [],
  documents: [],
  contractUuids: [],
  texts: [],
};
