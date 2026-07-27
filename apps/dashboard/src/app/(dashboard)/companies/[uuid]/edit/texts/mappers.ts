import { TextDialogValues } from "@/app/(dashboard)/companies/validation";
import { InsertTexts, SelectTexts } from "@/db/schema/texts";

// The text dialog edits the category link, the text block, and the usage
// flags. The stored title always mirrors the selected category's name (the
// legacy save handler copied it), so the resolved name is passed in instead
// of being user input. createdByUserId is set once on insert and never
// rewritten on update.

export const textRowToDialogValues = (row: SelectTexts): TextDialogValues => ({
  textCategoryUuid: row.textCategoryUuid ?? "",
  textBlock: row.textBlock,
  visitReport: row.visitReport ?? false,
  purchaseQuoteRequest: row.purchaseQuoteRequest ?? false,
  purchaseOrder: row.purchaseOrder ?? false,
  purchaseOrderToolTip: row.purchaseOrderToolTip ?? false,
  purchaseReturnOrder: row.purchaseReturnOrder ?? false,
  salesQuote: row.salesQuote ?? false,
  salesOrder: row.salesOrder ?? false,
  salesOrderToolTip: row.salesOrderToolTip ?? false,
  salesInvoice: row.salesInvoice ?? false,
  warehouseOrder: row.warehouseOrder ?? false,
  productionOrder: row.productionOrder ?? false,
  loadlist: row.loadlist ?? false,
  waybill: row.waybill ?? false,
  rideList: row.rideList ?? false,
  customerLabel: row.customerLabel ?? false,
  transportPlanning: row.transportPlanning ?? false,
  websiteInAdvance: row.websiteInAdvance ?? false,
  websiteAfter: row.websiteAfter ?? false,
});

export const textValuesToColumns = (
  values: TextDialogValues,
  title: string,
): Partial<InsertTexts> & Pick<InsertTexts, "title" | "textBlock"> => ({
  textCategoryUuid: values.textCategoryUuid || null,
  title,
  textBlock: values.textBlock,
  visitReport: values.visitReport,
  purchaseQuoteRequest: values.purchaseQuoteRequest,
  purchaseOrder: values.purchaseOrder,
  purchaseOrderToolTip: values.purchaseOrderToolTip,
  purchaseReturnOrder: values.purchaseReturnOrder,
  salesQuote: values.salesQuote,
  salesOrder: values.salesOrder,
  salesOrderToolTip: values.salesOrderToolTip,
  salesInvoice: values.salesInvoice,
  warehouseOrder: values.warehouseOrder,
  productionOrder: values.productionOrder,
  loadlist: values.loadlist,
  waybill: values.waybill,
  rideList: values.rideList,
  customerLabel: values.customerLabel,
  transportPlanning: values.transportPlanning,
  websiteInAdvance: values.websiteInAdvance,
  websiteAfter: values.websiteAfter,
});
