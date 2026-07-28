import { ReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import { ReturnOrderFormValues } from "@/app/(dashboard)/return-orders/validation";
import { toDateInput, toFormString } from "@/lib/helpers";

/**
 * A saved return order back into the values its form edits. The lines are not
 * here: they are booked against the original order's stock and are not the
 * header form's to rewrite.
 */
export const returnOrderDetailToFormValues = (
  returnOrder: ReturnOrderDetail,
): ReturnOrderFormValues => ({
  companyUuid: returnOrder.companyUuid,
  orderUuid: toFormString(returnOrder.orderUuid),
  complaintRef: toFormString(returnOrder.complaintRef),
  contactUuid: toFormString(returnOrder.contactUuid),
  customerRef: toFormString(returnOrder.customerRef),
  ourReference: toFormString(returnOrder.ourReference),
  handlingBlocked: returnOrder.handlingBlocked ?? false,
  isPrinted: returnOrder.isPrinted ?? false,
  isMailed: returnOrder.isMailed ?? false,
  isFaxed: returnOrder.isFaxed ?? false,

  returnDate: toDateInput(returnOrder.returnDate),
  isPickup: returnOrder.isPickup ?? false,
  pickupAddress: toFormString(returnOrder.pickupAddress),
  deliveryAddressUuid: toFormString(returnOrder.deliveryAddressUuid),

  returnReason: returnOrder.returnReason ?? "other",

  calculateVatIfApplicable: returnOrder.calculateVatIfApplicable ?? false,
  invoiceBlockage: returnOrder.invoiceBlockage ?? false,
  onlyTotalAmountOnInvoice: returnOrder.onlyTotalAmountOnInvoice ?? false,
  includeOptionPricesInMaterialPrices:
    returnOrder.includeOptionPricesInMaterialPrices ?? false,
  paymentTerms: returnOrder.paymentTerms ?? undefined,
  billingAddressUuid: toFormString(returnOrder.billingAddressUuid),
  blockingReason: toFormString(returnOrder.blockingReason),

  completeDelivery: returnOrder.completeDelivery ?? false,
  transportBlockage: returnOrder.transportBlockage ?? false,
  vehicleWithCrane: returnOrder.vehicleWithCrane ?? false,
  vehicleWithCanopy: returnOrder.vehicleWithCanopy ?? false,
  bundlingSeparate: returnOrder.bundlingSeparate ?? false,
  transportRegion: returnOrder.transportRegion ?? undefined,
  maxLengthMm: toFormString(returnOrder.maxLengthMm),
  maxBundleWeightKg: toFormString(returnOrder.maxBundleWeightKg),
  deliveryAfterTime: toFormString(returnOrder.deliveryAfterTime),
  deliverForTime: toFormString(returnOrder.deliverForTime),
  transportMode: returnOrder.transportMode ?? undefined,

  remarks: toFormString(returnOrder.remarks),
  documents: returnOrder.documents ?? [],

  surcharges: returnOrder.surcharges.map((surcharge) => ({
    description: surcharge.description ?? "",
    surcharge: toFormString(surcharge.surcharge, "0.00"),
    unit: toFormString(surcharge.unit),
    fromValue: toFormString(surcharge.fromValue, "0.00"),
    unitIndication: toFormString(surcharge.unitIndication),
    tierUnit: surcharge.tierUnit ?? "",
    amount: toFormString(surcharge.amount, "0.00"),
    profit: toFormString(surcharge.profit, "0.00"),
    thirdParties: surcharge.thirdParties ?? false,
    companyCode: toFormString(surcharge.companyCode),
    companyUuid: toFormString(surcharge.companyUuid),
  })),

  texts: returnOrder.texts.map((text) => ({
    title: text.title ?? "",
    textCategoryUuid: toFormString(text.textCategoryUuid),
    textBlock: text.textBlock ?? "",
  })),
});
