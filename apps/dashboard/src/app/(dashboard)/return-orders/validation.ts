import { z } from "zod";
import {
  contractTierUnits,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  returnOrderReasons,
  ReturnOrderReason,
  transportModes,
  warehouseTransportRegions,
} from "@/lib/enums";
import { todayDateString } from "@/lib/helpers";

export const returnOrderSurchargeSchema = z.object({
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

export const returnOrderTextSchema = z.object({
  title: z.string().min(1, "Title is required"),
  textCategoryUuid: z.string().optional(),
  textBlock: z.string().min(1, "Text is required"),
});

export const returnOrderSchema = z.object({
  // Header
  companyUuid: z.string().min(1, "Customer is required"),
  orderUuid: z.string().optional(),
  complaintRef: z.string().optional(),
  contactUuid: z.string().optional(),
  customerRef: z.string().optional(),
  ourReference: z.string().optional(),
  handlingBlocked: z.boolean(),
  isPrinted: z.boolean(),
  isMailed: z.boolean(),
  isFaxed: z.boolean(),

  // Reception
  returnDate: z.string().optional(),
  isPickup: z.boolean(),
  pickupAddress: z.string().optional(),
  deliveryAddressUuid: z.string().optional(),

  // Reason
  returnReason: z.enum(returnOrderReasons, {
    error: "Return reason is required",
  }),

  // Finances
  calculateVatIfApplicable: z.boolean(),
  invoiceBlockage: z.boolean(),
  onlyTotalAmountOnInvoice: z.boolean(),
  includeOptionPricesInMaterialPrices: z.boolean(),
  paymentTerms: z.enum(invoicePaymentTerms).optional(),
  billingAddressUuid: z.string().optional(),
  blockingReason: z.string().optional(),

  // Logistics
  completeDelivery: z.boolean(),
  transportBlockage: z.boolean(),
  vehicleWithCrane: z.boolean(),
  vehicleWithCanopy: z.boolean(),
  bundlingSeparate: z.boolean(),
  transportRegion: z.enum(warehouseTransportRegions).optional(),
  maxLengthMm: z.string().optional(),
  maxBundleWeightKg: z.string().optional(),
  deliveryAfterTime: z.string().optional(),
  deliverForTime: z.string().optional(),
  transportMode: z.enum(transportModes).optional(),

  // Remarks
  remarks: z.string().optional(),

  // Surcharges
  surcharges: z.array(returnOrderSurchargeSchema),

  // Documents
  documents: z
    .array(z.object({ id: z.string(), fileName: z.string() }))
    .optional(),

  // Texts
  texts: z.array(returnOrderTextSchema),
});

export type ReturnOrderSurchargeValues = z.infer<
  typeof returnOrderSurchargeSchema
>;
export type ReturnOrderTextValues = z.infer<typeof returnOrderTextSchema>;
export type ReturnOrderFormValues = z.infer<typeof returnOrderSchema>;

export const DEFAULT_RETURN_ORDER: ReturnOrderFormValues = {
  companyUuid: "",
  orderUuid: "",
  complaintRef: "",
  contactUuid: "",
  customerRef: "",
  ourReference: "",
  handlingBlocked: false,
  isPrinted: false,
  isMailed: false,
  isFaxed: false,

  returnDate: todayDateString(),
  isPickup: true,
  pickupAddress: "",
  deliveryAddressUuid: "",

  returnReason: "" as ReturnOrderReason,

  calculateVatIfApplicable: false,
  invoiceBlockage: false,
  onlyTotalAmountOnInvoice: false,
  includeOptionPricesInMaterialPrices: false,
  paymentTerms: undefined,
  billingAddressUuid: "",
  blockingReason: "",

  completeDelivery: false,
  transportBlockage: false,
  vehicleWithCrane: false,
  vehicleWithCanopy: false,
  bundlingSeparate: false,
  transportRegion: undefined,
  maxLengthMm: "",
  maxBundleWeightKg: "",
  deliveryAfterTime: "00:00",
  deliverForTime: "00:00",
  transportMode: undefined,

  remarks: "",

  surcharges: [],
  documents: [],
  texts: [],
};
