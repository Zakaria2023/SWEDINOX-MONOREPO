import { z } from "zod";
import {
  contractTierUnits,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  purchaseOrderTypes,
  purchaseReturnOrderReasons,
  PurchaseReturnOrderReason,
  transportModes,
  warehouseTransportRegions,
} from "@/lib/enums";
import { todayDateString } from "@/lib/helpers";

export const purchaseReturnOrderSurchargeSchema = z.object({
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

export const purchaseReturnOrderTextSchema = z.object({
  title: z.string().min(1, "Title is required"),
  textCategoryUuid: z.string().optional(),
  textBlock: z.string().min(1, "Text is required"),
});

export const purchaseReturnOrderSchema = z.object({
  // Header
  supplierUuid: z.string().min(1, "Supplier is required"),
  purchaseOrderUuid: z.string().optional(),
  purchaseOrderReference: z.string().optional(),
  complaintRef: z.string().optional(),
  contactUuid: z.string().optional(),
  purchaser: z.string().optional(),
  purchaseOrderType: z.enum(purchaseOrderTypes).optional(),
  isPrinted: z.boolean(),
  isMailed: z.boolean(),
  isFaxed: z.boolean(),

  // Invoicing
  paymentTerms: z.enum(invoicePaymentTerms).optional(),

  // Delivery
  returnDate: z.string().optional(),
  returnReason: z.enum(purchaseReturnOrderReasons, {
    error: "Return reason is required",
  }),
  isDropOff: z.boolean(),
  deliveryAddressUuid: z.string().optional(),
  pickupAddress: z.string().optional(),

  // Logistics
  completeDelivery: z.boolean(),
  vehicleWithCrane: z.boolean(),
  vehicleWithCanopy: z.boolean(),
  bundlingSeparate: z.boolean(),
  unloadingWarehousePerLine: z.boolean(),
  transportRegion: z.enum(warehouseTransportRegions).optional(),
  transportMode: z.enum(transportModes).optional(),
  pickupAfterTime: z.string().optional(),
  pickupForTime: z.string().optional(),
  maxLengthMm: z.string().optional(),
  maxBundleWeightKg: z.string().optional(),

  // Remarks
  remarks: z.string().optional(),

  // Surcharges
  surcharges: z.array(purchaseReturnOrderSurchargeSchema),

  // Documents
  documents: z
    .array(z.object({ id: z.string(), fileName: z.string() }))
    .optional(),

  // Texts
  texts: z.array(purchaseReturnOrderTextSchema),
});

export type PurchaseReturnOrderSurchargeValues = z.infer<
  typeof purchaseReturnOrderSurchargeSchema
>;
export type PurchaseReturnOrderTextValues = z.infer<
  typeof purchaseReturnOrderTextSchema
>;
export type PurchaseReturnOrderFormValues = z.infer<
  typeof purchaseReturnOrderSchema
>;

export const DEFAULT_PURCHASE_RETURN_ORDER: PurchaseReturnOrderFormValues = {
  supplierUuid: "",
  purchaseOrderUuid: "",
  purchaseOrderReference: "",
  complaintRef: "",
  contactUuid: "",
  purchaser: "",
  purchaseOrderType: undefined,
  isPrinted: false,
  isMailed: false,
  isFaxed: false,

  paymentTerms: undefined,

  returnDate: todayDateString(),
  returnReason: "" as PurchaseReturnOrderReason,
  isDropOff: false,
  deliveryAddressUuid: "",
  pickupAddress: "",

  completeDelivery: false,
  vehicleWithCrane: false,
  vehicleWithCanopy: false,
  bundlingSeparate: false,
  unloadingWarehousePerLine: false,
  transportRegion: undefined,
  transportMode: undefined,
  pickupAfterTime: "00:00",
  pickupForTime: "00:00",
  maxLengthMm: "",
  maxBundleWeightKg: "",

  remarks: "",

  surcharges: [],
  documents: [],
  texts: [],
};
