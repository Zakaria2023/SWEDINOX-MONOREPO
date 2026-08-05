import {
  SelectContracts,
  SelectCounterOrderItems,
  SelectCounterOrders,
  SelectCounterOrderSurcharges,
  SelectTexts,
} from "@/db";
import { formatTimeValue, toDecimal } from "@/lib/helpers";
import { CounterOrderExtras, CounterOrderInput } from "./actions";
import { CounterOrderFormValues } from "./validation";

type CounterOrderRelations = {
  surcharges: SelectCounterOrderSurcharges[];
  texts: SelectTexts[];
  contracts: SelectContracts[];
  items: SelectCounterOrderItems[];
};

/** A stored counter order in the shape its form edits. */
export const counterOrderToFormValues = (
  order: SelectCounterOrders,
  relations: CounterOrderRelations,
): CounterOrderFormValues => ({
  companyUuid: order.companyUuid,
  contactUuid: order.contactUuid ?? "",
  customerRef: order.customerRef ?? "",
  leaveCustomer: order.leaveCustomer ?? false,
  orderMethod: order.orderMethod ?? "",
  ourReference: order.ourReference ?? "",
  seller: order.seller ?? "",
  projectUuid: order.projectUuid ?? "",
  status: order.status ?? "open",
  priority: order.priority ?? "normal",
  priceDate: order.priceDate ?? "",
  orderDate: order.orderDate ?? "",
  handlingBlocked: order.handlingBlocked ?? false,
  printPickingSlips: order.printPickingSlips ?? true,
  isPickup: order.isPickup ?? false,
  isIncidental: order.isIncidental ?? false,
  isOverlength: order.isOverlength ?? false,
  isPrinted: order.isPrinted ?? false,
  isMailed: order.isMailed ?? false,
  isFaxed: order.isFaxed ?? false,
  deliveryTerms: order.deliveryTerms ?? "",
  deliveryAddressUuid: order.deliveryAddressUuid ?? "",
  deliveryDate: order.deliveryDate ?? "",
  deliveryRemark: order.deliveryRemark ?? "",

  completeDelivery: order.completeDelivery ?? false,
  transportBlockage: order.transportBlockage ?? false,
  vehicleWithCrane: order.vehicleWithCrane ?? false,
  vehicleWithCanopy: order.vehicleWithCanopy ?? false,
  bundlingSeparate: order.bundlingSeparate ?? false,
  transportRegion: order.transportRegion ?? "",
  maxLengthMm: order.maxLengthMm === null ? "" : String(order.maxLengthMm),
  maxBundleWeightKg: order.maxBundleWeightKg ?? "",
  deliveryAfterTime: formatTimeValue(order.deliveryAfterTime) || "00:00",
  deliverForTime: formatTimeValue(order.deliverForTime) || "00:00",
  transportMode: order.transportMode ?? "",

  showNetPrice: order.showNetPrice ?? false,
  scrapSurchargeSeparate: order.scrapSurchargeSeparate ?? false,
  calculateVatIfApplicable: order.calculateVatIfApplicable ?? false,
  financialBlockage: order.financialBlockage ?? false,
  invoiceBlockage: order.invoiceBlockage ?? false,
  onlyTotalAmountOnInvoice: order.onlyTotalAmountOnInvoice ?? false,
  includeOptionPricesInMaterialPrices:
    order.includeOptionPricesInMaterialPrices ?? false,
  paymentTerms: order.paymentTerms ?? "",
  billingAddressUuid: order.billingAddressUuid ?? "",
  blockingReason: order.blockingReason ?? "",

  amountExVat: order.amountExVat ?? "0.00",
  weightKg: order.weightKg ?? "0.000",
  gainPercent: order.gainPercent ?? "0.00",
  remarks: order.remarks ?? "",

  surcharges: relations.surcharges.map((surcharge) => ({
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
  documents: order.documents ?? [],
  contractUuids: relations.contracts.map((contract) => contract.uuid),
  texts: relations.texts.map((text) => ({
    title: text.title,
    textCategoryUuid: text.textCategoryUuid ?? "",
    textBlock: text.textBlock ?? "",
  })),
  items: relations.items.map((item) => ({
    productUuid: item.productUuid ?? "",
    productLabel: item.description ?? "",
    status: item.status ?? "in_progress",
    deliveryDate: item.deliveryDate ?? "",
    description: item.description ?? "",
    levCode: item.levCode ?? "",
    reference: item.reference ?? "",
    unit: item.unit ?? "st",
    qtyPlanned: item.qtyPlanned ?? "",
    qtyActual: item.qtyActual ?? "",
    lengthMm: item.lengthMm === null ? "" : String(item.lengthMm),
    kgPlanned: item.kgPlanned ?? "",
    kgActual: item.kgActual ?? "",
    grossPrice: item.grossPrice ?? "",
    lineDiscount: item.lineDiscount ?? "",
    groupDiscount: item.groupDiscount ?? "",
    netPrice: item.netPrice ?? "",
    amount: item.amount ?? "",
  })),
});

/**
 * The form's values as columns.
 *
 * Both creating and saving a section go through here, so the two can't
 * disagree about how a blank select or an empty number reaches the database.
 */
export const formValuesToCounterOrderInput = (
  values: CounterOrderFormValues,
): CounterOrderInput => ({
  companyUuid: values.companyUuid,
  contactUuid: values.contactUuid || null,
  customerRef: values.customerRef || null,
  leaveCustomer: values.leaveCustomer,
  orderMethod: values.orderMethod || null,
  ourReference: values.ourReference || null,
  seller: values.seller || null,
  projectUuid: values.projectUuid || null,
  status: values.status,
  priority: values.priority,
  priceDate: values.priceDate || null,
  orderDate: values.orderDate || null,
  handlingBlocked: values.handlingBlocked,
  printPickingSlips: values.printPickingSlips,
  isPickup: values.isPickup,
  isIncidental: values.isIncidental,
  isOverlength: values.isOverlength,
  isPrinted: values.isPrinted,
  isMailed: values.isMailed,
  isFaxed: values.isFaxed,
  deliveryTerms: values.deliveryTerms || null,
  deliveryAddressUuid: values.deliveryAddressUuid || null,
  deliveryDate: values.deliveryDate || null,
  deliveryRemark: values.deliveryRemark || null,

  completeDelivery: values.completeDelivery,
  transportBlockage: values.transportBlockage,
  vehicleWithCrane: values.vehicleWithCrane,
  vehicleWithCanopy: values.vehicleWithCanopy,
  bundlingSeparate: values.bundlingSeparate,
  transportRegion: values.transportRegion || null,
  maxLengthMm: values.maxLengthMm ? Number(values.maxLengthMm) : null,
  maxBundleWeightKg: values.maxBundleWeightKg || null,
  deliveryAfterTime: values.deliveryAfterTime || null,
  deliverForTime: values.deliverForTime || null,
  transportMode: values.transportMode || null,

  showNetPrice: values.showNetPrice,
  scrapSurchargeSeparate: values.scrapSurchargeSeparate,
  calculateVatIfApplicable: values.calculateVatIfApplicable,
  financialBlockage: values.financialBlockage,
  invoiceBlockage: values.invoiceBlockage,
  onlyTotalAmountOnInvoice: values.onlyTotalAmountOnInvoice,
  includeOptionPricesInMaterialPrices:
    values.includeOptionPricesInMaterialPrices,
  paymentTerms: values.paymentTerms || null,
  billingAddressUuid: values.billingAddressUuid || null,
  blockingReason: values.blockingReason || null,

  amountExVat: values.amountExVat || "0.00",
  weightKg: values.weightKg || "0.000",
  gainPercent: values.gainPercent || "0.00",
  remarks: values.remarks || null,

  documents: values.documents?.length ? values.documents : null,
});

export const formValuesToCounterOrderExtras = (
  values: CounterOrderFormValues,
): CounterOrderExtras => ({
  surcharges: values.surcharges.map((surcharge) => ({
    companyUuid: surcharge.companyUuid || null,
    order: 0,
    description: surcharge.description || null,
    surcharge: toDecimal(surcharge.surcharge, "0.00"),
    unit: surcharge.unit || null,
    fromValue: toDecimal(surcharge.fromValue, "0.00"),
    unitIndication: surcharge.unitIndication || null,
    tierUnit: surcharge.tierUnit || null,
    amount: toDecimal(surcharge.amount, "0.00"),
    profit: toDecimal(surcharge.profit, "0.00"),
    thirdParties: surcharge.thirdParties,
    companyCode: surcharge.companyCode || null,
  })),
  texts: values.texts.map((text) => ({
    title: text.title,
    textBlock: text.textBlock,
    textCategoryUuid: text.textCategoryUuid || null,
  })),
  contractUuids: values.contractUuids,
  items: values.items.map((item) => ({
    productUuid: item.productUuid,
    status: item.status,
    deliveryDate: item.deliveryDate || null,
    description: item.description || null,
    levCode: item.levCode || null,
    reference: item.reference || null,
    unit: item.unit,
    qtyPlanned: toDecimal(item.qtyPlanned, "0.000"),
    qtyActual: toDecimal(item.qtyActual, "0.000"),
    lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
    kgPlanned: toDecimal(item.kgPlanned, "0.00"),
    kgActual: toDecimal(item.kgActual, "0.00"),
    grossPrice: toDecimal(item.grossPrice, "0.00"),
    lineDiscount: toDecimal(item.lineDiscount, "0.00"),
    groupDiscount: toDecimal(item.groupDiscount, "0.00"),
    netPrice: toDecimal(item.netPrice, "0.00"),
    amount: toDecimal(item.amount, "0.00"),
  })),
});
