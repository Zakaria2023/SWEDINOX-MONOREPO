import { PurchaseReturnOrderReason } from "@/lib/enums";
import { formatTimeValue, toDateInput } from "@/lib/helpers";
import { PurchaseReturnOrderDetail } from "./actions";
import { PurchaseReturnOrderFormValues } from "./validation";

/** A stored return order in the shape its form edits. */
export const purchaseReturnOrderToFormValues = (
  returnOrder: PurchaseReturnOrderDetail,
): PurchaseReturnOrderFormValues => ({
  supplierUuid: returnOrder.supplierUuid,
  purchaseOrderUuid: returnOrder.purchaseOrderUuid ?? "",
  purchaseOrderReference: returnOrder.purchaseOrderReference ?? "",
  complaintRef: returnOrder.complaintRef ?? "",
  contactUuid: returnOrder.contactUuid ?? "",
  purchaser: returnOrder.purchaser ?? "",
  purchaseOrderType: returnOrder.purchaseOrderType ?? undefined,
  isPrinted: returnOrder.isPrinted ?? false,
  isMailed: returnOrder.isMailed ?? false,
  isFaxed: returnOrder.isFaxed ?? false,

  paymentTerms: returnOrder.paymentTerms ?? undefined,

  returnDate: toDateInput(returnOrder.returnDate),
  returnReason: (returnOrder.returnReason ?? "") as PurchaseReturnOrderReason,
  isDropOff: returnOrder.isDropOff ?? false,
  deliveryAddressUuid: returnOrder.deliveryAddressUuid ?? "",
  pickupAddress: returnOrder.pickupAddress ?? "",

  completeDelivery: returnOrder.completeDelivery ?? false,
  vehicleWithCrane: returnOrder.vehicleWithCrane ?? false,
  vehicleWithCanopy: returnOrder.vehicleWithCanopy ?? false,
  bundlingSeparate: returnOrder.bundlingSeparate ?? false,
  unloadingWarehousePerLine: returnOrder.unloadingWarehousePerLine ?? false,
  transportRegion: returnOrder.transportRegion ?? undefined,
  transportMode: returnOrder.transportMode ?? undefined,
  pickupAfterTime: formatTimeValue(returnOrder.pickupAfterTime) || "00:00",
  pickupForTime: formatTimeValue(returnOrder.pickupForTime) || "00:00",
  maxLengthMm:
    returnOrder.maxLengthMm === null ? "" : String(returnOrder.maxLengthMm),
  maxBundleWeightKg: returnOrder.maxBundleWeightKg ?? "",

  remarks: returnOrder.remarks ?? "",

  surcharges: returnOrder.surcharges.map((surcharge) => ({
    description: surcharge.description ?? "",
    surcharge: surcharge.surcharge ?? "",
    unit: surcharge.unit ?? "",
    fromValue: surcharge.fromValue ?? "",
    unitIndication: surcharge.unitIndication ?? "",
    tierUnit: surcharge.tierUnit ?? "",
    amount: surcharge.amount ?? "",
    profit: surcharge.profit ?? "",
    thirdParties: surcharge.thirdParties,
    companyCode: surcharge.companyCode ?? "",
    companyUuid: surcharge.companyUuid ?? "",
  })),
  documents: returnOrder.documents ?? [],
  texts: returnOrder.texts.map((text) => ({
    title: text.title,
    textCategoryUuid: text.textCategoryUuid ?? "",
    textBlock: text.textBlock ?? "",
  })),
});
