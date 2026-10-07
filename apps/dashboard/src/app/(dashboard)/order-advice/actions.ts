"use server";

import { openPurchaseOrderStatuses } from "@/lib/enums";
import {
  convertKgToUnit,
  describeError,
  roundAdviceWeight,
  roundToOrderQty,
  todayDateString,
} from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { ProductFspHistory } from "@/db/schema/product-details";
import {
  ProductGroupSuppliers,
  SelectProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { ORDER_ADVICE_COLUMNS } from "@/app/(dashboard)/order-advice/columns";
import { exportRows } from "@/lib/server/excel";
import {
  FilterBindings,
  relationFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
  valueFilter,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { alias, AnyMySqlColumn } from "drizzle-orm/mysql-core";

/**
 * One line of the order advice, column for column as the reference system lists
 * it — the names here are its own column headings, taken from their tooltips
 * where the heading itself is truncated on screen.
 *
 * The first eighteen are the saved view the buyers work from. The rest are the
 * screen's whole palette, which the reference reveals with its view cleared:
 * the same query with nothing hidden. They are carried here so every one of
 * them can be switched on, as it can there.
 *
 * The units are mixed deliberately and it matters which is which. The demand
 * and the free position are kilos, because that is what the shop weighs and
 * what a coverage figure has to be struck in. Stock, reserved, the advice and
 * the order are in the unit the product is bought by, because that is what a
 * buyer counts in and what goes on a purchase order.
 */
export type OrderAdviceRow = {
  productUuid: SelectProducts["uuid"];

  // ── The saved view, in its own order ───────────────────────────────────
  /** "Product code" */
  productCode: SelectProducts["productCode"];
  /** "Description" */
  description: SelectProducts["name"];
  /** "Main group" */
  mainGroup: SelectProductGroups["name"] | null;
  /** "Stock (Pur.U.)" — null when the product records no factor to convert by. */
  stockPurchaseUnit: number | null;
  /** "Reserved (Pur.U.)" — null when there is no factor to convert by. */
  reservedPurchaseUnit: number | null;
  /** "Available (Kg)" */
  availableKg: number;
  /** "To be received short term (Kg)" */
  toBeReceivedShortTermKg: number;
  /** "Econ. stock (Kg)" */
  economicStockKg: number;
  /** "Avg. Monthly consumption last year (Kg)" */
  avgMonthlyConsumptionLastYearKg: number;
  /** "Supplier" */
  supplierName: SelectCompanies["companyName"] | null;
  /** "Consumption previous month (Kg)" */
  consumptionPreviousMonthKg: number;
  /** "Avg. Monthly consumption last 3 years (Kg)" */
  avgMonthlyConsumptionLast3YearsKg: number;
  /** "Advice Weight rounded" */
  adviceWeightRounded: number;
  /** "Economic Coverage" — months of cover, null with no demand to divide by. */
  economicCoverage: number | null;
  /** "Technical Coverage" */
  technicalCoverage: number | null;
  /** "Stock product" */
  stockProduct: SelectProducts["stockProduct"];
  /** "Advice Qty. (Pur.U.)" */
  adviceQtyPurchaseUnit: number | null;
  /** "OrderQty (Pur.U.)" */
  orderQtyPurchaseUnit: number | null;
  /** The unit the purchase-unit figures are counted in. */
  purchaseUnit: SelectProducts["purchasingUnit"];

  // ── Identity and classification ────────────────────────────────────────
  /** "Product group" — the group the product sits in directly. */
  productGroup: SelectProductGroups["name"] | null;
  /** "Quality" — the material grade. */
  quality: SelectProducts["featuresQuality"];
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  /** "PAC-Code" */
  pacCode: SelectProducts["pacClassification"];
  orderAdviceCode: SelectProducts["orderAdviceCode"];
  orderAdviceNotes: SelectProducts["orderingAdviceNotes"];

  // ── Conversion factors and units ───────────────────────────────────────
  /** "Theoretical Weight/Pcs." */
  theoreticalWeight: number | null;
  /** "U(replacement price)" */
  replacementPriceUnit: string | null;

  // ── Supplier terms ─────────────────────────────────────────────────────
  supplierCode: SelectCompanies["searchCode1"] | null;
  /** "Product no. sup." — the supplier's own article number for our product. */
  supplierProductNo: SelectProductGroupSuppliers["externalProductCode"] | null;
  /** "Deliver time" and "U.(delivery time)" */
  deliveryTime: number;
  deliveryTimeUnit: SelectProductGroupSuppliers["deliveryTimeUnit"] | null;
  /** "Min. OrderQty." and "U.(Moq.)" */
  minOrderQty: number;
  minOrderQtyUnit: string | null;
  /** "Order series" and "U(order series)" */
  orderSeries: number;
  orderSeriesUnit: string | null;

  // ── The stocking policy, exposed ───────────────────────────────────────
  /** "Min. Stock (Pur.U.)" and "Max. Stock (Pur.U.)" */
  minStock: number | null;
  maxStock: number | null;
  /** "Min. Stk. Method (Pur.U.)" — the level with its method named, as there. */
  minStockMethod: string | null;
  minStockFixedValue: number;
  minStockFactor: number;
  maxStockMethod: string | null;
  maxStockFixedValue: number;
  maxStockFactor: number;

  // ── The position, in the purchase unit ─────────────────────────────────
  /** "Available (Pur.U.)" */
  availablePurchaseUnit: number | null;
  /** "Not reserved call-off (Pur.U.)" */
  notReservedCallOff: number;
  /** "Not reserved other (Pur.U.)" */
  notReservedOther: number | null;
  /** "Not covered other (Pur.U.)" */
  notCoveredOther: number | null;
  /** "Blocked (Pur.U.)" */
  blockedPurchaseUnit: number | null;
  /** "Econ. stock (Pur.U.)" */
  economicStockPurchaseUnit: number | null;
  /** "Consign." and "Consign.KG" */
  consignment: number;
  consignmentKg: number;

  // ── Incoming ───────────────────────────────────────────────────────────
  /** "To be received short term (Pur.U.)" */
  toBeReceivedShortTermPurchaseUnit: number | null;
  /** "To be received long term (Kg)" and "(Pur.U.)" */
  toBeReceivedLongTermKg: number;
  toBeReceivedLongTermPurchaseUnit: number;

  // ── Demand, in both units ──────────────────────────────────────────────
  consumptionPreviousMonth: number | null;
  consumptionLast3Months: number | null;
  consumptionLast3MonthsKg: number;
  consumptionLastYear: number | null;
  consumptionLastYearKg: number;
  avgMonthlyConsumptionLast3Months: number | null;
  avgMonthlyConsumptionPreviousYear: number | null;
  avgMonthlyConsumptionLast2Years: number | null;
  avgMonthlyConsumptionLast2YearsKg: number;
  avgMonthlyConsumptionLast3Years: number | null;
  /** "Avg. Monthly consumption 3 w.r.t. 1 year (%)" — a ratio, despite the %. */
  consumptionTrend: number | null;

  // ── Advice and money ───────────────────────────────────────────────────
  /** "Advice Qty. rounded" */
  adviceQtyRounded: number | null;
  /** "Replacement price" */
  replacementPrice: number | null;
  /** "Amount" — the advice at the replacement price. */
  amount: number | null;
  /** "Turnover rate" */
  turnoverRate: number | null;
};

// Order advice: for every stock product, compare its economic stock — what is
// free on the shelf plus what is already coming — against the min/max policy on
// its product group, and advise what to buy to bring it back to the maximum.
//
// The whole chain is struck in the unit the product is bought by — demand,
// policy, advice — and the weight column is derived back out of the answer.
// That is the reference system's own order of operations: it advises six pieces
// of a product whose weight per piece is blank, which a kilo-first engine could
// never do.
// Advised products only: a stock product the buyer has asked for advice on.
//
// Two products in one group can disagree about this — the reference shows
// `CAA1050020` excluded while `CAA1050030` beside it, same group and equally a
// stock product, is included, 83 such pairs across two exports. So it is a
// property of the product, and the group's copy is only the form's default.
const ADVISED = and(
  eq(Products.stockProduct, true),
  eq(Products.makingOrderAdvices, true),
);

const ORDER_ADVICE_SEARCH = [Products.productCode, Products.name] as const;

const ORDER_ADVICE_FILTERS: FilterBindings = {
  supplier: relationFilter(Companies.uuid),
  orderAdviceCode: valueFilter(Products.orderAdviceCode),
};

const ORDER_ADVICE_SORTABLE: SortableColumns = {
  productCode: Products.productCode,
  description: Products.name,
};

/**
 * One page of order advice.
 *
 * Paged at the base query. Everything after it — stock, reservations,
 * consumption, prices — is already scoped to the products the base returned, so
 * limiting the base limits the whole chain rather than just what is rendered.
 * The reference advises on 5 535 products and this screen used to compute all
 * of them, through four levels of group hierarchy and half a dozen aggregate
 * queries, on every page load. That is what made it one of the two pages that
 * timed the production build out.
 */
const orderAdviceRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<OrderAdviceRow[]> => {
    try {
      // The hierarchy runs deeper than one level. Walking it in the reference
      // system — "Aluminum" → "Aluminium plates" → "Aluminium plate semi-rigid
      // 1S" → the sized plate itself — shows four levels, each pointing at its
      // parent through a "Material group" field. "Main group" is the **root** of
      // that chain, not the immediate parent, so the climb has to keep going
      // until it runs out of parents.
      //
      // Bounded at three hops rather than done as a recursive CTE: the deepest
      // chain seen is three groups above a product, and a fixed set of joins
      // stays a single query the planner can index. If a fifth level ever
      // appears, add another alias.
      const Parent = alias(ProductGroups, "group_parent");
      const Grandparent = alias(ProductGroups, "group_grandparent");
      const Root = alias(ProductGroups, "group_root");

      const base = await db
        .select({
          productUuid: Products.uuid,
          productCode: Products.productCode,
          description: Products.name,
          stockProduct: Products.stockProduct,
          purchasingUnit: Products.purchasingUnit,
          stockUnit: Products.stockUnit,
          salesUnit: Products.salesUnit,
          theoreticalWeight: Products.theoreticalWeight,
          weightPerM1: Products.weightPerM1,
          productOrderSeries: Products.orderSeries,
          productOrderSeriesUnit: Products.orderSeriesUnit,
          productMinOrderQty: Products.minOrderQty,
          productMinOrderQtyUnit: Products.minOrderQtyUnit,
          quality: Products.featuresQuality,
          pacCode: Products.pacClassification,
          orderAdviceCode: Products.orderAdviceCode,
          orderAdviceNotes: Products.orderingAdviceNotes,
          // The root of the hierarchy, not the product's own group. A product
          // sitting directly under "Aluminum" shows "Aluminum" here; one under
          // "Aluminium coils A5754" shows "Aluminum" too, because that is the
          // group's parent. Proved on the reference system's own Sold products
          // screen, which shows both levels side by side.
          mainGroup: sql<
            string | null
          >`COALESCE(${Root.name}, ${Grandparent.name}, ${Parent.name}, ${ProductGroups.name})`,
          productGroup: ProductGroups.name,
          revenueGroupNumber: RevenueGroups.number,
          revenueGroupName: RevenueGroups.name,
          minStockMode: ProductGroups.minStockMode,
          minStockMultiplier: ProductGroups.minStockMultiplier,
          minStockFixedValue: ProductGroups.minStockFixedValue,
          maxStockMode: ProductGroups.maxStockMode,
          maxStockMultiplier: ProductGroups.maxStockMultiplier,
          maxStockFixedValue: ProductGroups.maxStockFixedValue,
          groupOrderSeries: ProductGroups.stockOpOrderSeries,
          groupMinOrderQty: ProductGroups.minOrderQty,
          supplierOrderSeries: ProductGroupSuppliers.orderSeries,
          supplierOrderSeriesUnit: ProductGroupSuppliers.orderSeriesUnit,
          supplierMoq: ProductGroupSuppliers.moq,
          supplierMoqUnit: ProductGroupSuppliers.moqUnit,
          supplierDeliveryTime: ProductGroupSuppliers.deliveryTime,
          supplierDeliveryTimeUnit: ProductGroupSuppliers.deliveryTimeUnit,
          supplierProductNo: ProductGroupSuppliers.externalProductCode,
          supplierName: Companies.companyName,
          supplierCode: Companies.searchCode1,
        })
        .from(Products)
        .leftJoin(
          ProductGroups,
          eq(Products.productGroupUuid, ProductGroups.uuid),
        )
        .leftJoin(Parent, eq(ProductGroups.parentUuid, Parent.uuid))
        .leftJoin(Grandparent, eq(Parent.parentUuid, Grandparent.uuid))
        .leftJoin(Root, eq(Grandparent.parentUuid, Root.uuid))
        .leftJoin(
          RevenueGroups,
          eq(Products.revenueGroupUuid, RevenueGroups.uuid),
        )
        .leftJoin(
          ProductGroupSuppliers,
          and(
            eq(ProductGroupSuppliers.productGroupUuid, ProductGroups.uuid),
            eq(ProductGroupSuppliers.preferred, true),
          ),
        )
        .leftJoin(
          Companies,
          eq(ProductGroupSuppliers.supplierCompanyUuid, Companies.uuid),
        )
        .where(
          tableWhere({
            query,
            search: ORDER_ADVICE_SEARCH,
            filters: ORDER_ADVICE_FILTERS,
            scope: [ADVISED],
          }),
        )
        .orderBy(
          ...tableOrderBy(
            ORDER_ADVICE_SORTABLE,
            query,
            [asc(Products.productCode)],
            Products.id,
          ),
        )
        .limit(limit)
        .offset(offset);

      if (base.length === 0) {
        return [];
      }

      const productUuids = base.map((row) => row.productUuid);

      // On-hand stock, weighed. "pending" lots are the on-hand state in this
      // schema (a lot flips to "received" only once it is fully depleted). Own
      // stock only — no consignment — and not blocked.
      //
      // Counted and weighed, because the screen needs both. The reference
      // system prints a purchase-unit position for products that record no
      // weight at all, which it could only do by holding the count natively —
      // so the count is the primary figure and the weight feeds the (Kg)
      // columns beside it.
      const stockRows = await db
        .select({
          productUuid: Stock.productUuid,
          technicalQty: sql<string>`COALESCE(SUM(${Stock.quantity}), 0)`,
          reservedQty: sql<string>`COALESCE(SUM(${Stock.reservedQuantity}), 0)`,
          technicalKg: sql<string>`COALESCE(SUM(${Stock.quantityKg}), 0)`,
          reservedKg: sql<string>`COALESCE(SUM(
          CASE
            WHEN ${Stock.quantity} > 0
            THEN ${Stock.quantityKg} * (${Stock.reservedQuantity} / ${Stock.quantity})
            ELSE 0
          END
        ), 0)`,
        })
        .from(Stock)
        .where(
          and(
            inArray(Stock.productUuid, productUuids),
            eq(Stock.status, "pending"),
            eq(Stock.blocked, false),
            isNull(Stock.ownerCompanyUuid),
          ),
        )
        .groupBy(Stock.productUuid);

      const stockByProduct = new Map(
        stockRows.map((row) => [
          row.productUuid,
          {
            technicalQty: Number(row.technicalQty),
            reservedQty: Number(row.reservedQty),
            technicalKg: Number(row.technicalKg),
            reservedKg: Number(row.reservedKg),
          },
        ]),
      );

      // The blocked lots the position above leaves out. The reference counts
      // them in a column of their own rather than silently dropping them, so a
      // buyer can see stock that exists but cannot be sold.
      const blockedRows = await db
        .select({
          productUuid: Stock.productUuid,
          qty: sql<string>`COALESCE(SUM(${Stock.quantity}), 0)`,
          kg: sql<string>`COALESCE(SUM(${Stock.quantityKg}), 0)`,
        })
        .from(Stock)
        .where(
          and(
            inArray(Stock.productUuid, productUuids),
            eq(Stock.status, "pending"),
            eq(Stock.blocked, true),
            isNull(Stock.ownerCompanyUuid),
          ),
        )
        .groupBy(Stock.productUuid);

      const blockedByProduct = new Map(
        blockedRows.map((row) => [
          row.productUuid,
          { qty: Number(row.qty), kg: Number(row.kg) },
        ]),
      );

      // Still coming, and not already spoken for. "Short term" is not a date
      // horizon: the reference system leaves out the reserved part of an open
      // line, because that quantity is already promised to an order and will
      // never reach free stock. Proved on one of its own rows — a line of 5 with
      // 2 reserved and 613,3 kg still to come shows 367,98, which is
      // 613,3 × (5 − 2) / 5.
      const onOrderRows = await db
        .select({
          productUuid: PurchaseOrderItems.productUuid,
          toBeReceivedQty: sql<string>`COALESCE(SUM(
          GREATEST(
            ${PurchaseOrderItems.quantity}
              - COALESCE(${PurchaseOrderItems.qtyReceived}, 0)
              - COALESCE(${PurchaseOrderItems.reservedQty}, 0),
            0
          )
        ), 0)`,
          toBeReceivedKg: sql<string>`COALESCE(SUM(
          CASE
            WHEN ${PurchaseOrderItems.quantity} > 0
            THEN ${PurchaseOrderItems.kgPurchased} * (GREATEST(${PurchaseOrderItems.quantity} - COALESCE(${PurchaseOrderItems.qtyReceived}, 0) - COALESCE(${PurchaseOrderItems.reservedQty}, 0), 0) / ${PurchaseOrderItems.quantity})
            ELSE 0
          END
        ), 0)`,
        })
        .from(PurchaseOrderItems)
        .innerJoin(
          PurchaseOrders,
          eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
        )
        .where(
          and(
            inArray(PurchaseOrderItems.productUuid, productUuids),
            inArray(PurchaseOrders.status, [...openPurchaseOrderStatuses]),
          ),
        )
        .groupBy(PurchaseOrderItems.productUuid);

      const onOrderByProduct = new Map(
        onOrderRows.map((row) => [
          row.productUuid,
          {
            qty: Number(row.toBeReceivedQty),
            kg: Number(row.toBeReceivedKg),
          },
        ]),
      );

      // Demand, counted and weighed, over every window the palette shows.
      //
      // "Last year" is the trailing twelve months and "previous year" the twelve
      // before that — two different windows, which is why the reference carries
      // both. Proved on `601003021`: a previous-year average of 26 and a last
      // year of 11 give 312 + 11 = 323 against a two-year total of 13,5 × 24 =
      // 324. The two- and three-year averages divide by 24 and 36 flat.
      const windowSql = (months: number, column: AnyMySqlColumn) =>
        sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL ${sql.raw(String(months))} MONTH) THEN ${column} ELSE 0 END), 0)`;

      const consumptionRows = await db
        .select({
          productUuid: InvoiceItems.productUuid,
          lastYearQty: windowSql(12, InvoiceItems.quantity),
          lastYearKg: windowSql(12, InvoiceItems.weightKg),
          last3MonthsQty: windowSql(3, InvoiceItems.quantity),
          last3MonthsKg: windowSql(3, InvoiceItems.weightKg),
          last2YearsQty: windowSql(24, InvoiceItems.quantity),
          last2YearsKg: windowSql(24, InvoiceItems.weightKg),
          last3YearsQty: windowSql(36, InvoiceItems.quantity),
          last3YearsKg: windowSql(36, InvoiceItems.weightKg),
          previousMonthQty: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01') AND ${Invoices.invoiceDate} < DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN ${InvoiceItems.quantity} ELSE 0 END), 0)`,
          previousMonthKg: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01') AND ${Invoices.invoiceDate} < DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN ${InvoiceItems.weightKg} ELSE 0 END), 0)`,
          previousYearQty: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH) AND ${Invoices.invoiceDate} < DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.quantity} ELSE 0 END), 0)`,
          previousYearKg: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH) AND ${Invoices.invoiceDate} < DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.weightKg} ELSE 0 END), 0)`,
        })
        .from(InvoiceItems)
        .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
        .where(inArray(InvoiceItems.productUuid, productUuids))
        .groupBy(InvoiceItems.productUuid);

      const consumptionByProduct = new Map(
        consumptionRows.map((row) => [
          row.productUuid,
          {
            lastYearQty: Number(row.lastYearQty),
            lastYearKg: Number(row.lastYearKg),
            last3MonthsQty: Number(row.last3MonthsQty),
            last3MonthsKg: Number(row.last3MonthsKg),
            last2YearsQty: Number(row.last2YearsQty),
            last2YearsKg: Number(row.last2YearsKg),
            last3YearsQty: Number(row.last3YearsQty),
            last3YearsKg: Number(row.last3YearsKg),
            previousMonthQty: Number(row.previousMonthQty),
            previousMonthKg: Number(row.previousMonthKg),
            previousYearQty: Number(row.previousYearQty),
            previousYearKg: Number(row.previousYearKg),
          },
        ]),
      );

      // Today's replacement price, from the dated price history: the row whose
      // period covers today. The advice is a decision taken now, so it is priced
      // at what the goods cost now — unlike Purchase results, which prices a
      // past receipt at the price of its own day.
      const today = todayDateString();
      const priceRows = await db
        .select({
          productUuid: ProductFspHistory.productUuid,
          replacementPrice: ProductFspHistory.replacementPrice,
          priceUnit: ProductFspHistory.priceUnit,
          startDate: ProductFspHistory.startDate,
        })
        .from(ProductFspHistory)
        .where(
          and(
            inArray(ProductFspHistory.productUuid, productUuids),
            lte(ProductFspHistory.startDate, today),
            or(
              isNull(ProductFspHistory.endDate),
              gte(ProductFspHistory.endDate, today),
            ),
          ),
        )
        .orderBy(desc(ProductFspHistory.startDate));

      const priceByProduct = new Map<
        string,
        { price: number; unit: string | null }
      >();
      for (const row of priceRows) {
        if (!priceByProduct.has(row.productUuid)) {
          priceByProduct.set(row.productUuid, {
            price: Number(row.replacementPrice ?? 0),
            unit: row.priceUnit,
          });
        }
      }

      return base.map((row) => {
        const stock = stockByProduct.get(row.productUuid);
        const weightPerPiece = Number(row.theoreticalWeight ?? 0);
        const weightPerM1 = Number(row.weightPerM1 ?? 0);
        const toPurchaseUnit = (kg: number) =>
          convertKgToUnit(kg, row.purchasingUnit, weightPerPiece, weightPerM1);

        // The position, weighed, for the (Kg) columns.
        const technicalKg = stock?.technicalKg ?? 0;
        const reservedKg = stock?.reservedKg ?? 0;
        const availableKg = technicalKg - reservedKg;
        const onOrder = onOrderByProduct.get(row.productUuid);
        const toBeReceivedShortTermKg = onOrder?.kg ?? 0;
        const economicStockKg = availableKg + toBeReceivedShortTermKg;

        // ...and the same position counted, which is what the purchase-unit
        // columns actually want. The reference system prints a purchase-unit
        // stock for products that record no weight at all — 102 pieces against a
        // blank "Theoretical Weight/Pcs." — which it can only do by holding the
        // count natively rather than converting a weight. So the count leads and
        // the conversion is the fallback, used only when a product is stocked in
        // one unit and bought in another.
        const technicalCount = stock?.technicalQty ?? 0;
        const reservedCount = stock?.reservedQty ?? 0;
        const economicStockCount =
          technicalCount - reservedCount + (onOrder?.qty ?? 0);

        // ...and the same position in the unit the product is bought by, which
        // is where the policy and the advice are actually decided.
        //
        // A 5,535-row export of the reference system settles the direction: it
        // has no "Min. Stock (Kg)" or "Max. Stock (Kg)" column at all, and a
        // product advised six pieces reports an advice weight of zero because it
        // records no weight per piece. A kilo-first engine could not have
        // produced that quantity. So the chain runs demand -> policy -> advice
        // in purchase units, and the weight is derived back out of it below.
        const stockCountsAsBought =
          row.purchasingUnit !== null && row.stockUnit === row.purchasingUnit;
        const inPurchaseUnit = (count: number, kg: number) =>
          stockCountsAsBought ? count : toPurchaseUnit(kg);

        const stockPurchaseUnit = inPurchaseUnit(technicalCount, technicalKg);
        const reservedPurchaseUnit = inPurchaseUnit(reservedCount, reservedKg);
        const economicStockPurchaseUnit = inPurchaseUnit(
          economicStockCount,
          economicStockKg,
        );
        const availablePurchaseUnit =
          stockPurchaseUnit === null || reservedPurchaseUnit === null
            ? null
            : stockPurchaseUnit - reservedPurchaseUnit;
        const toBeReceivedShortTermPurchaseUnit = inPurchaseUnit(
          onOrder?.qty ?? 0,
          toBeReceivedShortTermKg,
        );
        const blocked = blockedByProduct.get(row.productUuid);
        const blockedPurchaseUnit = inPurchaseUnit(
          blocked?.qty ?? 0,
          blocked?.kg ?? 0,
        );

        const consumption = consumptionByProduct.get(row.productUuid);
        const avgMonthlyConsumptionLastYearKg =
          (consumption?.lastYearKg ?? 0) / 12;
        const consumptionPreviousMonthKg = consumption?.previousMonthKg ?? 0;
        const avgMonthlyConsumptionLast3YearsKg =
          (consumption?.last3YearsKg ?? 0) / 36;

        // An invoice line is counted in the unit it was sold by, so when that
        // matches the buying unit no conversion is needed — and a weightless
        // product still gets a demand figure, which is what lets the policy work
        // for the two thirds of the catalogue that records no weight per piece.
        const soldAsBought =
          row.purchasingUnit !== null && row.salesUnit === row.purchasingUnit;
        const demandInPurchaseUnit = (count: number, kg: number) =>
          soldAsBought ? count : toPurchaseUnit(kg);

        const consumptionLastYearPurchaseUnit = demandInPurchaseUnit(
          consumption?.lastYearQty ?? 0,
          consumption?.lastYearKg ?? 0,
        );
        // Rounded to one decimal, which is not cosmetic: the reference system
        // divides by the figure it prints, not by the exact quotient. A product
        // with eleven units sold shows an average of 0,9 and a coverage of
        // 543,3 against an economic stock of 489 — and 489 / 0,9 is 543,3, where
        // 489 / (11/12) would be 533,5.
        const oneDecimal = (value: number | null, divisor: number) =>
          value === null ? null : Math.round((value / divisor) * 10) / 10;
        const avgMonthlyConsumptionLastYear = oneDecimal(
          consumptionLastYearPurchaseUnit,
          12,
        );

        // The monthly average is rounded to a whole purchase unit BEFORE either
        // factor is applied. Proved on the export: an average of 2,3 yields a
        // minimum of 2 and a maximum of 6, where rounding after multiplying
        // would have given 7. Half rounds up, so 4,5 yields 5 and 15.
        const baseline =
          avgMonthlyConsumptionLastYear === null
            ? null
            : Math.round(avgMonthlyConsumptionLastYear);

        // The two sides are not symmetrical: the minimum takes the fixed value
        // as a floor, the maximum takes it as a cap. That is the reference
        // system's own wording on a product's stock policy panel.
        const minMultiplier = Number(row.minStockMultiplier ?? 0);
        const minFixed = Number(row.minStockFixedValue ?? 0);
        const minStock =
          row.minStockMode === "fixed_value"
            ? minFixed
            : baseline === null
              ? null
              : Math.max(minMultiplier * baseline, minFixed);

        const maxMultiplier = Number(row.maxStockMultiplier ?? 0);
        const maxFixed = Number(row.maxStockFixedValue ?? 0);
        const maxStock =
          row.maxStockMode === "fixed_value"
            ? maxFixed
            : baseline === null
              ? null
              : maxFixed > 0
                ? Math.min(maxMultiplier * baseline, maxFixed)
                : maxMultiplier * baseline;

        // Nothing is advised until the position has actually fallen through the
        // minimum. Topping every product up to its maximum the moment it dips
        // would put the whole catalogue on a purchase order every week.
        const adviceQtyPurchaseUnit =
          minStock === null ||
          maxStock === null ||
          economicStockPurchaseUnit === null
            ? null
            : economicStockPurchaseUnit < minStock
              ? Math.max(0, maxStock - economicStockPurchaseUnit)
              : 0;

        // The weight is the derivative here, not the driver. The conversion is
        // linear, so inverting it is enough and no second helper is needed: one
        // kilo is worth toPurchaseUnit(1) of the purchase unit.
        const unitsPerKg = toPurchaseUnit(1);
        const adviceWeightRounded =
          adviceQtyPurchaseUnit === null ||
          unitsPerKg === null ||
          unitsPerKg <= 0
            ? 0
            : roundAdviceWeight(adviceQtyPurchaseUnit / unitsPerKg);

        // The supplier's own terms first, then the group's StockOp settings, then
        // whatever the product itself carries.
        const orderSeries =
          Number(row.supplierOrderSeries ?? 0) ||
          Number(row.groupOrderSeries ?? 0) ||
          Number(row.productOrderSeries ?? 0);
        const minOrderQty =
          Number(row.supplierMoq ?? 0) ||
          Number(row.groupMinOrderQty ?? 0) ||
          Number(row.productMinOrderQty ?? 0);

        // The level with its method named, which is how the reference prints the
        // method column — "2 (Factor x Avg.Mnt.Usg.)" on a row whose minimum is 2.
        const methodLabel = (
          level: number | null,
          mode: SelectProductGroups["minStockMode"],
        ) =>
          level === null
            ? null
            : `${level} (${mode === "fixed_value" ? "Fixed value" : "Factor x Avg.Mnt.Usg."})`;

        const price = priceByProduct.get(row.productUuid);
        // The advice weight priced in the replacement price's own unit, the same
        // tonne-or-kilo split every purchase amount uses.
        const adviceKg =
          adviceQtyPurchaseUnit === null ||
          unitsPerKg === null ||
          unitsPerKg <= 0
            ? null
            : adviceQtyPurchaseUnit / unitsPerKg;
        const amount =
          price === undefined || adviceKg === null
            ? null
            : price.price *
              (convertKgToUnit(
                adviceKg,
                price.unit as SelectProducts["purchasingUnit"],
                weightPerPiece,
                weightPerM1,
              ) ?? 0);

        const avgMonthlyConsumptionLast3Years = oneDecimal(
          demandInPurchaseUnit(
            consumption?.last3YearsQty ?? 0,
            consumption?.last3YearsKg ?? 0,
          ),
          36,
        );

        return {
          productUuid: row.productUuid,
          productCode: row.productCode,
          description: row.description,
          mainGroup: row.mainGroup,
          stockPurchaseUnit,
          reservedPurchaseUnit,
          availableKg,
          toBeReceivedShortTermKg,
          economicStockKg,
          avgMonthlyConsumptionLastYearKg,
          supplierName: row.supplierName,
          consumptionPreviousMonthKg,
          avgMonthlyConsumptionLast3YearsKg,
          adviceWeightRounded,
          // Months of cover, struck in purchase units on both sides. A ratio
          // is unit-invariant only while both halves share a unit, and the kilo
          // halves are simply absent for a product that records no weight — so
          // dividing kilos would report zero cover on a full shelf.
          economicCoverage:
            avgMonthlyConsumptionLastYear !== null &&
            avgMonthlyConsumptionLastYear > 0 &&
            economicStockPurchaseUnit !== null
              ? economicStockPurchaseUnit / avgMonthlyConsumptionLastYear
              : null,
          technicalCoverage:
            avgMonthlyConsumptionLastYear !== null &&
            avgMonthlyConsumptionLastYear > 0 &&
            stockPurchaseUnit !== null
              ? stockPurchaseUnit / avgMonthlyConsumptionLastYear
              : null,
          stockProduct: row.stockProduct,
          adviceQtyPurchaseUnit,
          orderQtyPurchaseUnit:
            adviceQtyPurchaseUnit === null
              ? null
              : roundToOrderQty(
                  adviceQtyPurchaseUnit,
                  orderSeries,
                  minOrderQty,
                ),
          purchaseUnit: row.purchasingUnit,

          productGroup: row.productGroup,
          quality: row.quality,
          revenueGroupNumber: row.revenueGroupNumber,
          revenueGroupName: row.revenueGroupName,
          pacCode: row.pacCode,
          orderAdviceCode: row.orderAdviceCode,
          orderAdviceNotes: row.orderAdviceNotes,

          theoreticalWeight:
            row.theoreticalWeight === null
              ? null
              : Number(row.theoreticalWeight),
          replacementPriceUnit: price?.unit ?? null,

          supplierCode: row.supplierCode,
          supplierProductNo: row.supplierProductNo,
          deliveryTime: Number(row.supplierDeliveryTime ?? 0),
          deliveryTimeUnit: row.supplierDeliveryTimeUnit,
          minOrderQty,
          minOrderQtyUnit: row.supplierMoqUnit ?? row.productMinOrderQtyUnit,
          orderSeries,
          orderSeriesUnit:
            row.supplierOrderSeriesUnit ?? row.productOrderSeriesUnit,

          minStock,
          maxStock,
          minStockMethod: methodLabel(minStock, row.minStockMode),
          minStockFixedValue: minFixed,
          minStockFactor: minMultiplier,
          maxStockMethod: methodLabel(maxStock, row.maxStockMode),
          maxStockFixedValue: maxFixed,
          maxStockFactor: maxMultiplier,

          availablePurchaseUnit,
          // Call-off reservations are a separate bucket in the reference, and it
          // is zero on every one of its 5,535 rows: the business does not reserve
          // against call-offs. With that bucket empty, all unreserved stock is
          // "other", and stock not matched to demand is the same figure — which
          // is exactly what the export shows for "Not covered other".
          notReservedCallOff: 0,
          notReservedOther: availablePurchaseUnit,
          notCoveredOther: availablePurchaseUnit,
          blockedPurchaseUnit,
          economicStockPurchaseUnit,
          // Consignment stock and long-term receipts: never populated across the
          // reference's whole export. The business uses neither, so they read
          // zero here as they do there, rather than being left off the screen.
          consignment: 0,
          consignmentKg: 0,

          toBeReceivedShortTermPurchaseUnit,
          toBeReceivedLongTermKg: 0,
          toBeReceivedLongTermPurchaseUnit: 0,

          consumptionPreviousMonth: demandInPurchaseUnit(
            consumption?.previousMonthQty ?? 0,
            consumption?.previousMonthKg ?? 0,
          ),
          consumptionLast3Months: demandInPurchaseUnit(
            consumption?.last3MonthsQty ?? 0,
            consumption?.last3MonthsKg ?? 0,
          ),
          consumptionLast3MonthsKg: consumption?.last3MonthsKg ?? 0,
          consumptionLastYear: consumptionLastYearPurchaseUnit,
          consumptionLastYearKg: consumption?.lastYearKg ?? 0,
          avgMonthlyConsumptionLast3Months: oneDecimal(
            demandInPurchaseUnit(
              consumption?.last3MonthsQty ?? 0,
              consumption?.last3MonthsKg ?? 0,
            ),
            3,
          ),
          avgMonthlyConsumptionPreviousYear: oneDecimal(
            demandInPurchaseUnit(
              consumption?.previousYearQty ?? 0,
              consumption?.previousYearKg ?? 0,
            ),
            12,
          ),
          avgMonthlyConsumptionLast2Years: oneDecimal(
            demandInPurchaseUnit(
              consumption?.last2YearsQty ?? 0,
              consumption?.last2YearsKg ?? 0,
            ),
            24,
          ),
          avgMonthlyConsumptionLast2YearsKg:
            (consumption?.last2YearsKg ?? 0) / 24,
          avgMonthlyConsumptionLast3Years,
          // Three-year average against one-year average, as a plain ratio: the
          // reference heads it with a % but stores 1,2 ÷ 2,3 = 0,5217 unmultiplied.
          consumptionTrend:
            avgMonthlyConsumptionLast3Years !== null &&
            avgMonthlyConsumptionLastYear !== null &&
            avgMonthlyConsumptionLastYear > 0
              ? avgMonthlyConsumptionLast3Years / avgMonthlyConsumptionLastYear
              : null,

          // No order series or minimum is recorded on any product the reference
          // advised, so its rounded advice equals the advice; ours rounds up to a
          // whole purchase unit, which is what "rounded" means for a count.
          adviceQtyRounded:
            adviceQtyPurchaseUnit === null
              ? null
              : Math.ceil(adviceQtyPurchaseUnit),
          replacementPrice: price?.price ?? null,
          amount,
          // Consumption over the year against the stock on hand. The reference
          // divides by an average stock it does not export, so this matches it on
          // nine of eleven rows rather than on all of them.
          turnoverRate:
            consumptionLastYearPurchaseUnit !== null &&
            stockPurchaseUnit !== null &&
            stockPurchaseUnit > 0
              ? consumptionLastYearPurchaseUnit / stockPurchaseUnit
              : null,
        };
      });
    } catch (error) {
      throw new Error(describeError(error, "Failed to fetch order advice"));
    }
  };

export const getOrderAdvice = async (
  query: TableQuery,
): Promise<Paged<OrderAdviceRow>> =>
  runPaged(query, {
    rows: orderAdviceRows(query),
    count: async () => {
      const Parent = alias(ProductGroups, "count_group_parent");
      const Grandparent = alias(ProductGroups, "count_group_grandparent");
      const Root = alias(ProductGroups, "count_group_root");

      const [row] = await db
        .select({ value: count() })
        .from(Products)
        .leftJoin(
          ProductGroups,
          eq(Products.productGroupUuid, ProductGroups.uuid),
        )
        .leftJoin(Parent, eq(ProductGroups.parentUuid, Parent.uuid))
        .leftJoin(Grandparent, eq(Parent.parentUuid, Grandparent.uuid))
        .leftJoin(Root, eq(Grandparent.parentUuid, Root.uuid))
        .leftJoin(
          ProductGroupSuppliers,
          and(
            eq(ProductGroupSuppliers.productGroupUuid, ProductGroups.uuid),
            eq(ProductGroupSuppliers.preferred, true),
          ),
        )
        .leftJoin(
          Companies,
          eq(ProductGroupSuppliers.supplierCompanyUuid, Companies.uuid),
        )
        .where(
          tableWhere({
            query,
            search: ORDER_ADVICE_SEARCH,
            filters: ORDER_ADVICE_FILTERS,
            scope: [ADVISED],
          }),
        );

      return Number(row?.value ?? 0);
    },
  });

export const exportOrderAdvice = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Order advice",
    columns: ORDER_ADVICE_COLUMNS,
    columnKeys,
    rows: orderAdviceRows(parseTableQuery(params)),
  });

/** The order advice codes the advised products carry, for the filter. */
export const getOrderAdviceCodes = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ code: Products.orderAdviceCode })
    .from(Products)
    .where(ADVISED)
    .orderBy(asc(Products.orderAdviceCode));

  return rows
    .map((row) => row.code)
    .filter((code): code is string => code !== null && code !== "");
};

/** The suppliers that actually carry an advised product, for the filter. */
export const getOrderAdviceSuppliers = async (): Promise<
  Array<{ uuid: string; name: string }>
> => {
  const rows = await db
    .selectDistinct({ uuid: Companies.uuid, name: Companies.companyName })
    .from(Products)
    .innerJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
    .innerJoin(
      ProductGroupSuppliers,
      and(
        eq(ProductGroupSuppliers.productGroupUuid, ProductGroups.uuid),
        eq(ProductGroupSuppliers.preferred, true),
      ),
    )
    .innerJoin(
      Companies,
      eq(ProductGroupSuppliers.supplierCompanyUuid, Companies.uuid),
    )
    .where(ADVISED)
    .orderBy(asc(Companies.companyName));

  return rows.filter((row) => Boolean(row.name));
};
