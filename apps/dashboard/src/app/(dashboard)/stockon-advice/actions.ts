"use server";

import {
  STOCKON_ADVICE_COLUMNS,
  StockOnAdviceColumnKey,
} from "@/app/(dashboard)/stockon-advice/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { ProductGroupSuppliers } from "@/db/schema/product-group-suppliers";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import { leadTimeMethods, LeadTimeMethod } from "@/lib/enums";
import { exportRows } from "@/lib/server/excel";
import {
  amountForWeight,
  convertKgToUnit,
  deliveryTimeInDays,
  describeError,
  generateUuid,
  moneyString,
  productPieceWeightKg,
  roundToOrderQty,
  todayDateString,
  workingDaysUntil,
} from "@/lib/helpers";
import { LEAD_TIME_METHOD_LABELS } from "@/lib/labels";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableFilterControl,
  TableQuery,
} from "@/lib/table-query";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// What counts as still coming. A cancelled or completed order brings nothing,
// and a provisional one is not an order yet — it is a draft somebody may still
// throw away, so counting it would suppress the advice that produced it.
const OPEN_PURCHASE_ORDER_STATUSES = [
  "open",
  "confirmed",
  "pre_notified",
] as const;

// Receptions the goods actually arrived on, which is what a realised lead time
// has to be measured against.
const ARRIVED_RECEIPT_STATUSES = [
  "partially_received",
  "received",
  "invoiced",
] as const;

export type StockOnAdviceRow = {
  productUuid: SelectProducts["uuid"];
  /** "Product code" */
  productCode: SelectProducts["productCode"];
  /** "Product" */
  productName: SelectProducts["name"];
  /** "Main group" — the root of the product hierarchy, not the parent. */
  mainGroup: SelectProductGroups["name"] | null;
  /** "Product group" — the group the product sits in directly. */
  productGroup: SelectProductGroups["name"] | null;
  /** "Stock U." */
  stockUnit: SelectProducts["stockUnit"];
  /** "Purchase U." */
  purchaseUnit: SelectProducts["purchasingUnit"];
  /** "Preferred supplier" */
  supplierUuid: SelectCompanies["uuid"] | null;
  supplierName: SelectCompanies["companyName"] | null;

  // ── The position, in the unit the product is stocked by ──────────────────
  /** "Techn. Stk." */
  technicalStock: number;
  /** "Reserved" */
  reserved: number;
  /** "Available Stk." */
  availableStock: number;
  /** "Techn. Stk. + To receive" */
  technicalPlusToReceive: number;

  // ── What is still coming, in the unit the product is bought by ───────────
  /** "To be received short term (Pur.U.)" — free of what is already promised. */
  toBeReceivedShortTerm: number | null;
  /** "To be received long term (Pur.U.)" — unused by this business; see below. */
  toBeReceivedLongTerm: number;

  // ── The decision, struck in purchase units ───────────────────────────────
  /** The free position the order level is compared against. */
  economicStock: number | null;
  /** "Order Level" */
  orderLevel: number | null;
  /** "Order Level (Kg. or Psc.)" */
  orderLevelStockUnit: number | null;
  /** "To order" */
  toOrder: number | null;
  /** "To order (Kg. or Psc.)" */
  toOrderStockUnit: number | null;
  /** "Stock - Order level" */
  stockMinusOrderLevel: number | null;
  /** "% Difference" */
  pctDifference: number | null;

  // ── What the decision was made from ──────────────────────────────────────
  /** "Avg. Consumption/day" */
  avgConsumptionPerDay: number | null;
  /** "Avg. Consumption during L + R" */
  avgConsumptionDuringLR: number | null;
  /** "Number of days stk." */
  daysOfStock: number | null;
  /** "Lead time (days)" — realised, when the method says to measure it. */
  leadTimeDays: number;
  /** "Review time (days)" */
  reviewPeriodDays: number;
  /** "Lead time method" */
  leadTimeMethod: NonNullable<SelectProductGroups["leadTimeMethod"]>;
  /** "Determined by StockOp" — the product's own switch, not its group's. */
  determinedByStockOp: NonNullable<SelectProducts["useStockOpForThisProduct"]>;
  /** "Evaluate/decide today?" */
  evaluateToday: boolean;
  /** "Order now?" */
  orderNow: boolean;

  // ── The delivery already on its way ──────────────────────────────────────
  /** "1st current PO" */
  firstPurchaseOrderUuid: SelectPurchaseOrders["uuid"] | null;
  firstPurchaseOrderId: SelectPurchaseOrders["id"] | null;
  /** "1st PO reception" */
  firstReceiptDate: SelectPurchaseOrderItems["receiptDate"] | null;
  /** "Working days until 1st receipt" */
  workingDaysUntilFirstReceipt: number | null;

  /** The two classification codes the stock policy carries beside StockOp. */
  pacClassification: SelectProducts["pacClassification"];
  orderAdviceCode: SelectProducts["orderAdviceCode"];
};

/**
 * One page of the advice, plus how many products are on the plan at all.
 *
 * The count is what separates "nobody has put a product on this plan" from "the
 * plan is quiet today", and those two are entirely different messages to show
 * somebody looking at an empty grid.
 */
export type StockOnAdvicePage = Paged<StockOnAdviceRow> & {
  enrolled: number;
  /**
   * The filter controls, built from the same pass that produced the rows. They
   * travel with the page rather than from a call of their own because both come
   * out of one computation, and running it twice to ask it two questions is a
   * second trip through every product on the plan.
   */
  filters: TableFilterControl[];
};

export type StockOnAdviceActionResult = {
  success?: boolean;
  error?: string;
  purchaseOrderUuid?: string;
};

type LeadTimeHistory = {
  averageDays: number;
  maximumDays: number;
};

type FirstOpenOrder = {
  purchaseOrderUuid: string;
  purchaseOrderId: number;
  expectedDate: string | null;
};

// Maps a JS weekday (0 = Sunday) onto the five ordering-day flags.
const isEvaluationDay = (
  weekday: number,
  days: {
    monday: boolean | null;
    tuesday: boolean | null;
    wednesday: boolean | null;
    thursday: boolean | null;
    friday: boolean | null;
  },
): boolean => {
  switch (weekday) {
    case 1:
      return Boolean(days.monday);
    case 2:
      return Boolean(days.tuesday);
    case 3:
      return Boolean(days.wednesday);
    case 4:
      return Boolean(days.thursday);
    case 5:
      return Boolean(days.friday);
    default:
      return false;
  }
};

// The first of a cascade that carries a real value. A zero is "not set" for
// every one of these parameters — a lead time of nought days, an order series
// of nought, a minimum of nought all mean nobody filled the field in — so a
// zero falls through to the next level rather than overriding it.
const firstSet = (
  ...values: Array<number | string | null | undefined>
): number => {
  for (const value of values) {
    const amount = Number(value ?? 0);
    if (Number.isFinite(amount) && amount !== 0) {
      return amount;
    }
  }
  return 0;
};

const matchesSearch = (row: StockOnAdviceRow, q: string | null): boolean => {
  const term = (q ?? "").trim().toLowerCase();
  if (term === "") {
    return true;
  }
  return [
    row.productCode,
    row.productName,
    row.mainGroup,
    row.productGroup,
    row.supplierName,
  ].some((value) => (value ?? "").toLowerCase().includes(term));
};

const matchesFilters = (
  row: StockOnAdviceRow,
  filters: TableQuery["filters"],
): boolean => {
  const has = (key: string, value: string | null) => {
    const wanted = filters[key];
    if (!wanted || wanted.length === 0) {
      return true;
    }
    return value !== null && wanted.includes(value);
  };

  return (
    has("mainGroup", row.mainGroup) &&
    has("supplier", row.supplierUuid) &&
    has("leadTimeMethod", row.leadTimeMethod) &&
    has("orderNow", String(row.orderNow)) &&
    has("evaluateToday", String(row.evaluateToday)) &&
    has("determinedByStockOp", String(row.determinedByStockOp))
  );
};

// A sort key reaches here from the URL, so it is resolved against this map
// rather than used to index a row: an unknown key sorts by the default.
const SORT_VALUES: Record<
  string,
  (row: StockOnAdviceRow) => number | string | null
> = {
  productCode: (row) => row.productCode,
  productName: (row) => row.productName,
  mainGroup: (row) => row.mainGroup,
  supplierName: (row) => row.supplierName,
  technicalStock: (row) => row.technicalStock,
  availableStock: (row) => row.availableStock,
  orderLevel: (row) => row.orderLevel,
  toOrder: (row) => row.toOrder,
  pctDifference: (row) => row.pctDifference,
  daysOfStock: (row) => row.daysOfStock,
  leadTimeDays: (row) => row.leadTimeDays,
  workingDaysUntilFirstReceipt: (row) => row.workingDaysUntilFirstReceipt,
};

// Missing sorts last whichever way the column is pointed: a product with no
// demand history has no coverage figure, and letting null lead would fill the
// top of the screen with the rows that say least.
const compareValues = (
  left: number | string | null,
  right: number | string | null,
): number => {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  if (typeof left === "string" || typeof right === "string") {
    return String(left).localeCompare(String(right));
  }
  return left - right;
};

const sortRows = (
  rows: StockOnAdviceRow[],
  query: TableQuery,
): StockOnAdviceRow[] => {
  const accessor = query.sort ? SORT_VALUES[query.sort] : undefined;
  const sign = query.dir === "desc" ? -1 : 1;

  return [...rows].sort((left, right) => {
    if (!accessor) {
      // The default: what must be ordered today, then how far through the order
      // level the product has fallen.
      if (left.orderNow !== right.orderNow) {
        return left.orderNow ? -1 : 1;
      }
      const byShortfall = compareValues(left.pctDifference, right.pctDifference);
      if (byShortfall !== 0) {
        return byShortfall;
      }
      return String(left.productCode).localeCompare(String(right.productCode));
    }
    const ordered = sign * compareValues(accessor(left), accessor(right));
    // Product code breaks every tie, so paging a sorted view cannot show the
    // same row twice or drop one between pages.
    return ordered !== 0
      ? ordered
      : String(left.productCode).localeCompare(String(right.productCode));
  });
};

/**
 * Every product on the StockOn plan, with its reorder decision worked out.
 *
 * This is the reference system's StockOn advice: a periodic-review policy, as
 * against Order advice's min/max one. The question it answers is not "has stock
 * dipped below its minimum" but "will what is on hand, plus what is already
 * coming, still be there when the next delivery can physically arrive" — so the
 * whole calculation hangs off two parameters the min/max policy never uses, the
 * supplier's lead time (L) and how often the decision is revisited (R).
 *
 * Struck in purchase units throughout, for the reason set out at length in
 * order-advice/actions.ts: the reference system advises a quantity for products
 * that record no weight at all, which a kilo-first engine could not do. The
 * "(Kg. or Psc.)" columns beside them are that answer converted back into the
 * unit the product is stocked by.
 */
const stockOnAdviceRows = async (): Promise<StockOnAdviceRow[]> => {
  // "Main group" is the root of the hierarchy rather than the immediate parent
  // — same three-hop climb as Order advice, and the same reason for it.
  const Parent = alias(ProductGroups, "group_parent");
  const Grandparent = alias(ProductGroups, "group_grandparent");
  const Root = alias(ProductGroups, "group_root");

  const base = await db
    .select({
      productUuid: Products.uuid,
      productCode: Products.productCode,
      productName: Products.name,
      stockUnit: Products.stockUnit,
      purchasingUnit: Products.purchasingUnit,
      salesUnit: Products.salesUnit,
      theoreticalWeight: Products.theoreticalWeight,
      weightPerM1: Products.weightPerM1,
      weightTheoretical: Products.weightTheoretical,
      pacClassification: Products.pacClassification,
      orderAdviceCode: Products.orderAdviceCode,

      // The product's own StockOp panel, which is where the reference system
      // configures this and where ours was not reading from.
      productUseStockOp: Products.useStockOpForThisProduct,
      productLeadTime: Products.leadTime,
      productReviewPeriod: Products.reviewPeriod,
      productLeadTimeMethod: Products.leadTimeMethod,
      productStockOpOrderSeries: Products.stockOpOrderSeries,
      productOrderSeries: Products.orderSeries,
      productMinOrderQty: Products.minOrderQty,
      productMinStockMode: Products.minStockMode,
      productMinStockMultiplier: Products.minStockMultiplier,
      productMinStockFixedValue: Products.minStockFixedValue,
      productOrderOnMonday: Products.orderOnMonday,
      productOrderOnTuesday: Products.orderOnTuesday,
      productOrderOnWednesday: Products.orderOnWednesday,
      productOrderOnThursday: Products.orderOnThursday,
      productOrderOnFriday: Products.orderOnFriday,

      productGroup: ProductGroups.name,
      mainGroup: sql<
        string | null
      >`COALESCE(${Root.name}, ${Grandparent.name}, ${Parent.name}, ${ProductGroups.name})`,
      groupUseStockOp: ProductGroups.useStockOpForThisProduct,
      groupLeadTime: ProductGroups.leadTime,
      groupReviewPeriod: ProductGroups.reviewPeriod,
      groupLeadTimeMethod: ProductGroups.leadTimeMethod,
      groupStockOpOrderSeries: ProductGroups.stockOpOrderSeries,
      groupMinOrderQty: ProductGroups.minOrderQty,
      groupMinStockMode: ProductGroups.minStockMode,
      groupMinStockMultiplier: ProductGroups.minStockMultiplier,
      groupMinStockFixedValue: ProductGroups.minStockFixedValue,
      groupOrderOnMonday: ProductGroups.orderOnMonday,
      groupOrderOnTuesday: ProductGroups.orderOnTuesday,
      groupOrderOnWednesday: ProductGroups.orderOnWednesday,
      groupOrderOnThursday: ProductGroups.orderOnThursday,
      groupOrderOnFriday: ProductGroups.orderOnFriday,

      supplierUuid: Companies.uuid,
      supplierName: Companies.companyName,
      supplierDeliveryTime: ProductGroupSuppliers.deliveryTime,
      supplierDeliveryTimeUnit: ProductGroupSuppliers.deliveryTimeUnit,
      supplierOrderSeries: ProductGroupSuppliers.orderSeries,
      supplierMoq: ProductGroupSuppliers.moq,
    })
    .from(Products)
    .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
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
    // Enrolment is the product's own switch first — that is the box the
    // reference system puts on a product's Stock policy panel and the one a
    // buyer ticks. The group's copy still counts, because a group is where a
    // whole family of products is put on the plan at once; it acts as the
    // default for products that never said otherwise.
    .where(
      and(
        eq(Products.stockProduct, true),
        or(
          eq(Products.useStockOpForThisProduct, true),
          eq(ProductGroups.useStockOpForThisProduct, true),
        ),
      ),
    )
    .orderBy(Products.productCode);

  if (base.length === 0) {
    return [];
  }

  const productUuids = base.map((row) => row.productUuid);

  // On-hand stock, counted and weighed. "pending" lots are the on-hand state in
  // this schema; own stock only, and not blocked.
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

  // Still coming. Short term is the part of the open order book that will
  // actually reach free stock — the reserved portion of a line is already
  // promised to a sales order and will be picked the day it lands, so counting
  // it would show cover that nobody can sell. That is the reading Order
  // advice's "to be received short term" column was proved on.
  //
  // Long term is not the rest of the order book. The same pair of columns on
  // Order advice reads zero on all 5,535 rows of the reference's export while
  // short term is filled, so long term is a different kind of expectation —
  // capacity booked at a mill, a call-off not yet drawn — that this business
  // does not use. It reads zero here for the same reason.
  const onOrderRows = await db
    .select({
      productUuid: PurchaseOrderItems.productUuid,
      shortTermQty: sql<string>`COALESCE(SUM(
        GREATEST(
          ${PurchaseOrderItems.quantity}
            - COALESCE(${PurchaseOrderItems.qtyReceived}, 0)
            - COALESCE(${PurchaseOrderItems.reservedQty}, 0),
          0
        )
      ), 0)`,
      shortTermKg: sql<string>`COALESCE(SUM(
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
        inArray(PurchaseOrders.status, [...OPEN_PURCHASE_ORDER_STATUSES]),
      ),
    )
    .groupBy(PurchaseOrderItems.productUuid);

  const onOrderByProduct = new Map(
    onOrderRows.map((row) => [
      row.productUuid,
      {
        shortTermQty: Number(row.shortTermQty),
        shortTermKg: Number(row.shortTermKg),
      },
    ]),
  );

  // The next delivery on its way, which is what makes a shortfall bearable or
  // urgent. Ordered by the date it is expected, so the first row per product is
  // the one the grid calls "1st current PO".
  const openLines = await db
    .select({
      productUuid: PurchaseOrderItems.productUuid,
      purchaseOrderUuid: PurchaseOrders.uuid,
      purchaseOrderId: PurchaseOrders.id,
      expectedDate: sql<
        string | null
      >`COALESCE(${PurchaseOrderItems.receiptDate}, ${PurchaseOrders.deliveryDate})`,
    })
    .from(PurchaseOrderItems)
    .innerJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .where(
      and(
        inArray(PurchaseOrderItems.productUuid, productUuids),
        inArray(PurchaseOrders.status, [...OPEN_PURCHASE_ORDER_STATUSES]),
        sql`${PurchaseOrderItems.quantity} > COALESCE(${PurchaseOrderItems.qtyReceived}, 0)`,
      ),
    )
    .orderBy(
      sql`COALESCE(${PurchaseOrderItems.receiptDate}, ${PurchaseOrders.deliveryDate}) IS NULL`,
      sql`COALESCE(${PurchaseOrderItems.receiptDate}, ${PurchaseOrders.deliveryDate})`,
      PurchaseOrders.id,
    );

  const firstOrderByProduct = new Map<string, FirstOpenOrder>();
  for (const line of openLines) {
    if (line.productUuid === null || firstOrderByProduct.has(line.productUuid)) {
      continue;
    }
    firstOrderByProduct.set(line.productUuid, {
      purchaseOrderUuid: line.purchaseOrderUuid,
      purchaseOrderId: line.purchaseOrderId,
      expectedDate: line.expectedDate,
    });
  }

  // Demand over the trailing year, counted and weighed, so a product that
  // records no weight still has a figure to average.
  const consumptionRows = await db
    .select({
      productUuid: InvoiceItems.productUuid,
      lastYearQty: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.quantity} ELSE 0 END), 0)`,
      lastYearKg: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.weightKg} ELSE 0 END), 0)`,
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
      },
    ]),
  );

  // What the supplier actually took, receipt by receipt, which is what the two
  // automatic lead-time methods are for: the average is what to plan on, the
  // maximum is what to plan on when running out is expensive.
  const leadTimeRows = await db
    .select({
      productUuid: PurchaseLineReceivals.productUuid,
      averageDays: sql<
        string | null
      >`AVG(GREATEST(DATEDIFF(COALESCE(${PurchaseLineReceivals.deliveryDateActual}, ${PurchaseLineReceivals.receiptDate}), ${PurchaseOrders.orderDate}), 0))`,
      maximumDays: sql<
        string | null
      >`MAX(GREATEST(DATEDIFF(COALESCE(${PurchaseLineReceivals.deliveryDateActual}, ${PurchaseLineReceivals.receiptDate}), ${PurchaseOrders.orderDate}), 0))`,
    })
    .from(PurchaseLineReceivals)
    .innerJoin(
      PurchaseOrders,
      eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .where(
      and(
        inArray(PurchaseLineReceivals.productUuid, productUuids),
        inArray(PurchaseLineReceivals.receiptStatus, [
          ...ARRIVED_RECEIPT_STATUSES,
        ]),
        sql`${PurchaseOrders.orderDate} IS NOT NULL`,
        sql`COALESCE(${PurchaseLineReceivals.deliveryDateActual}, ${PurchaseLineReceivals.receiptDate}) IS NOT NULL`,
      ),
    )
    .groupBy(PurchaseLineReceivals.productUuid);

  const leadTimeByProduct = new Map<string, LeadTimeHistory>();
  for (const row of leadTimeRows) {
    if (row.productUuid === null) {
      continue;
    }
    leadTimeByProduct.set(row.productUuid, {
      averageDays: Math.round(Number(row.averageDays ?? 0)),
      maximumDays: Math.round(Number(row.maximumDays ?? 0)),
    });
  }

  const weekday = new Date().getDay();

  return base.map((row) => {
    const weightPerPiece = Number(row.theoreticalWeight ?? 0);
    const weightPerM1 = Number(row.weightPerM1 ?? 0);
    const toPurchaseUnit = (kg: number) =>
      convertKgToUnit(kg, row.purchasingUnit, weightPerPiece, weightPerM1);
    const toStockUnit = (kg: number) =>
      convertKgToUnit(kg, row.stockUnit, weightPerPiece, weightPerM1);

    // The position as the warehouse counts it — the unit every "Stk." column on
    // this grid is headed by.
    const stock = stockByProduct.get(row.productUuid);
    const technicalStock = stock?.technicalQty ?? 0;
    const reserved = stock?.reservedQty ?? 0;
    const availableStock = technicalStock - reserved;
    const technicalKg = stock?.technicalKg ?? 0;
    const reservedKg = stock?.reservedKg ?? 0;
    const availableKg = technicalKg - reservedKg;

    const onOrder = onOrderByProduct.get(row.productUuid);
    const toBeReceivedShortTermKg = onOrder?.shortTermKg ?? 0;

    // A purchase order line is counted in the unit the product is bought by, so
    // its own count leads and the weight is only converted when the product is
    // bought in some other unit than it is stocked in.
    const boughtAsStocked =
      row.purchasingUnit !== null && row.stockUnit === row.purchasingUnit;
    const inPurchaseUnit = (count: number, kg: number) =>
      boughtAsStocked ? count : toPurchaseUnit(kg);

    const toBeReceivedShortTerm = inPurchaseUnit(
      onOrder?.shortTermQty ?? 0,
      toBeReceivedShortTermKg,
    );

    // "Techn. Stk. + To receive" is headed in stock units like the columns it
    // sits beside, so what is coming is converted the other way for it.
    const toReceiveInStockUnit = boughtAsStocked
      ? (onOrder?.shortTermQty ?? 0)
      : (toStockUnit(toBeReceivedShortTermKg) ?? 0);
    const technicalPlusToReceive = technicalStock + toReceiveInStockUnit;

    // The free position, in the unit the decision is made in: what is on the
    // shelf and unpromised, plus what is coming and unpromised.
    const availableInPurchaseUnit = inPurchaseUnit(availableStock, availableKg);
    const economicStock =
      availableInPurchaseUnit === null || toBeReceivedShortTerm === null
        ? null
        : availableInPurchaseUnit + toBeReceivedShortTerm;

    // Demand in the buying unit. An invoice line counted in the unit it was
    // sold by needs no conversion when that matches; otherwise the weight is
    // converted, which is the only route open for a product sold by the metre
    // and bought by the tonne.
    const consumption = consumptionByProduct.get(row.productUuid);
    const consumptionLastYear =
      row.purchasingUnit !== null && row.salesUnit === row.purchasingUnit
        ? (consumption?.lastYearQty ?? 0)
        : toPurchaseUnit(consumption?.lastYearKg ?? 0);
    const avgConsumptionPerDay =
      consumptionLastYear === null ? null : consumptionLastYear / 365;

    // The parameters, product first and its group behind it. Whoever's switch
    // enrolled the product owns its ordering days, because a weekday pattern is
    // a rota rather than a quantity and cannot sensibly be merged.
    const determinedByStockOp = Boolean(row.productUseStockOp);
    const reviewPeriodDays = firstSet(
      row.productReviewPeriod,
      row.groupReviewPeriod,
    );
    const configuredLeadTime = firstSet(
      row.productLeadTime,
      row.groupLeadTime,
      deliveryTimeInDays(
        row.supplierDeliveryTime,
        row.supplierDeliveryTimeUnit,
      ),
    );
    const leadTimeMethod = (row.productLeadTimeMethod ??
      row.groupLeadTimeMethod ??
      "manually") as LeadTimeMethod;
    const history = leadTimeByProduct.get(row.productUuid);
    // An automatic method measures what the supplier has actually done. With no
    // receipts to measure, it falls back to the figure that was typed in rather
    // than to nothing — a lead time of zero would advise buying only once the
    // shelf is already empty.
    const leadTimeDays =
      leadTimeMethod === "automatic_average"
        ? (history?.averageDays ?? 0) || configuredLeadTime
        : leadTimeMethod === "automatic_maximum"
          ? (history?.maximumDays ?? 0) || configuredLeadTime
          : configuredLeadTime;

    const protectionDays = leadTimeDays + reviewPeriodDays;
    const avgConsumptionDuringLR =
      avgConsumptionPerDay === null ? null : avgConsumptionPerDay * protectionDays;

    // Safety stock: the minimum the stock policy already holds this product to,
    // struck the same way Order advice strikes it — the monthly average rounded
    // to a whole purchase unit before either factor is applied.
    //
    // This is what keeps the order level above bare lead-time demand. Without
    // it the two would be the same number, and the grid would not show them in
    // two columns.
    const baseline =
      avgConsumptionPerDay === null
        ? null
        : Math.round(Math.round(((avgConsumptionPerDay * 365) / 12) * 10) / 10);
    const minStockMode = row.productMinStockMode ?? row.groupMinStockMode;
    const minMultiplier = firstSet(
      row.productMinStockMultiplier,
      row.groupMinStockMultiplier,
    );
    const minFixed = firstSet(
      row.productMinStockFixedValue,
      row.groupMinStockFixedValue,
    );
    const safetyStock =
      minStockMode === "fixed_value"
        ? minFixed
        : baseline === null
          ? 0
          : Math.max(minMultiplier * baseline, minFixed);

    const orderLevel =
      avgConsumptionDuringLR === null ? null : avgConsumptionDuringLR + safetyStock;
    const stockMinusOrderLevel =
      orderLevel === null || economicStock === null
        ? null
        : economicStock - orderLevel;

    // The supplier's own terms first, then the product's, then its group's.
    const orderSeries = firstSet(
      row.supplierOrderSeries,
      row.productStockOpOrderSeries,
      row.productOrderSeries,
      row.groupStockOpOrderSeries,
    );
    const minOrderQty = firstSet(
      row.supplierMoq,
      row.productMinOrderQty,
      row.groupMinOrderQty,
    );

    const toOrder =
      stockMinusOrderLevel === null
        ? null
        : stockMinusOrderLevel < 0
          ? roundToOrderQty(-stockMinusOrderLevel, orderSeries, minOrderQty)
          : 0;

    // One purchase unit is worth this many kilos, which is how both "(Kg. or
    // Psc.)" mirrors are struck. The conversion is linear, so inverting the one
    // above is enough.
    const unitsPerKg = toPurchaseUnit(1);
    const inStockUnit = (purchaseUnits: number | null) => {
      if (purchaseUnits === null) {
        return null;
      }
      if (boughtAsStocked) {
        return purchaseUnits;
      }
      if (unitsPerKg === null || unitsPerKg <= 0) {
        return null;
      }
      return toStockUnit(purchaseUnits / unitsPerKg);
    };

    const evaluateToday = isEvaluationDay(
      weekday,
      determinedByStockOp
        ? {
            monday: row.productOrderOnMonday,
            tuesday: row.productOrderOnTuesday,
            wednesday: row.productOrderOnWednesday,
            thursday: row.productOrderOnThursday,
            friday: row.productOrderOnFriday,
          }
        : {
            monday: row.groupOrderOnMonday,
            tuesday: row.groupOrderOnTuesday,
            wednesday: row.groupOrderOnWednesday,
            thursday: row.groupOrderOnThursday,
            friday: row.groupOrderOnFriday,
          },
    );

    const firstOrder = firstOrderByProduct.get(row.productUuid);

    return {
      productUuid: row.productUuid,
      productCode: row.productCode,
      productName: row.productName,
      mainGroup: row.mainGroup,
      productGroup: row.productGroup,
      stockUnit: row.stockUnit,
      purchaseUnit: row.purchasingUnit,
      supplierUuid: row.supplierUuid,
      supplierName: row.supplierName,

      technicalStock,
      reserved,
      availableStock,
      technicalPlusToReceive,

      toBeReceivedShortTerm,
      toBeReceivedLongTerm: 0,

      economicStock,
      orderLevel,
      orderLevelStockUnit: inStockUnit(orderLevel),
      toOrder,
      toOrderStockUnit: inStockUnit(toOrder),
      stockMinusOrderLevel,
      pctDifference:
        orderLevel !== null && orderLevel > 0 && stockMinusOrderLevel !== null
          ? (stockMinusOrderLevel / orderLevel) * 100
          : null,

      avgConsumptionPerDay,
      avgConsumptionDuringLR,
      // Days of cover on the free shelf: how long what is here lasts at the
      // rate it is going out. Struck on available stock rather than the
      // economic position, because a delivery that has not landed cannot be
      // sold out of.
      daysOfStock:
        avgConsumptionPerDay !== null &&
        avgConsumptionPerDay > 0 &&
        availableInPurchaseUnit !== null
          ? availableInPurchaseUnit / avgConsumptionPerDay
          : null,
      leadTimeDays,
      reviewPeriodDays,
      leadTimeMethod,
      determinedByStockOp,
      evaluateToday,
      orderNow: evaluateToday && toOrder !== null && toOrder > 0,

      firstPurchaseOrderUuid: firstOrder?.purchaseOrderUuid ?? null,
      firstPurchaseOrderId: firstOrder?.purchaseOrderId ?? null,
      firstReceiptDate: firstOrder?.expectedDate ?? null,
      workingDaysUntilFirstReceipt: workingDaysUntil(
        firstOrder?.expectedDate ?? null,
      ),

      pacClassification: row.pacClassification,
      orderAdviceCode: row.orderAdviceCode,
    };
  });
};

const filteredStockOnAdvice = async (
  query: TableQuery,
): Promise<{
  rows: StockOnAdviceRow[];
  all: StockOnAdviceRow[];
}> => {
  const all = await stockOnAdviceRows();
  const rows = sortRows(
    all.filter(
      (row) => matchesSearch(row, query.q) && matchesFilters(row, query.filters),
    ),
    query,
  );
  return { rows, all };
};

/**
 * The filter controls, offering the groups and suppliers that are actually on
 * the plan rather than every one in the catalogue — a filter listing a hundred
 * groups that select nothing is worse than no filter at all.
 */
const stockOnAdviceFilters = (rows: StockOnAdviceRow[]): TableFilterControl[] => {
  const mainGroups = [
    ...new Set(
      rows
        .map((row) => row.mainGroup)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((left, right) => left.localeCompare(right));

  const suppliers = new Map<string, string>();
  for (const row of rows) {
    if (row.supplierUuid) {
      suppliers.set(row.supplierUuid, row.supplierName ?? row.supplierUuid);
    }
  }

  return [
    {
      key: "orderNow",
      kind: "select",
      label: "Order now?",
      options: [
        { value: "true", label: "Order today" },
        { value: "false", label: "Nothing to order" },
      ],
    },
    {
      key: "evaluateToday",
      kind: "select",
      label: "Evaluate today?",
      options: [
        { value: "true", label: "Reviewed today" },
        { value: "false", label: "Not reviewed today" },
      ],
    },
    {
      key: "mainGroup",
      kind: "select",
      label: "Main group",
      options: mainGroups.map((name) => ({ value: name, label: name })),
    },
    {
      key: "supplier",
      kind: "select",
      label: "Preferred supplier",
      options: [...suppliers.entries()].map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      key: "leadTimeMethod",
      kind: "select",
      label: "Lead time method",
      options: leadTimeMethods.map((method) => ({
        value: method,
        label: LEAD_TIME_METHOD_LABELS[method],
      })),
    },
    {
      key: "determinedByStockOp",
      kind: "select",
      label: "Determined by",
      options: [
        { value: "true", label: "The product itself" },
        { value: "false", label: "Its product group" },
      ],
    },
  ];
};

export const getStockOnAdvice = async (
  query: TableQuery,
): Promise<StockOnAdvicePage> => {
  try {
    const { rows, all } = await filteredStockOnAdvice(query);
    const offset = (query.page - 1) * query.pageSize;

    return {
      rows: rows.slice(offset, offset + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
      enrolled: all.length,
      filters: stockOnAdviceFilters(all),
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch StockOn advice"));
  }
};

export const exportStockOnAdvice = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows<StockOnAdviceRow, StockOnAdviceColumnKey>({
    name: "StockOn advice",
    columns: STOCKON_ADVICE_COLUMNS,
    columnKeys,
    rows: async (limit, offset) => {
      const { rows } = await filteredStockOnAdvice(parseTableQuery(params));
      return rows.slice(offset, offset + limit);
    },
  });

/**
 * Turns one line of advice into a purchase order the buyer can finish.
 *
 * The reference system offers this from the grid itself, and without it the
 * screen only ever describes a decision somebody then has to retype. The order
 * is created provisional — a draft, not a commitment: nothing is sent to the
 * supplier, and the advice keeps counting the product as unordered until a
 * buyer opens the order, prices it and releases it.
 */
export const createPurchaseOrderFromAdvice = async (
  productUuid: string,
): Promise<StockOnAdviceActionResult> => {
  const orderUuid = generateUuid();
  try {
    const rows = await stockOnAdviceRows();
    const advice = rows.find((row) => row.productUuid === productUuid);

    if (!advice) {
      return { error: "This product is no longer on the StockOn plan." };
    }
    if (advice.toOrder === null || advice.toOrder <= 0) {
      return { error: "This product has nothing to order." };
    }
    if (!advice.supplierUuid) {
      return {
        error:
          "This product has no preferred supplier, so there is nobody to order it from. Set one on the product group's Suppliers tab first.",
      };
    }

    const [product] = await db
      .select({
        uuid: Products.uuid,
        weightTheoretical: Products.weightTheoretical,
        theoreticalWeight: Products.theoreticalWeight,
        purchasingUnit: Products.purchasingUnit,
        unitPrice: Products.unitPrice,
      })
      .from(Products)
      .where(eq(Products.uuid, productUuid));

    if (!product) {
      return { error: "This product could not be found." };
    }

    const quantity = advice.toOrder;
    const pieceWeight = productPieceWeightKg(product) ?? 0;
    const weightKg = pieceWeight * quantity;

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseOrders).values({
        uuid: orderUuid,
        supplierUuid: advice.supplierUuid ?? "",
        status: "provisional",
        orderDate: todayDateString(),
        amount: moneyString(0),
        weightKg: weightKg.toFixed(3),
      });

      await tx.insert(PurchaseOrderItems).values({
        uuid: generateUuid(),
        purchaseOrderUuid: orderUuid,
        productUuid,
        lineNumber: 1,
        status: "provisional",
        quantity: quantity.toFixed(3),
        qtyPlanned: quantity.toFixed(3),
        kgPurchased: weightKg.toFixed(2),
        netPrice: (0).toFixed(4),
        priceUnit: product.unitPrice ?? null,
        // No price is agreed yet, so the line is worth nothing until a buyer
        // fills one in — computed through the same helper the rest of the
        // purchase chain uses so it stays right when it is.
        amount: moneyString(
          amountForWeight(0, product.unitPrice ?? null, weightKg, { quantity }),
        ),
      });
    });

    revalidatePath("/purchase-orders");
    revalidatePath("/stockon-advice");
  } catch (error) {
    return {
      error: describeError(
        error,
        "Failed to raise a purchase order from this advice",
      ),
    };
  }

  redirect(`/purchase-orders/${orderUuid}/edit`);
};
