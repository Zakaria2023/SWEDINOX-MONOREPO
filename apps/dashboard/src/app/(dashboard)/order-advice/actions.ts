"use server";

import {
  convertKgToUnit,
  describeError,
  roundAdviceWeight,
  roundToOrderQty,
} from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { ProductGroupSuppliers } from "@/db/schema/product-group-suppliers";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

/**
 * One line of the order advice, column for column as the reference system lists
 * it — the names here are its own column headings, taken from their tooltips
 * where the heading itself is truncated on screen.
 *
 * The units are mixed deliberately and it matters which is which. The demand
 * and the free position are kilos, because that is what the shop weighs and
 * what a coverage figure has to be struck in. Stock, reserved, the advice and
 * the order are in the unit the product is bought by, because that is what a
 * buyer counts in and what goes on a purchase order.
 */
export type OrderAdviceRow = {
  productUuid: SelectProducts["uuid"];
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
  /** The unit the two figures above are counted in, for the column heading. */
  purchaseUnit: SelectProducts["purchasingUnit"];
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
export const getOrderAdvice = async (): Promise<OrderAdviceRow[]> => {
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
        productMinOrderQty: Products.minOrderQty,
        // The root of the hierarchy, not the product's own group. A product
        // sitting directly under "Aluminum" shows "Aluminum" here; one under
        // "Aluminium coils A5754" shows "Aluminum" too, because that is the
        // group's parent. Proved on the reference system's own Sold products
        // screen, which shows both levels side by side.
        mainGroup: sql<
          string | null
        >`COALESCE(${Root.name}, ${Grandparent.name}, ${Parent.name}, ${ProductGroups.name})`,
        minStockMode: ProductGroups.minStockMode,
        minStockMultiplier: ProductGroups.minStockMultiplier,
        minStockFixedValue: ProductGroups.minStockFixedValue,
        maxStockMode: ProductGroups.maxStockMode,
        maxStockMultiplier: ProductGroups.maxStockMultiplier,
        maxStockFixedValue: ProductGroups.maxStockFixedValue,
        groupOrderSeries: ProductGroups.stockOpOrderSeries,
        groupMinOrderQty: ProductGroups.minOrderQty,
        supplierOrderSeries: ProductGroupSuppliers.orderSeries,
        supplierMoq: ProductGroupSuppliers.moq,
        supplierName: Companies.companyName,
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
      // Two products in one group can disagree about whether they are
      // advised on: the reference system's own screens show `CAA1050020`
      // excluded while `CAA1050030` beside it, in the same group and equally a
      // stock product, is included — 83 such pairs across the two exports. So
      // "making order advices" is a property of the product, not of its group,
      // and the group's copy of the flag is only a default for the form.
      .where(
        and(
          eq(Products.stockProduct, true),
          eq(Products.makingOrderAdvices, true),
        ),
      )
      .orderBy(Products.productCode);

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
          inArray(PurchaseOrders.status, ["open", "confirmed", "pre_notified"]),
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

    // Demand, in kilos, over the three windows the grid shows side by side:
    // the trailing year it averages, the month just gone, and the trailing
    // three years that smooth a seasonal product out.
    const consumptionRows = await db
      .select({
        productUuid: InvoiceItems.productUuid,
        lastYearQty: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.quantity} ELSE 0 END), 0)`,
        lastYearKg: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.weightKg} ELSE 0 END), 0)`,
        previousMonthKg: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01') AND ${Invoices.invoiceDate} < DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN ${InvoiceItems.weightKg} ELSE 0 END), 0)`,
        last3YearsKg: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 36 MONTH) THEN ${InvoiceItems.weightKg} ELSE 0 END), 0)`,
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
          previousMonthKg: Number(row.previousMonthKg),
          last3YearsKg: Number(row.last3YearsKg),
        },
      ]),
    );

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
      const consumptionLastYearPurchaseUnit =
        row.purchasingUnit !== null && row.salesUnit === row.purchasingUnit
          ? (consumption?.lastYearQty ?? 0)
          : toPurchaseUnit(consumption?.lastYearKg ?? 0);
      // Rounded to one decimal, which is not cosmetic: the reference system
      // divides by the figure it prints, not by the exact quotient. A product
      // with eleven units sold shows an average of 0,9 and a coverage of
      // 543,3 against an economic stock of 489 — and 489 / 0,9 is 543,3, where
      // 489 / (11/12) would be 533,5.
      const avgMonthlyConsumptionLastYear =
        consumptionLastYearPurchaseUnit === null
          ? null
          : Math.round((consumptionLastYearPurchaseUnit / 12) * 10) / 10;

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
        adviceQtyPurchaseUnit === null || unitsPerKg === null || unitsPerKg <= 0
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
        // Struck against the trailing year's average, which is the figure the
        // policy itself is built on.
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
            : roundToOrderQty(adviceQtyPurchaseUnit, orderSeries, minOrderQty),
        purchaseUnit: row.purchasingUnit,
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch order advice"));
  }
};
