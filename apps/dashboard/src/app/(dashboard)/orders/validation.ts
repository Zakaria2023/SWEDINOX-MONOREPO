import { z } from "zod";
import {
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  orderMethods,
  orderWeightTypes,
} from "@/lib/enums";

export const orderSchema = z.object({
  // Header
  companyUuid: z.string().min(1, "Company is required"),
  contactUuid: z.string().optional(),
  orderMethod: z.enum(orderMethods).optional(),
  customerRef: z.string().optional(),
  leaveCustomer: z.boolean(),
  ourReference: z.string().optional(),
  seller: z.string().optional(),
  project: z.string().optional(),
  priceDate: z.string().optional(),
  orderCategory: z.string().optional(),
  handlingBlocked: z.boolean(),

  // Order type
  isPickup: z.boolean(),
  isIncidental: z.boolean(),
  isConsignment: z.boolean(),
  consignmentDuration: z.string().optional(),
  isInternalProduction: z.boolean(),
  isKlantMateriaal: z.boolean(),
  weightType: z.enum(orderWeightTypes).optional(),
  isOverlengte: z.boolean(),
  isPrinted: z.boolean(),
  isMailed: z.boolean(),
  isFaxed: z.boolean(),

  // Delivery
  deliveryTerms: z.enum(deliveryTerms).optional(),
  deliveryAddressUuid: z.string().optional(),
  deliveryType: z.enum(deliveryTypes),
  deliveryDate: z.string().optional(),
  deliveryWeek: z.string().optional(),
  deliveryYear: z.string().optional(),
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
});

export type OrderFormValues = z.infer<typeof orderSchema>;

const today = new Date().toISOString().split("T")[0];
const currentYear = new Date().getFullYear();

export const DEFAULT_ORDER: OrderFormValues = {
  companyUuid: "",
  contactUuid: "",
  orderMethod: undefined,
  customerRef: "",
  leaveCustomer: false,
  ourReference: "",
  seller: "",
  project: "",
  priceDate: today,
  orderCategory: "",
  handlingBlocked: false,

  isPickup: false,
  isIncidental: false,
  isConsignment: false,
  consignmentDuration: "",
  isInternalProduction: false,
  isKlantMateriaal: false,
  weightType: undefined,
  isOverlengte: false,
  isPrinted: false,
  isMailed: false,
  isFaxed: false,

  deliveryTerms: undefined,
  deliveryAddressUuid: "",
  deliveryType: "date",
  deliveryDate: today,
  deliveryWeek: "",
  deliveryYear: String(currentYear),
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
};
