"use server";

import { and, desc, eq, getTableColumns, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
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
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { requireAuth } from "@/lib/auth";
import { daysInSystem, priceCascade, PriceCascade } from "@/lib/helpers";

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
};

export type OrderProductionWorkOrderRow = SelectProductionWorkOrderLines & {
  workOrderNumber: SelectProductionWorkOrders["number"];
  workOrderDate: SelectProductionWorkOrders["plannedDate"];
  workOrderStatus: SelectProductionWorkOrders["status"];
  orderLineNumber: SelectOrderItems["lineNumber"] | null;
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
  costAmount: number;
  profit: number;
  profitMargin: number;
  replacementCost: number;
  profitReplPrice: number;
  profitFsp: number;
  profitTooLow: boolean;
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
  revenueAndProfit: OrderLineRevenueAndProfit;
  stock: OrderLineStockRow[];
  deliveries: OrderTransportWorkOrderRow[];
  previousOrders: OrderLinePreviousOrderRow[];
  previousQuotes: OrderLinePreviousQuoteRow[];
};

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
    .where(eq(OrderItems.orderUuid, orderUuid))
    .orderBy(OrderItems.lineNumber);

  const production = await db
    .select({
      ...getTableColumns(ProductionWorkOrderLines),
      workOrderNumber: ProductionWorkOrders.number,
      workOrderDate: ProductionWorkOrders.plannedDate,
      workOrderStatus: ProductionWorkOrders.status,
      orderLineNumber: OrderItems.lineNumber,
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

  return { warehouse, production, transport };
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

  const amount = toNumber(item.amount);
  const costAmount = toNumber(item.costAmount);

  const revenueAndProfit: OrderLineRevenueAndProfit = {
    revenue: amount,
    costAmount,
    profit: toNumber(item.profit),
    profitMargin: toNumber(item.profitMargin),
    replacementCost: toNumber(item.replacementPrice),
    profitReplPrice: toNumber(item.profitReplPrice),
    profitFsp: toNumber(item.profitFsp),
    profitTooLow: item.profitTooLow ?? false,
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
    revenueAndProfit,
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
