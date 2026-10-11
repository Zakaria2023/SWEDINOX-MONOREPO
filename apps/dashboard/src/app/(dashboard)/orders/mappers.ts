import { OrderFormExtras } from "./[uuid]/actions";
import { OrderDetail } from "./actions";
import { DEFAULT_ORDER, OrderFormValues } from "./validation";
import { StockSearchChoice } from "@/components/orders/stock-search-dialog";
import { toDateInput } from "@/lib/helpers";

/**
 * What a line shows once its `…` has picked something in the `Stock` window,
 * before it is saved: the lot (or, on a `CD` line, the article) and enough of
 * it to fill the row.
 */
export type OrderLinePick = {
  stockUuid: string | null;
  productUuid: string;
  productCode: string | null;
  productName: string | null;
  quality: string | null;
  stockCategory: string | null;
  unit: string | null;
  lengthMm: number | null;
  widthMm: number | null;
  thicknessMm: string | null;
  pieceWeightKg: number | null;
};

/**
 * A stored order in the shape its form edits — the saved order's screen is the
 * new-order form, opened on what was saved. Its lines are not form values: a
 * saved order's lines are written one at a time from its own grid.
 */
export const orderToFormValues = (
  order: OrderDetail,
  extras: OrderFormExtras,
): OrderFormValues => ({
  ...DEFAULT_ORDER,
  companyUuid: order.companyUuid,
  items: [],
  contactUuid: order.contactUuid ?? "",
  orderMethod: order.orderMethod ?? undefined,
  customerRef: order.customerRef ?? "",
  leaveCustomer: order.leaveCustomer ?? false,
  ourReference: order.ourReference ?? "",
  seller: order.seller ?? "",
  projectUuid: order.projectUuid ?? "",
  priceDate: toDateInput(order.priceDate),
  orderCategory: order.orderCategory ?? "",
  handlingBlocked: order.handlingBlocked ?? false,

  isPickup: order.isPickup ?? false,
  isIncidental: order.isIncidental ?? false,
  isConsignment: order.isConsignment ?? false,
  consignmentDuration: order.consignmentDuration ?? "",
  isInternalProduction: order.isInternalProduction ?? false,
  isCustomerMaterial: order.isCustomerMaterial ?? false,
  orderType: order.orderType,
  callOffPeriodFrom: toDateInput(order.callOffPeriodFrom),
  callOffPeriodTo: toDateInput(order.callOffPeriodTo),
  weightType: order.weightType ?? undefined,
  isOverlength: order.isOverlength ?? false,
  isPrinted: order.isPrinted ?? false,
  isMailed: order.isMailed ?? false,
  isFaxed: order.isFaxed ?? false,

  deliveryTerms: order.deliveryTerms ?? undefined,
  deliveryAddressUuid: order.deliveryAddressUuid ?? "",
  deliveryType: order.deliveryType ?? "date",
  deliveryDate: toDateInput(order.deliveryDate),
  deliveryWeek: order.deliveryWeek ?? undefined,
  deliveryYear: order.deliveryYear ?? undefined,
  deliveryRemark: order.deliveryRemark ?? "",

  completeDelivery: order.completeDelivery ?? false,
  transportBlockage: order.transportBlockage ?? false,
  vehicleWithCrane: order.vehicleWithCrane ?? false,
  vehicleWithCanopy: order.vehicleWithCanopy ?? false,
  bundlingSeparate: order.bundlingSeparate ?? false,
  transportRegion: order.transportRegion ?? "",
  maxLengthMm: order.maxLengthMm === null ? "" : String(order.maxLengthMm),
  maxBundleWeightKg: order.maxBundleWeightKg ?? "",
  deliveryAfterTime: order.deliveryAfterTime ?? "00:00",
  deliverForTime: order.deliverForTime ?? "00:00",
  transportMode: order.transportMode ?? "",

  showNetPrice: order.showNetPrice ?? false,
  scrapSurchargeSeparate: order.scrapSurchargeSeparate ?? false,
  calculateVatIfApplicable: order.calculateVatIfApplicable ?? false,
  financialBlockage: order.financialBlockage ?? false,
  invoiceBlockage: order.invoiceBlockage ?? false,
  onlyTotalAmountOnInvoice: order.onlyTotalAmountOnInvoice ?? false,
  includeOptionPricesInMaterialPrices:
    order.includeOptionPricesInMaterialPrices ?? false,
  paymentTerms: order.paymentTerms ?? undefined,
  billingAddressUuid: order.billingAddressUuid ?? "",
  blockingReason: order.blockingReason ?? "",

  remarks: order.remarks ?? "",

  surcharges: extras.surcharges.map((surcharge) => ({
    description: surcharge.description ?? "",
    surcharge: surcharge.surcharge ?? "",
    unit: surcharge.unit ?? "",
    fromValue: surcharge.fromValue ?? "",
    unitIndication: surcharge.unitIndication ?? "",
    tierUnit: surcharge.tierUnit ?? "",
    amount: surcharge.amount ?? "",
    profit: surcharge.profit ?? "",
    thirdParties: surcharge.thirdParties ?? false,
    companyCode: surcharge.companyCode ?? "",
    companyUuid: surcharge.companyUuid ?? "",
  })),
  documents: order.documents ?? [],
  contractUuids: extras.contracts.map((contract) => contract.uuid),
  texts: extras.texts.map((text) => ({
    uuid: text.uuid,
    title: text.title,
    textCategoryUuid: text.textCategoryUuid ?? "",
    textBlock: text.textBlock,
  })),
});

/**
 * A choice made in the `Stock` window as the line it fills. A selling line is
 * cut from a lot — `Use selected product` resolves to the article's fullest
 * one — and a `CD` line names the article to be bought, with no lot yet.
 * Null when a lot was needed and the article has none on the shelf.
 */
export const stockChoiceToLinePick = (
  choice: StockSearchChoice,
  articleOnly: boolean,
): OrderLinePick | null => {
  const source = articleOnly
    ? choice.kind === "variant"
      ? choice.variant
      : choice.lot
    : choice.lot;
  if (!source) {
    return null;
  }
  return {
    stockUuid: articleOnly || !choice.lot ? null : choice.lot.uuid,
    productUuid: source.productUuid,
    productCode: source.productCode,
    productName: source.productName,
    quality: source.quality,
    stockCategory: source.stockCategory,
    unit: source.articleUnit ?? source.unit,
    lengthMm: source.lengthMm,
    widthMm: source.widthMm,
    thicknessMm: source.thicknessMm,
    pieceWeightKg: source.pieceWeightKg,
  };
};
