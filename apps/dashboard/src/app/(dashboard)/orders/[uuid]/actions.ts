"use server";

import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  ne,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { Communications, SelectCommunications } from "@/db/schema/communications";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyCompetitors,
  SelectCompanyCompetitors,
} from "@/db/schema/company-competitors";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import {
  CustomerProjects,
  SelectCustomerProjects,
} from "@/db/schema/customer-projects";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import {
  OrderItemOptions,
  SelectOrderItemOptions,
} from "@/db/schema/order-item-options";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { SalesOptions, SelectSalesOptions } from "@/db/schema/sales-options";
import { SelectTexts, Texts } from "@/db/schema/texts";
import {
  OrderCallOffs,
  SelectOrderCallOffs,
} from "@/db/schema/order-call-offs";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrders,
  SelectProductionWorkOrderLines,
  SelectProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { QuoteItems, SelectQuoteItems } from "@/db/schema/quote-items";
import { Quotes, SelectQuotes } from "@/db/schema/quotes";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  SelectTransportWorkOrderLines,
  SelectTransportWorkOrders,
  TransportWorkOrderLines,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import {
  SelectWarehouseWorkOrderLines,
  SelectWarehouseWorkOrders,
  WarehouseWorkOrderLines,
  WarehouseWorkOrderPicks,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { callOffSchema, CallOffValues } from "@/app/(dashboard)/orders/[uuid]/validation";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  daysInSystem,
  discountAmount,
  generateUuid,
  priceCascade,
  PriceCascade,
  timestampFromDriver,
} from "@/lib/helpers";

// The reference caps each of these panels rather than paging them — a seller
// glancing at "what did this customer buy before" wants the last handful, not
// a scrollable history. See `docs/reference-system/order-detail.md` §14.
const HISTORY_LIMIT = 25;
const STOCK_LIMIT = 50;

// A warehouse work-order line names two locations, so the table has to be
// joined twice. `From` is the pick bin and `To` is `Laad` on every picking line
// captured — the move that takes metal off the shelf and onto the loading area.
const FromLocation = alias(Warehouses, "FromLocation");
const ToLocation = alias(Warehouses, "ToLocation");

/**
 * One row of the `Warehouse workorders` panel.
 *
 * The work order's own identity is flattened onto the line because the panel
 * prints one row per line and repeats the header on each — a single work order
 * routinely serves four order lines (`304211` does exactly that on order
 * `100742`).
 */
export type OrderWarehouseWorkOrderRow = SelectWarehouseWorkOrderLines & {
  workOrderNumber: SelectWarehouseWorkOrders["number"];
  workOrderDate: SelectWarehouseWorkOrders["plannedDate"];
  workOrderType: SelectWarehouseWorkOrders["type"];
  workOrderStatus: SelectWarehouseWorkOrders["status"];
  orderLineNumber: SelectOrderItems["lineNumber"] | null;
  fromLocationName: SelectWarehouses["name"] | null;
  toLocationName: SelectWarehouses["name"] | null;
  stockUnit: SelectProducts["stockUnit"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  stockCategory: SelectStock["stockCategory"] | null;
  /** Computed: the latest pick reported on the line — `Date finished`. */
  dateFinished: Date | null;
};

export type OrderProductionWorkOrderRow = SelectProductionWorkOrderLines & {
  workOrderNumber: SelectProductionWorkOrders["number"];
  workOrderDate: SelectProductionWorkOrders["plannedDate"];
  workOrderStatus: SelectProductionWorkOrders["status"];
  workOrderOption: SelectProductionWorkOrders["option"];
  orderLineNumber: SelectOrderItems["lineNumber"] | null;
  /** The purchase the order line's lot came in on, and the day it arrived. */
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  receiptDate: SelectStock["receiptDate"] | null;
};

export type OrderTransportWorkOrderRow = SelectTransportWorkOrderLines & {
  tripNumber: SelectTransportWorkOrders["tripNumber"] | null;
  tripDate: SelectTransportWorkOrders["date"] | null;
  vehicle: SelectTransportWorkOrders["vehicle"] | null;
  orderLineNumber: SelectOrderItems["lineNumber"] | null;
  productCodeResolved: SelectProducts["productCode"] | null;
};

export type OrderWorkOrders = {
  warehouse: OrderWarehouseWorkOrderRow[];
  production: OrderProductionWorkOrderRow[];
  transport: OrderTransportWorkOrderRow[];
};

export type OrderInvoiceLineRow = SelectInvoiceItems & {
  invoiceNumber: SelectInvoices["id"] | null;
  invoiceDate: SelectInvoices["invoiceDate"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  orderLineNumber: SelectOrderItems["lineNumber"] | null;
};

export type OrderLineStockRow = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  locationName: SelectWarehouses["name"] | null;
  locationType: SelectWarehouses["locationType"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  /** `Technical − Reserved`, the only one of the three the panel derives. */
  availableQuantity: number;
  availableKg: number;
};

export type OrderLinePreviousOrderRow = {
  orderUuid: SelectOrders["uuid"];
  orderId: SelectOrders["id"];
  lineNumber: SelectOrderItems["lineNumber"];
  createdAt: SelectOrderItems["createdAt"];
  status: SelectOrderItems["lineStatus"];
  quantity: SelectOrderItems["quantity"];
  unit: SelectOrderItems["unit"];
  lengthMm: SelectOrderItems["lengthMm"];
  widthMm: SelectOrderItems["widthMm"];
  thicknessMm: SelectOrderItems["thicknessMm"];
  weightKg: SelectOrderItems["kgActual"];
  grossPrice: SelectOrderItems["grossPrice"];
  lineDiscount: SelectOrderItems["lineDiscount"];
  groupDiscount: SelectOrderItems["groupDiscount"];
  netPrice: SelectOrderItems["netPrice"];
  amount: SelectOrderItems["amount"];
  /** Computed, never stored — it would be wrong by one every midnight. */
  daysInSystem: number;
};

export type OrderLinePreviousQuoteRow = {
  quoteUuid: SelectQuotes["uuid"];
  quoteId: SelectQuotes["id"];
  lineNumber: SelectQuoteItems["lineNumber"];
  createdAt: SelectQuoteItems["createdAt"];
  status: SelectQuoteItems["status"];
  quantity: SelectQuoteItems["quantity"];
  unit: SelectQuoteItems["unit"];
  lengthMm: SelectQuoteItems["lengthMm"];
  widthMm: SelectQuoteItems["widthMm"];
  thicknessMm: SelectQuoteItems["thicknessMm"];
  weightKg: SelectQuoteItems["weightKg"];
  grossPrice: SelectQuoteItems["grossPrice"];
  lineDiscount: SelectQuoteItems["lineDiscount"];
  groupDiscount: SelectQuoteItems["groupDiscount"];
  netPrice: SelectQuoteItems["netPrice"];
  amount: SelectQuoteItems["amount"];
  daysInSystem: number;
};

export type OrderLineRevenueAndProfit = {
  revenue: number;
  /** The line's APP per unit — the cost price snapshotted at reservation. */
  costPrice: number;
  costAmount: number;
  profit: number;
  profitMargin: number;
  replacementCost: number;
  profitReplPrice: number;
  profitFsp: number;
  profitTooLow: boolean;
  /** The line's options, summed — the `Options` row of the panel. */
  optionsRevenue: number;
  optionsProfit: number;
};

/**
 * Everything the panels under the order lines show for ONE line.
 *
 * The reference scopes these to the selected line, not to the order: with line
 * 10 highlighted on a nine-line order, `Deliveries` reads `1 delivery` and
 * `Revenue+Profit` reads that line's amount rather than the order's. See
 * `docs/reference-system/order-detail.md` §10.
 */
export type OrderLinePanels = {
  orderItemUuid: SelectOrderItems["uuid"];
  /** The line itself, so the `Pricing` panel can print the components beside
   *  the cascade computed from them. */
  line: SelectOrderItems;
  pricing: PriceCascade;
  /** The € the line and extra discount each take off, beside their %. */
  lineDiscountAmount: number;
  extraDiscountAmount: number;
  revenueAndProfit: OrderLineRevenueAndProfit;
  options: OrderLineOptionRow[];
  stock: OrderLineStockRow[];
  deliveries: OrderTransportWorkOrderRow[];
  previousOrders: OrderLinePreviousOrderRow[];
  previousQuotes: OrderLinePreviousQuoteRow[];
};

/** One row of the `Call-offs` panel on a `Call-off` order. */
export type OrderCallOffRow = SelectOrderCallOffs & {
  addressStreet: SelectCompanyAddresses["streetAndNo"] | null;
  addressPostalCode: SelectCompanyAddresses["postalCode"] | null;
  addressCity: SelectCompanyAddresses["city"] | null;
};

/** A delivery address of the order's customer, for the call-off dialog. */
export type OrderCallOffAddressOption = Pick<
  SelectCompanyAddresses,
  "uuid" | "streetAndNo" | "postalCode" | "city"
>;

/** `callOffUuid` null is `New`; set, it is `Change`. */
export type SaveOrderCallOffInput = CallOffValues & {
  orderUuid: SelectOrderCallOffs["orderUuid"];
  callOffUuid: SelectOrderCallOffs["uuid"] | null;
};

export type OrderCallOffResult = { success?: boolean; error?: string };

/** One row of the selected line's `Options` panel. */
export type OrderLineOptionRow = Pick<
  SelectOrderItemOptions,
  | "uuid"
  | "quantity"
  | "unit"
  | "price"
  | "priceUnit"
  | "costPrice"
  | "amount"
  | "profit"
> & {
  optionCode: SelectSalesOptions["code"] | null;
  optionName: SelectSalesOptions["name"] | null;
};

/**
 * What the read-only header prints beyond the order's own columns: the
 * banner's `Tel`/`Fax`, the customer code, the project, the delivery address,
 * the `Delivered:` date and `Converted from quote …`.
 */
export type OrderHeaderInfo = {
  customerCode: SelectCompanies["id"] | null;
  telephone: SelectCompanyAddresses["telephone"] | null;
  fax: SelectCompanyAddresses["fax"] | null;
  projectName: SelectCustomerProjects["projectName"] | null;
  deliveryAddress: Pick<
    SelectCompanyAddresses,
    "streetAndNo" | "postalCode" | "city" | "country"
  > | null;
  /** Computed: the latest completed trip that carried a line of the order. */
  deliveredOn: string | null;
  sourceQuotes: Pick<SelectQuotes, "uuid" | "id">[];
};

/** One of the order's text lines. */
export type OrderTextRow = Pick<
  SelectTexts,
  "uuid" | "title" | "textBlock" | "sequenceNumber"
>;

const toNumber = (value: string | number | null): number =>
  value === null ? 0 : Number(value);

/**
 * The three work-order panels, which are scoped to the ORDER rather than to the
 * selected line — unlike everything below them on the screen.
 *
 * Run one after another rather than in parallel: the shared MySQL instance caps
 * connections, and three panels on one screen is not worth three at once.
 */
export const getOrderWorkOrders = async (
  orderUuid: string,
): Promise<OrderWorkOrders> => {
  await requireAuth();

  const warehouse = await db
    .select({
      ...getTableColumns(WarehouseWorkOrderLines),
      workOrderNumber: WarehouseWorkOrders.number,
      workOrderDate: WarehouseWorkOrders.plannedDate,
      workOrderType: WarehouseWorkOrders.type,
      workOrderStatus: WarehouseWorkOrders.status,
      orderLineNumber: OrderItems.lineNumber,
      fromLocationName: FromLocation.name,
      toLocationName: ToLocation.name,
      stockUnit: Products.stockUnit,
      purchaseOrderId: PurchaseOrders.id,
      stockCategory: Stock.stockCategory,
      dateFinished: sql<Date | null>`(
        SELECT MAX(${WarehouseWorkOrderPicks.executedAt})
        FROM ${WarehouseWorkOrderPicks}
        WHERE ${WarehouseWorkOrderPicks.workOrderLineUuid} = ${WarehouseWorkOrderLines.uuid}
      )`,
    })
    .from(WarehouseWorkOrderLines)
    .innerJoin(
      WarehouseWorkOrders,
      eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
    )
    .innerJoin(
      OrderItems,
      eq(WarehouseWorkOrderLines.orderItemUuid, OrderItems.uuid),
    )
    .leftJoin(
      FromLocation,
      eq(WarehouseWorkOrderLines.fromLocationUuid, FromLocation.uuid),
    )
    .leftJoin(
      ToLocation,
      eq(WarehouseWorkOrderLines.toLocationUuid, ToLocation.uuid),
    )
    .leftJoin(Products, eq(WarehouseWorkOrderLines.productUuid, Products.uuid))
    .leftJoin(
      PurchaseOrderItems,
      eq(WarehouseWorkOrderLines.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .leftJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(Stock, eq(WarehouseWorkOrderLines.stockUuid, Stock.uuid))
    .where(eq(OrderItems.orderUuid, orderUuid))
    .orderBy(OrderItems.lineNumber);

  const production = await db
    .select({
      ...getTableColumns(ProductionWorkOrderLines),
      workOrderNumber: ProductionWorkOrders.number,
      workOrderDate: ProductionWorkOrders.plannedDate,
      workOrderStatus: ProductionWorkOrders.status,
      workOrderOption: ProductionWorkOrders.option,
      orderLineNumber: OrderItems.lineNumber,
      purchaseOrderId: PurchaseOrders.id,
      receiptDate: Stock.receiptDate,
    })
    .from(ProductionWorkOrderLines)
    .innerJoin(
      ProductionWorkOrders,
      eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
    )
    .innerJoin(
      OrderItems,
      eq(ProductionWorkOrderLines.orderItemUuid, OrderItems.uuid),
    )
    .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
    .leftJoin(PurchaseOrders, eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid))
    .where(eq(OrderItems.orderUuid, orderUuid))
    .orderBy(OrderItems.lineNumber);

  const transport = await db
    .select({
      ...getTableColumns(TransportWorkOrderLines),
      tripNumber: TransportWorkOrders.tripNumber,
      tripDate: TransportWorkOrders.date,
      vehicle: TransportWorkOrders.vehicle,
      orderLineNumber: OrderItems.lineNumber,
      productCodeResolved: Products.productCode,
    })
    .from(TransportWorkOrderLines)
    .innerJoin(
      TransportWorkOrders,
      eq(TransportWorkOrderLines.workOrderUuid, TransportWorkOrders.uuid),
    )
    .innerJoin(
      OrderItems,
      eq(TransportWorkOrderLines.orderItemUuid, OrderItems.uuid),
    )
    .leftJoin(Products, eq(TransportWorkOrderLines.productUuid, Products.uuid))
    .where(eq(OrderItems.orderUuid, orderUuid))
    .orderBy(OrderItems.lineNumber);

  return {
    warehouse: warehouse.map((row) => ({
      ...row,
      dateFinished: timestampFromDriver(row.dateFinished),
    })),
    production,
    transport,
  };
};

/**
 * The order's invoice lines, across every invoice it produced.
 *
 * One order can carry several: `100742` shipped in February and again in March
 * and was billed twice, `500509` and `501106`. Lines are invoiced as they ship,
 * so this is ordered by invoice and then by line.
 */
export const getOrderInvoiceLines = async (
  orderUuid: string,
): Promise<OrderInvoiceLineRow[]> => {
  await requireAuth();

  return db
    .select({
      ...getTableColumns(InvoiceItems),
      invoiceNumber: Invoices.id,
      invoiceDate: Invoices.invoiceDate,
      productCode: Products.productCode,
      productName: Products.name,
      orderLineNumber: OrderItems.lineNumber,
    })
    .from(InvoiceItems)
    .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .leftJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
    .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
    .where(eq(OrderItems.orderUuid, orderUuid))
    .orderBy(Invoices.id, OrderItems.lineNumber);
};

/**
 * Every line-scoped panel for one order line, in one round trip's worth of
 * queries.
 *
 * `pricing` and `revenueAndProfit` need no query of their own — both are read
 * off the line itself, the first through the cascade the reference's `Pricing`
 * panel lays out.
 */
export const getOrderLinePanels = async (
  orderItemUuid: string,
): Promise<OrderLinePanels | null> => {
  await requireAuth();

  const [line] = await db
    .select({
      item: OrderItems,
      orderUuid: Orders.uuid,
      companyUuid: Orders.companyUuid,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (!line) {
    return null;
  }

  const { item } = line;

  const pricing = priceCascade(
    {
      basePrice: toNumber(item.basePrice),
      quantitySurcharge: toNumber(item.quantitySurcharge),
      colorSurcharge: toNumber(item.colorSurcharge),
      lengthSurcharge: toNumber(item.lengthSurcharge),
    },
    {
      lineDiscount: toNumber(item.lineDiscount),
      lineDiscountUnit: item.lineDiscountUnit,
      extraDiscount: toNumber(item.extraDiscount),
      groupDiscount: toNumber(item.groupDiscount),
      groupDiscountUnit: item.groupDiscountUnit,
    },
  );

  // A line whose price was typed rather than built up has a zero build-up and
  // a real `grossPrice`, so the cascade's own gross would read € 0,00 and
  // misreport the line. Order `100742` is exactly that case on all nine lines.
  const storedGross = toNumber(item.grossPrice);
  const resolvedPricing =
    pricing.grossPrice === 0 && storedGross !== 0
      ? {
          ...pricing,
          grossPrice: storedGross,
          netPrice: toNumber(item.netPrice),
        }
      : pricing;

  // The € each of the two line-level discounts takes off, which the panel
  // prints beside its percentage. Both are taken on gross, as the cascade does.
  const lineDiscountAmount = discountAmount(
    resolvedPricing.grossPrice,
    toNumber(item.lineDiscount),
    item.lineDiscountUnit,
  );
  const extraDiscountAmount = discountAmount(
    resolvedPricing.grossPrice,
    toNumber(item.extraDiscount),
    item.lineDiscountUnit,
  );

  const options = await db
    .select({
      uuid: OrderItemOptions.uuid,
      quantity: OrderItemOptions.quantity,
      unit: OrderItemOptions.unit,
      price: OrderItemOptions.price,
      priceUnit: OrderItemOptions.priceUnit,
      costPrice: OrderItemOptions.costPrice,
      amount: OrderItemOptions.amount,
      profit: OrderItemOptions.profit,
      optionCode: SalesOptions.code,
      optionName: SalesOptions.name,
    })
    .from(OrderItemOptions)
    .leftJoin(SalesOptions, eq(OrderItemOptions.optionUuid, SalesOptions.uuid))
    .where(eq(OrderItemOptions.orderItemUuid, orderItemUuid))
    .orderBy(asc(OrderItemOptions.id));

  const amount = toNumber(item.amount);
  const costAmount = toNumber(item.costAmount);

  const revenueAndProfit: OrderLineRevenueAndProfit = {
    revenue: amount,
    costPrice: toNumber(item.costPrice),
    costAmount,
    profit: toNumber(item.profit),
    profitMargin: toNumber(item.profitMargin),
    replacementCost: toNumber(item.replacementPrice),
    profitReplPrice: toNumber(item.profitReplPrice),
    profitFsp: toNumber(item.profitFsp),
    profitTooLow: item.profitTooLow ?? false,
    optionsRevenue: options.reduce(
      (sum, option) => sum + toNumber(option.amount),
      0,
    ),
    optionsProfit: options.reduce(
      (sum, option) => sum + toNumber(option.profit),
      0,
    ),
  };

  const stockRows = await db
    .select({
      ...getTableColumns(Stock),
      productCode: Products.productCode,
      productName: Products.name,
      locationName: Warehouses.name,
      locationType: Warehouses.locationType,
      supplierName: Companies.companyName,
    })
    .from(Stock)
    .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
    .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
    .leftJoin(Companies, eq(Stock.supplierUuid, Companies.uuid))
    .where(eq(Stock.productUuid, item.productUuid))
    .limit(STOCK_LIMIT);

  const stock = stockRows.map((row) => ({
    ...row,
    availableQuantity: toNumber(row.quantity) - toNumber(row.reservedQuantity),
    availableKg: toNumber(row.quantityKg),
  }));

  const deliveries = await db
    .select({
      ...getTableColumns(TransportWorkOrderLines),
      tripNumber: TransportWorkOrders.tripNumber,
      tripDate: TransportWorkOrders.date,
      vehicle: TransportWorkOrders.vehicle,
      orderLineNumber: OrderItems.lineNumber,
      productCodeResolved: Products.productCode,
    })
    .from(TransportWorkOrderLines)
    .innerJoin(
      TransportWorkOrders,
      eq(TransportWorkOrderLines.workOrderUuid, TransportWorkOrders.uuid),
    )
    .innerJoin(
      OrderItems,
      eq(TransportWorkOrderLines.orderItemUuid, OrderItems.uuid),
    )
    .leftJoin(Products, eq(TransportWorkOrderLines.productUuid, Products.uuid))
    .where(eq(TransportWorkOrderLines.orderItemUuid, orderItemUuid));

  // "What did we charge THIS customer for THIS article last time." Same
  // company, same product, any order but this one.
  const previousOrderRows = await db
    .select({
      orderUuid: Orders.uuid,
      orderId: Orders.id,
      lineNumber: OrderItems.lineNumber,
      createdAt: OrderItems.createdAt,
      status: OrderItems.lineStatus,
      quantity: OrderItems.quantity,
      unit: OrderItems.unit,
      lengthMm: OrderItems.lengthMm,
      widthMm: OrderItems.widthMm,
      thicknessMm: OrderItems.thicknessMm,
      weightKg: OrderItems.kgActual,
      grossPrice: OrderItems.grossPrice,
      lineDiscount: OrderItems.lineDiscount,
      groupDiscount: OrderItems.groupDiscount,
      netPrice: OrderItems.netPrice,
      amount: OrderItems.amount,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .where(
      and(
        eq(Orders.companyUuid, line.companyUuid),
        eq(OrderItems.productUuid, item.productUuid),
        ne(OrderItems.uuid, orderItemUuid),
      ),
    )
    .orderBy(desc(OrderItems.createdAt))
    .limit(HISTORY_LIMIT);

  const previousQuoteRows = await db
    .select({
      quoteUuid: Quotes.uuid,
      quoteId: Quotes.id,
      lineNumber: QuoteItems.lineNumber,
      createdAt: QuoteItems.createdAt,
      status: QuoteItems.status,
      quantity: QuoteItems.quantity,
      unit: QuoteItems.unit,
      lengthMm: QuoteItems.lengthMm,
      widthMm: QuoteItems.widthMm,
      thicknessMm: QuoteItems.thicknessMm,
      weightKg: QuoteItems.weightKg,
      grossPrice: QuoteItems.grossPrice,
      lineDiscount: QuoteItems.lineDiscount,
      groupDiscount: QuoteItems.groupDiscount,
      netPrice: QuoteItems.netPrice,
      amount: QuoteItems.amount,
    })
    .from(QuoteItems)
    .innerJoin(Quotes, eq(QuoteItems.quoteUuid, Quotes.uuid))
    .where(
      and(
        eq(Quotes.companyUuid, line.companyUuid),
        eq(QuoteItems.productUuid, item.productUuid),
      ),
    )
    .orderBy(desc(QuoteItems.createdAt))
    .limit(HISTORY_LIMIT);

  return {
    orderItemUuid,
    line: item,
    pricing: resolvedPricing,
    lineDiscountAmount,
    extraDiscountAmount,
    revenueAndProfit,
    options,
    stock,
    deliveries,
    previousOrders: previousOrderRows.map((row) => ({
      ...row,
      daysInSystem: daysInSystem(row.createdAt),
    })),
    previousQuotes: previousQuoteRows.map((row) => ({
      ...row,
      daysInSystem: daysInSystem(row.createdAt),
    })),
  };
};


export type OrderCommunicationRow = {
  uuid: SelectCommunications["uuid"];
  channel: NonNullable<SelectCommunications["channel"]>;
  recipient: SelectCommunications["recipient"];
  subject: SelectCommunications["subject"];
  sentAt: SelectCommunications["sentAt"];
  deliveredCount: NonNullable<SelectCommunications["deliveredCount"]>;
  failedCount: NonNullable<SelectCommunications["failedCount"]>;
  failureReason: SelectCommunications["failureReason"];
  sentByUserId: SelectCommunications["sentByUserId"];
};

export type OrderCompetitorRow = {
  uuid: SelectCompanyCompetitors["uuid"];
  firm: SelectCompanyCompetitors["firm"];
  revenueSharePercent: SelectCompanyCompetitors["revenueSharePercent"];
  customerSatisfaction: SelectCompanyCompetitors["customerSatisfaction"];
  remarks: SelectCompanyCompetitors["remarks"];
};

/**
 * Every attempt to send this order to the customer, successful or not.
 *
 * The panel exists to answer one question — *did the confirmation reach them?*
 * — which until now had no answer anywhere: a failed send wrote
 * `console.error` and returned. A row that reports `0 delivered, 1 refused`
 * with the reason beside it is the whole point, so failures are listed rather
 * than filtered out.
 */
export const getOrderCommunications = async (
  orderUuid: string,
): Promise<OrderCommunicationRow[]> => {
  await requireAuth();

  return db
    .select({
      uuid: Communications.uuid,
      channel: Communications.channel,
      recipient: Communications.recipient,
      subject: Communications.subject,
      sentAt: Communications.sentAt,
      deliveredCount: Communications.deliveredCount,
      failedCount: Communications.failedCount,
      failureReason: Communications.failureReason,
      sentByUserId: Communications.sentByUserId,
    })
    .from(Communications)
    .where(
      and(
        eq(Communications.documentType, "order"),
        eq(Communications.documentUuid, orderUuid),
      ),
    )
    .orderBy(desc(Communications.sentAt));
};

/**
 * Who else is selling to this order's customer.
 *
 * Read through the order's company rather than stored against the order: a
 * rival's share of a customer's spend is a fact about the relationship, and a
 * copy per order would let the same figure disagree with itself across that
 * customer's orders.
 */
export const getOrderCompetitors = async (
  orderUuid: string,
): Promise<OrderCompetitorRow[]> => {
  await requireAuth();

  const [order] = await db
    .select({ companyUuid: Orders.companyUuid })
    .from(Orders)
    .where(eq(Orders.uuid, orderUuid))
    .limit(1);

  if (!order?.companyUuid) {
    return [];
  }

  return db
    .select({
      uuid: CompanyCompetitors.uuid,
      firm: CompanyCompetitors.firm,
      revenueSharePercent: CompanyCompetitors.revenueSharePercent,
      customerSatisfaction: CompanyCompetitors.customerSatisfaction,
      remarks: CompanyCompetitors.remarks,
    })
    .from(CompanyCompetitors)
    .where(eq(CompanyCompetitors.companyUuid, order.companyUuid))
    .orderBy(desc(CompanyCompetitors.revenueSharePercent));
};

/**
 * The `Call-offs` panel: every call-off against the order, oldest first, with
 * the address it goes to.
 */
export const getOrderCallOffs = async (
  orderUuid: string,
): Promise<OrderCallOffRow[]> => {
  await requireAuth();
  return db
    .select({
      ...getTableColumns(OrderCallOffs),
      addressStreet: CompanyAddresses.streetAndNo,
      addressPostalCode: CompanyAddresses.postalCode,
      addressCity: CompanyAddresses.city,
    })
    .from(OrderCallOffs)
    .leftJoin(
      CompanyAddresses,
      eq(CompanyAddresses.uuid, OrderCallOffs.deliveryAddressUuid),
    )
    .where(eq(OrderCallOffs.orderUuid, orderUuid))
    .orderBy(asc(OrderCallOffs.createdAt), asc(OrderCallOffs.id));
};

/** The customer's addresses a call-off can be delivered to. */
export const getOrderCallOffAddresses = async (
  orderUuid: string,
): Promise<OrderCallOffAddressOption[]> => {
  await requireAuth();
  return db
    .select({
      uuid: CompanyAddresses.uuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      postalCode: CompanyAddresses.postalCode,
      city: CompanyAddresses.city,
    })
    .from(CompanyAddresses)
    .innerJoin(Orders, eq(Orders.companyUuid, CompanyAddresses.companyUuid))
    .where(eq(Orders.uuid, orderUuid))
    .orderBy(asc(CompanyAddresses.city));
};

/**
 * Only a `Call-off` order takes call-offs, and not once it is cancelled — the
 * reference shows the panel on `100785`, whose order type is `Call-off`.
 */
const assertCallOffOrder = async (orderUuid: string): Promise<string | null> => {
  const [order] = await db
    .select({ orderType: Orders.orderType, status: Orders.status })
    .from(Orders)
    .where(eq(Orders.uuid, orderUuid))
    .limit(1);
  if (!order) {
    return "Order not found.";
  }
  if (order.orderType !== "call_off") {
    return "Only a call-off order has call-offs.";
  }
  if (order.status === "cancelled") {
    return "The order is cancelled.";
  }
  return null;
};

/** `New` and `Change` in the `Call-offs` panel. */
export const saveOrderCallOff = async (
  _prevState: OrderCallOffResult,
  input: SaveOrderCallOffInput,
): Promise<OrderCallOffResult> => {
  const userId = await requireAuth();
  const parsed = callOffSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid call-off." };
  }
  const refusal = await assertCallOffOrder(input.orderUuid);
  if (refusal) {
    return { error: refusal };
  }
  const values = {
    customerRef: parsed.data.customerRef.trim() || null,
    deliveryAddressUuid: parsed.data.deliveryAddressUuid || null,
    isRush: parsed.data.isRush,
    isSent: parsed.data.isSent,
    modifiedByUserId: userId,
  };
  if (input.callOffUuid) {
    const [updated] = await db
      .update(OrderCallOffs)
      .set(values)
      .where(
        and(
          eq(OrderCallOffs.uuid, input.callOffUuid),
          eq(OrderCallOffs.orderUuid, input.orderUuid),
        ),
      );
    if (updated.affectedRows === 0) {
      return { error: "Call-off not found." };
    }
  } else {
    await db.insert(OrderCallOffs).values({
      uuid: generateUuid(),
      orderUuid: input.orderUuid,
      ...values,
    });
  }
  revalidatePath(`/orders/${input.orderUuid}`);
  return { success: true };
};

export const deleteOrderCallOff = async (
  callOffUuid: string,
): Promise<OrderCallOffResult> => {
  await requireAuth();
  const [callOff] = await db
    .select({ orderUuid: OrderCallOffs.orderUuid })
    .from(OrderCallOffs)
    .where(eq(OrderCallOffs.uuid, callOffUuid))
    .limit(1);
  if (!callOff) {
    return { error: "Call-off not found." };
  }
  await db.delete(OrderCallOffs).where(eq(OrderCallOffs.uuid, callOffUuid));
  revalidatePath(`/orders/${callOff.orderUuid}`);
  return {};
};

/**
 * Everything the read-only header and the title banner print that is not a
 * column of the order itself. One query after another: the shared MySQL
 * instance caps connections.
 */
export const getOrderHeader = async (
  orderUuid: string,
): Promise<OrderHeaderInfo | null> => {
  await requireAuth();

  const [order] = await db
    .select({
      companyUuid: Orders.companyUuid,
      customerCode: Companies.id,
      projectName: CustomerProjects.projectName,
      streetAndNo: CompanyAddresses.streetAndNo,
      postalCode: CompanyAddresses.postalCode,
      city: CompanyAddresses.city,
      country: CompanyAddresses.country,
      deliveryAddressUuid: Orders.deliveryAddressUuid,
    })
    .from(Orders)
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(CustomerProjects, eq(Orders.projectUuid, CustomerProjects.uuid))
    .leftJoin(
      CompanyAddresses,
      eq(Orders.deliveryAddressUuid, CompanyAddresses.uuid),
    )
    .where(eq(Orders.uuid, orderUuid))
    .limit(1);

  if (!order) {
    return null;
  }

  // The banner's `Tel` and `Fax` are the company's, which live on its
  // addresses: the first address that carries a telephone speaks for it.
  const [phone] = await db
    .select({
      telephone: CompanyAddresses.telephone,
      fax: CompanyAddresses.fax,
    })
    .from(CompanyAddresses)
    .where(
      and(
        eq(CompanyAddresses.companyUuid, order.companyUuid),
        isNotNull(CompanyAddresses.telephone),
      ),
    )
    .orderBy(asc(CompanyAddresses.sequenceNumber), asc(CompanyAddresses.id))
    .limit(1);

  const [delivered] = await db
    .select({
      // Formatted in SQL: a bare MAX() of a DATE comes back as a JS Date.
      deliveredOn: sql<string | null>`DATE_FORMAT(
        MAX(${TransportWorkOrders.date}),
        '%Y-%m-%d'
      )`,
    })
    .from(TransportWorkOrderLines)
    .innerJoin(
      TransportWorkOrders,
      eq(TransportWorkOrderLines.workOrderUuid, TransportWorkOrders.uuid),
    )
    .innerJoin(
      OrderItems,
      eq(TransportWorkOrderLines.orderItemUuid, OrderItems.uuid),
    )
    .where(
      and(
        eq(OrderItems.orderUuid, orderUuid),
        eq(TransportWorkOrders.status, "completed"),
      ),
    );

  // `Converted from quote 300013` — the quote whose lines became this order.
  const sourceQuotes = await db
    .selectDistinct({ uuid: Quotes.uuid, id: Quotes.id })
    .from(QuoteItems)
    .innerJoin(Quotes, eq(QuoteItems.quoteUuid, Quotes.uuid))
    .where(eq(QuoteItems.convertedToOrderUuid, orderUuid))
    .orderBy(asc(Quotes.id));

  return {
    customerCode: order.customerCode,
    telephone: phone?.telephone ?? null,
    fax: phone?.fax ?? null,
    projectName: order.projectName,
    deliveryAddress: order.deliveryAddressUuid
      ? {
          streetAndNo: order.streetAndNo,
          postalCode: order.postalCode,
          city: order.city,
          country: order.country,
        }
      : null,
    deliveredOn: delivered?.deliveredOn ?? null,
    sourceQuotes,
  };
};

/** The order's text lines, in the order they print. */
export const getOrderTexts = async (
  orderUuid: string,
): Promise<OrderTextRow[]> => {
  await requireAuth();
  return db
    .select({
      uuid: Texts.uuid,
      title: Texts.title,
      textBlock: Texts.textBlock,
      sequenceNumber: Texts.sequenceNumber,
    })
    .from(Texts)
    .where(eq(Texts.orderUuid, orderUuid))
    .orderBy(asc(Texts.sequenceNumber), asc(Texts.id));
};
