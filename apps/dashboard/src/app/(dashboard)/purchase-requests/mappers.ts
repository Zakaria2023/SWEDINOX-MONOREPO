import { toDateInput } from "@/lib/helpers";
import { PurchaseRequestDetail } from "./actions";
import {
  DEFAULT_PURCHASE_REQUEST_ITEM,
  PurchaseRequestFormValues,
} from "./validation";

/**
 * A stored request in the shape its form edits.
 *
 * The header carries one company plus a `companyType` saying whether it is the
 * supplier or the agent, while the form has a field for each. Splitting it back
 * out here keeps the two readings of the same column in step.
 */
export const purchaseRequestToFormValues = (
  request: PurchaseRequestDetail,
): PurchaseRequestFormValues => ({
  supplierUuid:
    request.companyType === "agent" ? "" : (request.companyUuid ?? ""),
  agentUuid: request.companyType === "agent" ? (request.companyUuid ?? "") : "",
  contactUuid: request.contactUuid ?? "",
  purchaser: request.purchaser ?? "",
  orderCategory: request.orderCategory ?? "",
  reference: request.reference ?? "",
  ourReference: request.ourReference ?? "",

  purchaseOrderType: request.purchaseOrderType ?? undefined,
  weightType: request.weightType ?? undefined,
  isOverlength: request.isOverlength ?? false,
  isPrinted: request.isPrinted ?? false,
  isMailed: request.isMailed ?? false,
  isFaxed: request.isFaxed ?? false,
  messageSentViaStaalWeb: request.messageSentViaStaalWeb ?? false,

  paymentTerms: request.paymentTerms ?? undefined,

  deliveryTerms: request.deliveryTerms ?? undefined,
  deliveryAddressUuid: request.deliveryAddressUuid ?? "",
  arrangeTransport: request.arrangeTransport ?? false,
  pickupDropoffCdPurchases: request.pickupDropoffCdPurchases ?? false,
  supplierAddressUuid: request.supplierAddressUuid ?? "",
  deliveryType: request.deliveryType ?? "date",
  deliveryDate: toDateInput(request.deliveryDate),
  deliveryWeek: request.deliveryWeek ? String(request.deliveryWeek) : "",
  deliveryYear: request.deliveryYear ? String(request.deliveryYear) : "",
  deliveryRemark: request.deliveryRemark ?? "",

  deadline: toDateInput(request.deadline),

  // A request with no lines still needs one blank row for the field array to
  // have something to render.
  items:
    request.items.length > 0
      ? request.items.map((item) => ({
          productUuid: item.productUuid ?? "",
          forOrderItemUuid: item.forOrderItemUuid ?? "",
          description: item.description ?? "",
          stockCategory: item.stockCategory ?? "",
          qualityCode: item.qualityCode ?? "",
          quantity: item.quantity ?? "",
          unit: item.unit ?? "st",
          lengthMm: item.lengthMm === null ? "" : String(item.lengthMm),
          thicknessMm: item.thicknessMm ?? "",
          kg: item.kg ?? "",
          requiredDate: toDateInput(item.requiredDate),
          remark: item.remark ?? "",
        }))
      : [DEFAULT_PURCHASE_REQUEST_ITEM],
});
