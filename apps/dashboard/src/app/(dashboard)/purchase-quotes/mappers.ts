import { SelectPurchaseQuotes } from "@/db";
import { toDateInput } from "@/lib/helpers";
import { PurchaseQuoteFormValues } from "./validation";

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
});
