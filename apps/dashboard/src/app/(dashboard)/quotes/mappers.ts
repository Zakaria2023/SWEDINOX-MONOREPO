import { QuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import { currentYear, toDateInput } from "@/lib/helpers";

// Turns a saved quote back into the values its form edits. Summary columns are
// deliberately absent: they are derived from the lines on every save, so the
// form has nothing to say about them.
export const quoteDetailToFormValues = (quote: QuoteDetail): QuoteFormValues => ({
  companyUuid: quote.companyUuid,
  contactUuid: quote.contactUuid ?? "",
  customerRef: quote.customerRef ?? "",
  leaveCustomerRef: quote.leaveCustomerRef ?? false,
  requestMethod: quote.requestMethod ?? undefined,
  ourReference: quote.ourReference ?? "",
  seller: quote.seller ?? "",
  projectUuid: quote.projectUuid ?? "",
  contractUuid: quote.contractUuid ?? "",
  priceDate: toDateInput(quote.priceDate),
  decisionDate: toDateInput(quote.decisionDate),
  quoteDate: toDateInput(quote.quoteDate),
  validityPeriodDays:
    quote.validityPeriodDays != null ? String(quote.validityPeriodDays) : "",
  validUntil: toDateInput(quote.validUntil),
  handlingBlocked: quote.handlingBlocked ?? false,

  isPickup: quote.isPickup ?? false,
  isIncidental: quote.isIncidental ?? false,
  isConsignment: quote.isConsignment ?? false,
  consignmentDuration: quote.consignmentDuration ?? "",
  consignmentDurationUnit: quote.consignmentDurationUnit ?? "",
  isInternalProduction: quote.isInternalProduction ?? false,
  isCustomerMaterial: quote.isCustomerMaterial ?? false,
  weightType: quote.weightType ?? undefined,
  isOverlength: quote.isOverlength ?? false,
  isPrinted: quote.isPrinted ?? false,
  isMailed: quote.isMailed ?? false,
  isFaxed: quote.isFaxed ?? false,

  showNetPrice: quote.showNetPrice ?? false,
  scrapSurchargeSeparate: quote.scrapSurchargeSeparate ?? false,
  calculateVatIfApplicable: quote.calculateVatIfApplicable ?? false,
  financialBlockage: quote.financialBlockage ?? false,
  onlyTotalAmountOnInvoice: quote.onlyTotalAmountOnInvoice ?? false,
  doNotShowTotalAmount: quote.doNotShowTotalAmount ?? false,
  includeOptionPricesInMaterialPrices:
    quote.includeOptionPricesInMaterialPrices ?? false,
  paymentTerms: quote.paymentTerms ?? undefined,
  billingAddressUuid: quote.billingAddressUuid ?? "",
  blockingReason: quote.blockingReason ?? "",

  deliveryTerms: quote.deliveryTerms ?? undefined,
  deliveryAddressUuid: quote.deliveryAddressUuid ?? "",
  deliveryType: quote.deliveryType ?? "date",
  deliveryDate: toDateInput(quote.deliveryDate),
  deliveryWeek: quote.deliveryWeek != null ? String(quote.deliveryWeek) : "",
  deliveryYear: String(quote.deliveryYear ?? currentYear()),
  deliveryRemark: quote.deliveryRemark ?? "",

  expired: quote.expired ?? false,

  remarks: quote.remarks ?? "",

  documents: quote.documents ?? [],

  items: quote.items.map((item) => ({
    productUuid: item.productUuid ?? "",
    quantity: item.quantity ?? "0",
    unit: item.unit ?? undefined,
    lengthMm: item.lengthMm != null ? String(item.lengthMm) : "",
    widthMm: item.widthMm != null ? String(item.widthMm) : "",
    thicknessMm: item.thicknessMm ?? "",
    options: item.options ?? "",
  })),
});
