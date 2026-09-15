import { SelectPurchaseQuotes } from "@/db";
import { SelectPurchaseQuoteItems } from "@/db/schema/purchase-quote-items";
import { toDateInput } from "@/lib/helpers";
import {
  DEFAULT_PURCHASE_QUOTE_ITEM,
  PurchaseQuoteFormValues,
  PurchaseQuoteItemFormValues,
} from "./validation";

const numberInput = (value: string | number | null): string =>
  value === null || Number(value) === 0 ? "" : String(value);

const quoteItemToFormValues = (
  item: SelectPurchaseQuoteItems,
): PurchaseQuoteItemFormValues => ({
  productUuid: item.productUuid ?? "",
  description: item.description ?? "",
  quantity: numberInput(item.quantity),
  unit: item.unit ?? "st",
  kg: numberInput(item.kg),
  lengthMm: numberInput(item.lengthMm),
  widthMm: numberInput(item.widthMm),
  thicknessMm: numberInput(item.thicknessMm),
  grossPrice: numberInput(item.grossPrice),
  groupDiscountPercent: numberInput(item.groupDiscountPercent),
  lineDiscountPercent: numberInput(item.lineDiscountPercent),
  netPrice: numberInput(item.netPrice),
  priceUnit: item.priceUnit ?? "TN",
  internalText: item.internalText ?? "",
});

/**
 * A stored quote in the shape its form edits.
 *
 * The header carries one company plus a `companyType` saying whether it is the
 * supplier or the agent, while the form has a field for each. Splitting it back
 * out here is what makes the "either a supplier or an agent, not both" rule read
 * the same on the way in as on the way out.
 */
export const purchaseQuoteToFormValues = (
  quote: SelectPurchaseQuotes,
  items: SelectPurchaseQuoteItems[],
): PurchaseQuoteFormValues => ({
  supplierUuid:
    quote.companyType === "agent" ? "" : (quote.companyUuid ?? ""),
  agentUuid: quote.companyType === "agent" ? (quote.companyUuid ?? "") : "",
  contactUuid: quote.contactUuid ?? "",
  purchaser: quote.purchaser ?? "",
  reference: quote.reference ?? "",
  ourReference: quote.ourReference ?? "",
  orderCategory: quote.orderCategory ?? "",

  quoteNumber: quote.quoteNumber ?? "",
  quoteDate: toDateInput(quote.quoteDate),
  validUntil: toDateInput(quote.validUntil),

  purchaseOrderType: quote.purchaseOrderType ?? undefined,
  weightType: quote.weightType ?? undefined,
  isOverlength: quote.isOverlength ?? false,
  isConsignment: quote.isConsignment ?? false,

  paymentTerms: quote.paymentTerms ?? undefined,

  deliveryTerms: quote.deliveryTerms ?? undefined,
  deliveryAddressUuid: quote.deliveryAddressUuid ?? "",
  arrangeTransport: quote.arrangeTransport ?? false,
  pickupDropoffCdPurchases: quote.pickupDropoffCdPurchases ?? false,
  supplierAddressUuid: quote.supplierAddressUuid ?? "",
  deliveryType: quote.deliveryType ?? "date",
  deliveryDate: toDateInput(quote.deliveryDate),
  deliveryWeek: quote.deliveryWeek ? String(quote.deliveryWeek) : "",
  deliveryYear: quote.deliveryYear ? String(quote.deliveryYear) : "",
  deliveryRemark: quote.deliveryRemark ?? "",

  documents: quote.documents ?? [],

  items:
    items.length > 0
      ? items.map(quoteItemToFormValues)
      : [DEFAULT_PURCHASE_QUOTE_ITEM],
});
