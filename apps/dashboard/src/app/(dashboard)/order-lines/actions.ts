"use server";

import { orderLineColumns } from "@/app/(dashboard)/order-lines/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { SelectStock, Stock } from "@/db/schema/stock";
import { orderLineStatuses, orderSourceTypes } from "@/lib/enums";
import { describeError, remainingToInvoice } from "@/lib/helpers";
import { getClerkUserNames } from "@/lib/server/clerk";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  numberRangeFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { count, desc, eq, getTableColumns } from "drizzle-orm";

export type OrderLineRow = {
  uuid: SelectOrderItems["uuid"];
  createdAt: string | null;
  deliveryDate: SelectOrderItems["deliveryDate"];
  customerName: SelectCompanies["companyName"] | null;
  reference: SelectOrders["customerRef"] | null;
  orderId: SelectOrders["id"] | null;
  lineNumber: SelectOrderItems["lineNumber"];
  lineStatus: SelectOrderItems["lineStatus"];
  sourceType: SelectOrderItems["sourceType"];
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  options: SelectOrderItems["options"];
  lengthMm: SelectOrderItems["lengthMm"];
  widthMm: SelectOrderItems["widthMm"];
  thicknessMm: SelectOrderItems["thicknessMm"];
  quantity: number;
  unit: SelectOrderItems["unit"];
  weightKg: number;
  price: number;
  priceUnit: SelectOrderItems["priceUnit"];
  costPrice: number;
  amount: number;
  profit: number;
  profitMargin: number;
  seller: SelectOrderItems["seller"];
};

export type OrderLineDetail = SelectOrderItems & {
  orderId: SelectOrders["id"] | null;
  orderCategory: SelectOrders["orderCategory"] | null;
  customerRef: SelectOrders["customerRef"] | null;
  customerName: SelectCompanies["companyName"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  /** The lot the line is allocated to, for the stock block on the screen. */
  stock: OrderLineStockRow | null;
  /** How much of the line is still to be billed. */
  remainingToInvoice: number;
};

export type OrderLineStockRow = Pick<
  SelectStock,
  | "uuid"
  | "status"
  | "quantity"
  | "reservedQuantity"
  | "unit"
  | "charge"
  | "internalCharge"
  | "valuationPrice"
>;

// What the search box looks in: the identifiers somebody reads off a document
// and types back. Not the dimensions or the money, which are filtered by range.
const ORDER_LINE_SEARCH = [
  Products.productCode,
  Products.name,
  Orders.customerRef,
  Companies.companyName,
] as const;

const ORDER_LINE_SORTABLE = {
  createdAt: OrderItems.createdAt,
  deliveryDate: OrderItems.deliveryDate,
  customer: Companies.companyName,
  order: Orders.id,
  lineStatus: OrderItems.lineStatus,
  sourceType: OrderItems.sourceType,
  productCode: Products.productCode,
  quantity: OrderItems.quantity,
  amount: OrderItems.amount,
};

// company and product narrow on indexed columns. lineStatus and deliveryDate
// are indexed by this change — see db/schema/order-items.ts — because this is
// the table that grows fastest and a status filter on it must not be a scan.
const ORDER_LINE_FILTERS = {
  lineStatus: enumFilter(OrderItems.lineStatus, orderLineStatuses),
  sourceType: enumFilter(OrderItems.sourceType, orderSourceTypes),
  company: relationFilter(Orders.companyUuid),
  product: relationFilter(OrderItems.productUuid),
  deliveryDate: dateRangeFilter(OrderItems.deliveryDate),
  amount: numberRangeFilter(OrderItems.amount),
};

// Every order line, joined to its order, customer and product. Cost is the
// stock lot valuation; profit/margin are derived from the line amount.
//
// The joins to Orders, Companies and Products are inner and are repeated in the
// count, because the search and several filters reach through them — a count
// built on the bare table would report rows the page cannot show.
/**
 * The rows one view of the order lines overview selects, as a window onto them.
 *
 * Shared by the page and the export, which matters more here than elsewhere:
 * profit and margin are worked out in this function rather than in SQL, and a
 * second copy of it for the export is a second answer to what a line earned.
 */
const orderLineRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<OrderLineRow[]> => {
    const rows = await db
      .select({
        uuid: OrderItems.uuid,
        createdAt: OrderItems.createdAt,
        deliveryDate: OrderItems.deliveryDate,
        customerName: Companies.companyName,
        reference: Orders.customerRef,
        orderId: Orders.id,
        lineNumber: OrderItems.lineNumber,
        lineStatus: OrderItems.lineStatus,
        sourceType: OrderItems.sourceType,
        productCode: Products.productCode,
        description: Products.name,
        options: OrderItems.options,
        lengthMm: OrderItems.lengthMm,
        widthMm: OrderItems.widthMm,
        thicknessMm: OrderItems.thicknessMm,
        quantity: OrderItems.quantity,
        unit: OrderItems.unit,
        weightKg: OrderItems.kgPlanned,
        price: OrderItems.grossPrice,
        priceUnit: OrderItems.priceUnit,
        costPrice: Stock.valuationPrice,
        amount: OrderItems.amount,
        seller: OrderItems.seller,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .where(
        tableWhere({
          query,
          search: ORDER_LINE_SEARCH,
          filters: ORDER_LINE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          ORDER_LINE_SORTABLE,
          query,
          [desc(OrderItems.createdAt)],
          OrderItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    return rows.map((row) => {
      const amount = Number(row.amount ?? 0);
      const quantity = Number(row.quantity ?? 0);
      const costPrice = Number(row.costPrice ?? 0);
      const profit = amount - costPrice * quantity;
      return {
        uuid: row.uuid,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        deliveryDate: row.deliveryDate,
        customerName: row.customerName,
        reference: row.reference,
        orderId: row.orderId,
        lineNumber: row.lineNumber,
        lineStatus: row.lineStatus,
        sourceType: row.sourceType,
        productCode: row.productCode,
        description: row.description,
        options: row.options,
        lengthMm: row.lengthMm,
        widthMm: row.widthMm,
        thicknessMm: row.thicknessMm,
        quantity,
        unit: row.unit,
        weightKg: Number(row.weightKg ?? 0),
        price: Number(row.price ?? 0),
        priceUnit: row.priceUnit,
        costPrice,
        amount,
        profit,
        profitMargin: amount === 0 ? 0 : (profit / amount) * 100,
        seller: row.seller,
      };
    });
  };

// The joins are part of the count as well as the rows, because the search and
// several filters reach through them — a count built on the bare table would
// report rows the page cannot show.
export const getOrderLines = async (
  query: TableQuery,
): Promise<Paged<OrderLineRow>> => {
  try {
    return await runPaged(query, {
      rows: orderLineRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(OrderItems)
          .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
          .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
          .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
          .where(
            tableWhere({
              query,
              search: ORDER_LINE_SEARCH,
              filters: ORDER_LINE_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch order lines"));
  }
};

/**
 * Every order line the current view matches, as a workbook.
 *
 * The seller names are fetched here rather than taken from the caller: the
 * column spells a Clerk id as a person, and an export must not depend on the
 * browser to tell it who someone is.
 */
export const exportOrderLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Order Lines",
    columns: orderLineColumns(await getClerkUserNames()),
    columnKeys,
    rows: orderLineRows(parseTableQuery(params)),
  });

/**
 * One order line in full: everything the line records, the order and customer it
 * belongs to, the product, the purchase order it was drawn from, and the stock
 * lot it is allocated to.
 *
 * This is the canonical order-line screen. The deliveries, blocked-deliveries,
 * deliveries-to-arrange and reservation overviews all list `OrderItems` rows, so
 * they link here rather than each carrying a near-identical screen of their own.
 */
export const getOrderLineDetail = async (
  uuid: string,
): Promise<OrderLineDetail | null> => {
  try {
    const [line] = await db
      .select({
        ...getTableColumns(OrderItems),
        orderId: Orders.id,
        orderCategory: Orders.orderCategory,
        customerRef: Orders.customerRef,
        customerName: Companies.companyName,
        companyUuid: Companies.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderId: PurchaseOrders.id,
      })
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(OrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(eq(OrderItems.uuid, uuid))
      .limit(1);

    if (!line) {
      return null;
    }

    const [stock] = await db
      .select({
        uuid: Stock.uuid,
        status: Stock.status,
        quantity: Stock.quantity,
        reservedQuantity: Stock.reservedQuantity,
        unit: Stock.unit,
        charge: Stock.charge,
        internalCharge: Stock.internalCharge,
        valuationPrice: Stock.valuationPrice,
      })
      .from(Stock)
      .where(eq(Stock.uuid, line.stockUuid))
      .limit(1);

    return {
      ...line,
      stock: stock ?? null,
      remainingToInvoice: remainingToInvoice(
        line.quantity,
        line.invoicedQuantity,
      ),
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch order line"));
  }
};
