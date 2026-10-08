import { z } from "zod";
import {
  certificaatOptions,
  deliveryTerms,
  deliveryTypes,
  invoicePaymentTerms,
  orderWeightTypes,
  purchaseOrderTypes,
  purchaseSourceTypes,
  receiptDocumentKinds,
  stockOptions,
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
  // The reference's `Line type`. Blank means "whatever the header implies" —
  // `CD` under a `Pick up/Drop-off CD-purchases` tick, `Stk` otherwise — so a
  // buyer only touches this to say `EXW`, which no header tick can say.
  sourceType: z.enum(purchaseSourceTypes).or(z.literal("")).optional(),

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
      sourceType: "",
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

/**
 * `Charge aanpassen…` on a reception — the reference's "change the heat number"
 * dialog, captured 6-10-2026 off order `404150/10`.
 *
 * 🔑 **Current beside new, three rows against three.** The dialog states what
 * the reception says now (read-only) and what it will say, which is the shape a
 * correction to an *identity* should have — you are not editing a value, you
 * are replacing a claim about which metal this is. Only the "new" half is a
 * form field; the "current" half is rendered from the row.
 *
 * ⚠️ This is **not** `Voorraad partij correctie`, which hangs off a stock lot
 * and pairs `Charge` with `Fabrieksnummer`. The reference keeps the two apart,
 * and `Fabrieksnummer` and `Plaatnummer` are not the same field.
 */
export const receptionChargeSchema = z.object({
  receivalUuid: z.string().min(1, "Reception is required"),

  // The mill's melt number. Dirty free text in the reference by its own
  // evidence — blank 607 times across 2.247 lots, plus `nvt`, `-` and 32
  // instances of the typo `ntv` — so it is trimmed but never pattern-matched:
  // rejecting what the mill actually wrote would simply stop the correction.
  charge: z.string().trim().max(60, "Charge is too long").optional(),

  // The mill's own plate identifier, blank for a coil. Editable here and
  // nowhere else, which is why `Stock.plateNumber` has never been populated.
  plateNumber: z.string().trim().max(60, "Plate number is too long").optional(),

  // ⚠️ Ours, and chosen rather than typed — the reference shows a `Selecteer`
  // picker here, not a text box, because an internal charge is handed out on
  // receipt and has to stay unique. It was greyed on the captured reception, so
  // **what that picker lists has never been seen**; the action resolves this
  // against internal charges already in use and refuses an unknown one rather
  // than minting a new identity from a text field.
  internalCharge: z
    .string()
    .trim()
    .max(60, "Internal charge is too long")
    .optional(),
});

export type ReceptionChargeFormValues = z.infer<typeof receptionChargeSchema>;

/**
 * `Partijregistratie instellingen` — batch registration *settings*, which is
 * not data entry at all.
 *
 * 🔴 Pressing `Batch registration` on a reception does **not** open the
 * registration form we built for a stock lot. Every field it shows is
 * read-only, and the only control on it is one checkbox:
 *
 * > ☐ `Document verplichtigingen negeren op bovenstaande ontvangst.`
 * > *"Indien dit aangezet wordt zal het voor deze ontvangst niet meer verplicht
 * > zijn om een document te koppelen. Hierdoor verdwijnt de regel mogelijk uit
 * > het zicht."*
 *
 * 🔑 The warning is the important half, and it is why this is a one-field form
 * rather than a tickbox on the grid: waiving the obligation drops the reception
 * off the worklists that chase missing paperwork — `Certificates to be linked`
 * and `Deliveries from missing batch` — so somebody has to be shown what they
 * are switching off before they switch it off.
 */
export const receptionBatchSettingsSchema = z.object({
  receivalUuid: z.string().min(1, "Reception is required"),
  documentObligationWaived: z.boolean(),
});

export type ReceptionBatchSettingsFormValues = z.infer<
  typeof receptionBatchSettingsSchema
>;

/**
 * `Pre-notify` — the date the supplier has advised the goods will arrive. It is
 * stamped on every reception of the order that has not arrived yet.
 */
export const preNotifySchema = z.object({
  purchaseOrderUuid: z.string().min(1, "Purchase order is required"),
  // "Copy these values into the selected receipts below" — the reference's
  // header (C17, captured on 404299 8-10-2026).
  billOfLading: z.string().optional(),
  advisedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the advised delivery date"),
  preNotifyCode: z.string().optional(),
  confirmationNumber: z.string().optional(),
  confirmationDate: z.string().optional(),
  documentSupplier: z.string().optional(),
  receivalUuids: z.array(z.string()).min(1, "Tick the receipts to pre-notify"),
  // `Pre-notify in stock unit (if receipt for stock)`, ticked by default.
  inStockUnit: z.boolean(),
});

export type PreNotifyFormValues = z.infer<typeof preNotifySchema>;

/**
 * `Confirm purchase order` (C16): the supplier's confirmation, copied onto the
 * order lines that are ticked. `OK` is greyed until one is.
 */
export const confirmPurchaseOrderSchema = z.object({
  purchaseOrderUuid: z.string().min(1, "Purchase order is required"),
  confirmationNumber: z.string().optional(),
  confirmationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the confirmation date"),
  confirmedDeliveryDate: z.string().optional(),
  documentSupplier: z.string().optional(),
  lineUuids: z.array(z.string()).min(1, "Tick the lines to confirm"),
});

export type ConfirmPurchaseOrderFormValues = z.infer<
  typeof confirmPurchaseOrderSchema
>;

/**
 * A row of `Product Receipt Documents` (C19): `Soort` · `Producent` ·
 * `Certificaattype` · `Code` · `Document` · `Order regel` · `Ontvangst regel`.
 */
export const receiptDocumentSchema = z.object({
  purchaseOrderUuid: z.string().min(1, "Purchase order is required"),
  kind: z.enum(receiptDocumentKinds),
  producer: z.string().optional(),
  documentCertificate: z
    .union([z.enum(certificaatOptions), z.literal("")])
    .optional(),
  documentCode: z.string().optional(),
  purchaseOrderItemUuid: z.string().optional(),
  purchaseLineReceivalUuid: z.string().optional(),
  documents: z
    .array(z.object({ id: z.string(), fileName: z.string() }))
    .min(1, "Attach the document"),
});

export type ReceiptDocumentFormValues = z.infer<typeof receiptDocumentSchema>;

/** `New` on `Supplies` (C8): a lot handed to the processor, and how much of it. */
export const purchaseOrderSupplySchema = z.object({
  purchaseOrderUuid: z.string().min(1, "Purchase order is required"),
  stockUuid: z.string().min(1, "Choose the lot to supply"),
  quantity: z
    .string()
    .min(1, "Enter how much of the lot goes out")
    .refine((value) => Number(value) > 0, "Enter how much of the lot goes out"),
  deliveryDate: z.string().optional(),
});

export type PurchaseOrderSupplyFormValues = z.infer<
  typeof purchaseOrderSupplySchema
>;

/** `New` on a purchase line's `Options` (C10): the processing step bought. */
export const purchaseOrderOptionSchema = z.object({
  purchaseOrderUuid: z.string().min(1, "Purchase order is required"),
  purchaseOrderItemUuid: z.string().min(1, "Choose the line"),
  option: z.enum(stockOptions),
  quantity: z.string().optional(),
  grossPrice: z.string().min(1, "Enter the price"),
  per: z.string().min(1, "Choose what the price is per"),
  discountPercent: z.string().optional(),
  referenceFactor: z.string().optional(),
});

export type PurchaseOrderOptionFormValues = z.infer<
  typeof purchaseOrderOptionSchema
>;
