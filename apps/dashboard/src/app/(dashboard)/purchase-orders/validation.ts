import { z } from "zod";
import {
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  orderWeightTypes,
  purchaseOrderTypes,
} from "@/lib/enums";
import { todayDateString, currentYear } from "@/lib/helpers";

export const purchaseOrderItemSchema = z.object({
  productUuid: z.string().min(1, "Product is required"),
  quantity: z.string().min(1, "Quantity is required"),
  // The agreed purchase price. Required, because the lot received against this
  // line is valued at it — an unpriced line would put stock on the shelf with
  // no cost, and every sales order drawing from it would report a false margin.
  netPrice: z
    .string()
    .min(1, "Purchase price is required")
    .refine((value) => Number(value) >= 0, "Purchase price cannot be negative"),
  priceUnit: z.string().optional(),

  // 🔑 Carried off the chosen article, not typed.
  //
  // A purchase line holds its own dimensions and quality because the receival
  // behind it has to weigh the parcel that arrives, and a line that cannot say
  // what size it ordered cannot check what turned up against it. The stock
  // search dialog hands these over when somebody picks the product.
  productLabel: z.string().optional(),
  qualityCode: z.string().optional(),
  lengthMm: z.string().optional(),
  widthMm: z.string().optional(),
  thicknessMm: z.string().optional(),
  /**
   * What one piece weighs, carried off the chosen article so the grid can show
   * `Kg(p)` and the amount while the order is being typed — the reference
   * computes both on the line, not at save time.
   *
   * The server derives its own figure on save and does not trust this one: it
   * is here to be shown, not to be stored.
   */
  pieceWeightKg: z.string().optional(),
});

export const purchaseOrderSchema = z.object({
  // Header
  supplierUuid: z.string().min(1, "Supplier is required"),
  agentUuid: z.string().optional(),
  contactUuid: z.string().optional(),
  purchaser: z.string().optional(),
  reference: z.string().optional(),
  ourReference: z.string().optional(),
  orderCategory: z.string().optional(),

  // Products
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "At least one product is required"),

  // Purchase order type
  purchaseOrderType: z.enum(purchaseOrderTypes).optional(),
  weightType: z.enum(orderWeightTypes).optional(),
  isOverlength: z.boolean(),
  isPrinted: z.boolean(),
  isMailed: z.boolean(),
  isFaxed: z.boolean(),
  messageSentViaStaalWeb: z.boolean(),
  deliberatelyNotSent: z.boolean(),
  doNotPrintPrices: z.boolean(),

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

  // Remarks
  remarks: z.string().optional(),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export const DEFAULT_PURCHASE_ORDER: PurchaseOrderFormValues = {
  supplierUuid: "",
  agentUuid: "",
  contactUuid: "",
  purchaser: "",
  reference: "",
  ourReference: "",
  orderCategory: "",

  items: [
    {
      productUuid: "",
      quantity: "",
      netPrice: "",
      priceUnit: "",
      productLabel: "",
      qualityCode: "",
      lengthMm: "",
      widthMm: "",
      thicknessMm: "",
      pieceWeightKg: "",
    },
  ],

  purchaseOrderType: undefined,
  weightType: undefined,
  isOverlength: false,
  isPrinted: false,
  isMailed: false,
  isFaxed: false,
  messageSentViaStaalWeb: false,
  deliberatelyNotSent: false,
  doNotPrintPrices: false,

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

  remarks: "",
};
