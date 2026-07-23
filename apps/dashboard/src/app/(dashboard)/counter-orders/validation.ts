import { z } from "zod";
import {
  contractTierUnits,
  counterOrderPriorities,
  counterOrderStatuses,
  deliveryTerms,
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  orderMethods,
  transportModes,
  warehouseTransportRegions,
} from "@/lib/enums";

export const counterOrderSurchargeSchema = z.object({
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

export const counterOrderTextSchema = z.object({
  title: z.string().min(1, "Title is required"),
  textCategoryUuid: z.string().optional(),
  textBlock: z.string().min(1, "Text is required"),
});

export const createCounterOrderSchema = () =>
  z.object({
    companyUuid: z.string().min(1, "Customer is required"),
    contactUuid: z.string().optional(),
    customerRef: z.string().optional(),
    leaveCustomer: z.boolean(),
    orderMethod: z.union([z.enum(orderMethods), z.literal("")]).optional(),
    ourReference: z.string().optional(),
    seller: z.string().optional(),
    projectUuid: z.string().optional(),
    status: z.enum(counterOrderStatuses),
    priority: z.enum(counterOrderPriorities),
    priceDate: z.string().optional(),
    orderDate: z.string().optional(),
    handlingBlocked: z.boolean(),
    printPickingSlips: z.boolean(),
    isPickup: z.boolean(),
    isIncidental: z.boolean(),
    isOverlength: z.boolean(),
    isPrinted: z.boolean(),
    isMailed: z.boolean(),
    isFaxed: z.boolean(),
    deliveryTerms: z.union([z.enum(deliveryTerms), z.literal("")]).optional(),
    deliveryAddressUuid: z.string().optional(),
    deliveryDate: z.string().optional(),
    deliveryRemark: z.string().optional(),

    // Logistics
    completeDelivery: z.boolean(),
    transportBlockage: z.boolean(),
    vehicleWithCrane: z.boolean(),
    vehicleWithCanopy: z.boolean(),
    bundlingSeparate: z.boolean(),
    transportRegion: z
      .union([z.enum(warehouseTransportRegions), z.literal("")])
      .optional(),
    maxLengthMm: z.string().optional(),
    maxBundleWeightKg: z.string().optional(),
    deliveryAfterTime: z.string().optional(),
    deliverForTime: z.string().optional(),
    transportMode: z.union([z.enum(transportModes), z.literal("")]).optional(),

    // Finances
    showNetPrice: z.boolean(),
    scrapSurchargeSeparate: z.boolean(),
    calculateVatIfApplicable: z.boolean(),
    financialBlockage: z.boolean(),
    invoiceBlockage: z.boolean(),
    onlyTotalAmountOnInvoice: z.boolean(),
    includeOptionPricesInMaterialPrices: z.boolean(),
    paymentTerms: z
      .union([z.enum(invoicePaymentTerms), z.literal("")])
      .optional(),
    billingAddressUuid: z.string().optional(),
    blockingReason: z.string().optional(),

    // Summary
    amountExVat: z.string().optional(),
    weightKg: z.string().optional(),
    gainPercent: z.string().optional(),
    remarks: z.string().optional(),

    // Surcharges
    surcharges: z.array(counterOrderSurchargeSchema),

    // Documents
    documents: z
      .array(z.object({ id: z.string(), fileName: z.string() }))
      .optional(),

    // Contracts
    contractUuids: z.array(z.string()),

    // Texts
    texts: z.array(counterOrderTextSchema),
  });

export type CounterOrderSurchargeValues = z.infer<
  typeof counterOrderSurchargeSchema
>;
export type CounterOrderTextValues = z.infer<typeof counterOrderTextSchema>;
export type CounterOrderFormValues = z.infer<
  ReturnType<typeof createCounterOrderSchema>
>;
