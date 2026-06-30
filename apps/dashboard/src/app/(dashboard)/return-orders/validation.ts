import { z } from "zod";
import {
  invoicePaymentTerms,
  returnOrderReasons,
  ReturnOrderReason,
  transportModes,
  warehouseTransportRegions,
} from "@/lib/enums";
import { todayDateString } from "@/lib/helpers";

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

  // Documents
  documents: z
    .array(z.object({ id: z.string(), fileName: z.string() }))
    .optional(),
});

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

  documents: [],
};
