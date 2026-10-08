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
import {
  costPriceInProductUnit,
  describeError,
  documentProfitMarginPercent,
  netPriceInProductUnit,
  priceBasis,
  remainingToInvoice,
} from "@/lib/helpers";
import { loadPurchaseCostByProduct } from "@/lib/server/purchase-pricing";
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
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { BranchSettings } from "@/db/schema/branch-settings";
import { ProductFspHistory } from "@/db/schema/product-details";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { WarehouseWorkOrderLines } from "@/db/schema/warehouse-work-orders";
import { count, desc, eq, getTableColumns, sql } from "drizzle-orm";

/** The customer's own city and country. */
const lineVisiting = db
  .select({
    companyUuid: CompanyAddresses.companyUuid,
    city: sql<string | null>`MIN(${CompanyAddresses.city})`.as("line_city"),
    country: sql<string | null>`MIN(${CompanyAddresses.country})`.as(
      "line_country",
    ),
  })
  .from(CompanyAddresses)
  .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, '"visit"')`)
  .groupBy(CompanyAddresses.companyUuid)
  .as("line_visiting");

/** Where the order is being delivered, which need not be the customer. */
const lineDelivery = db
  .select({
    addressUuid: CompanyAddresses.uuid,
    country: CompanyAddresses.country,
  })
  .from(CompanyAddresses)
  .as("line_delivery");

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
  /** The agreed price, in the unit the customer is billed in. */
  price: number;
  priceUnit: SelectOrderItems["priceUnit"];
  /** The same price restated in the unit the product is held in. */
  priceInProductUnit: number;
  productPriceUnit: string | null;
  costPrice: number;
  amount: number;
  profit: number;
  profitMargin: number;
  seller: SelectOrderItems["seller"];
  ourReference: SelectOrders["ourReference"] | null;
  customerCode: SelectCompanies["id"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  city: string | null;
  country: string | null;
  /** Where the goods go, which is not always where the customer is. */
  destinationCountry: string | null;
  region: SelectCompanies["region"] | null;
  representative: SelectCompanies["representative"] | null;
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  qualityCode: SelectStock["quality"] | null;
  stockCategory: SelectStock["stockCategory"] | null;
  commercialShortfall: boolean;
  isConsignment: boolean;
  /** The order's own type: Normal, Call-off, Rush or Ex works. */
  orderType: SelectOrders["orderType"];
  deliveries: number;
  /** Weighted average of every booked purchase invoice for the product. */
  averagePurchasePrice: number;
  priceMinusApp: number;
  marginVsApp: number;
  /** The cost converted into the product's unit before subtracting. */
  priceMinusCost: number;
  /** The product's FSP on the order's price date, from the dated history. */
  fsp: number | null;
  replacementPrice: SelectOrderItems["replacementPrice"];
  priceMinusFsp: number;
  priceMinusReplacement: number;
  marginVsReplacement: number;
  classification: SelectCompanies["classification"] | null;
  /** The branch's own legal name, from the settings. */
  affiliateName: string | null;
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
        productUuid: OrderItems.productUuid,
        productPriceUnit: Products.priceUnit,
        ourReference: Orders.ourReference,
        customerCode: Companies.id,
        companyUuid: Companies.uuid,
        region: Companies.region,
        representative: Companies.representative,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        qualityCode: Stock.quality,
        stockCategory: Stock.stockCategory,
        commercialShortfall: OrderItems.commercialShortfall,
        isConsignment: Orders.isConsignment,
        orderType: Orders.orderType,
        replacementPrice: OrderItems.replacementPrice,
        classification: Companies.classification,
        fsp: sql<string | null>`(
          SELECT ${ProductFspHistory.fsp} FROM ${ProductFspHistory}
          WHERE ${ProductFspHistory.productUuid} = ${OrderItems.productUuid}
            AND ${ProductFspHistory.startDate} <= COALESCE(${Orders.priceDate}, CURDATE())
            AND (${ProductFspHistory.endDate} IS NULL
              OR ${ProductFspHistory.endDate} >= COALESCE(${Orders.priceDate}, CURDATE()))
          ORDER BY ${ProductFspHistory.startDate} DESC LIMIT 1
        )`,
        affiliateName: sql<string | null>`(
          SELECT ${BranchSettings.affiliateName} FROM ${BranchSettings} LIMIT 1
        )`,
        city: lineVisiting.city,
        country: lineVisiting.country,
        destinationCountry: lineDelivery.country,
        // How many times the line has been taken to the warehouse floor. The
        // reference counts 1 on 4 398 of its lines and up to 3 on the rest: a
        // line can be picked more than once.
        deliveries: sql<number>`(
          SELECT COUNT(*) FROM ${WarehouseWorkOrderLines} wl
          WHERE wl.order_item_uuid = ${OrderItems.uuid}
        )`,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .leftJoin(lineVisiting, eq(lineVisiting.companyUuid, Companies.uuid))
      .leftJoin(
        lineDelivery,
        eq(lineDelivery.addressUuid, Orders.deliveryAddressUuid),
      )
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

    // The average purchase price is per product, so it is fetched once for the
    // products on this page rather than per line.
    const costs = await loadPurchaseCostByProduct(
      rows.map((row) => row.productUuid),
    );

    return rows.map((row) => {
      const amount = Number(row.amount ?? 0);
      const quantity = Number(row.quantity ?? 0);
      const weightKg = Number(row.weightKg ?? 0);
      const costPrice = Number(row.costPrice ?? 0);
      const price = Number(row.price ?? 0);
      const measure = { weightKg, quantity, lengthMm: row.lengthMm };
      // The cost is charged per unit of the SAME basis the line is priced on,
      // which is what makes a tonne-priced line cost kilos over a thousand
      // rather than pieces.
      const basis = priceBasis(row.priceUnit, measure);
      const profit = amount - costPrice * basis;
      const priceInProductUnit = netPriceInProductUnit(
        price,
        row.priceUnit,
        row.productPriceUnit,
        measure,
      );
      const app = costs.get(row.productUuid)?.averagePurchasePrice ?? 0;
      const fsp = row.fsp === null ? null : Number(row.fsp);
      const replacement = Number(row.replacementPrice ?? 0);
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
        price,
        priceUnit: row.priceUnit,
        priceInProductUnit,
        productPriceUnit: row.productPriceUnit,
        costPrice,
        amount,
        profit,
        profitMargin: documentProfitMarginPercent(amount, profit),
        seller: row.seller,
        ourReference: row.ourReference,
        customerCode: row.customerCode,
        companyUuid: row.companyUuid,
        city: row.city ?? null,
        country: row.country ?? null,
        destinationCountry: row.destinationCountry ?? row.country ?? null,
        region: row.region,
        representative: row.representative,
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        qualityCode: row.qualityCode ?? null,
        stockCategory: row.stockCategory ?? null,
        commercialShortfall: row.commercialShortfall,
        isConsignment: row.isConsignment ?? false,
        orderType: row.orderType,
        deliveries: Number(row.deliveries ?? 0),
        averagePurchasePrice: app,
        priceMinusApp: priceInProductUnit - app,
        marginVsApp: documentProfitMarginPercent(
          priceInProductUnit,
          priceInProductUnit - app,
        ),
        fsp,
        replacementPrice: row.replacementPrice,
        priceMinusFsp: priceInProductUnit - (fsp ?? 0),
        priceMinusReplacement: priceInProductUnit - replacement,
        marginVsReplacement: documentProfitMarginPercent(
          priceInProductUnit,
          priceInProductUnit - replacement,
        ),
        classification: row.classification,
        affiliateName: row.affiliateName,
        // The cost converted into the product's unit first -- the reference
        // does not, and subtracts euros per piece from euros per tonne.
        priceMinusCost:
          priceInProductUnit -
          costPriceInProductUnit(
            costPrice,
            row.priceUnit,
            row.productPriceUnit,
            measure,
          ),
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

    const lotUuid = line.stockUuid;
    const [stock] = lotUuid
      ? await db
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
      .where(eq(Stock.uuid, lotUuid))
      .limit(1)
      : [];

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
