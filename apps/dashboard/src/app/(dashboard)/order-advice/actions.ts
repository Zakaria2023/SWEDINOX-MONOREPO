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

/**
 * One line of the order advice, column for column as the reference system lists
 * it — the names here are its own column headings, taken from their tooltips
 * where the heading itself is truncated on screen.
 *
 * The units are mixed deliberately and it matters which is which. The position
 * and the demand are kilos, because that is what the shop weighs and what a
 * coverage figure has to be struck in. The advice and the order are in the unit
 * the product is bought by, because that is what goes on a purchase order.
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
  /** "Reserved" */
  reservedKg: number;
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
// The advice is struck in kilos and only then restated in the purchase unit, so
// the two Pur.U. columns are the same recommendation the weight column shows,
// converted for the supplier rather than computed separately.
export const getOrderAdvice = async (): Promise<OrderAdviceRow[]> => {
  try {
    const base = await db
      .select({
        productUuid: Products.uuid,
        productCode: Products.productCode,
        description: Products.name,
        stockProduct: Products.stockProduct,
        purchasingUnit: Products.purchasingUnit,
        theoreticalWeight: Products.theoreticalWeight,
        weightPerM1: Products.weightPerM1,
        productOrderSeries: Products.orderSeries,
        productMinOrderQty: Products.minOrderQty,
        mainGroup: ProductGroups.name,
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
      .where(eq(Products.stockProduct, true))
      .orderBy(Products.productCode);

    if (base.length === 0) {
      return [];
    }

    const productUuids = base.map((row) => row.productUuid);

    // On-hand stock, weighed. "pending" lots are the on-hand state in this
    // schema (a lot flips to "received" only once it is fully depleted). Own
    // stock only — no consignment — and not blocked.
    //
    // Summed on the weighed column rather than the counted one: the shop's
    // position, and every coverage figure struck from it, is in kilos.
    const stockRows = await db
      .select({
        productUuid: Stock.productUuid,
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
      onOrderRows.map((row) => [row.productUuid, Number(row.toBeReceivedKg)]),
    );

    // Demand, in kilos, over the three windows the grid shows side by side:
    // the trailing year it averages, the month just gone, and the trailing
    // three years that smooth a seasonal product out.
    const consumptionRows = await db
      .select({
        productUuid: InvoiceItems.productUuid,
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
          lastYearKg: Number(row.lastYearKg),
          previousMonthKg: Number(row.previousMonthKg),
          last3YearsKg: Number(row.last3YearsKg),
        },
      ]),
    );

    return base.map((row) => {
      const stock = stockByProduct.get(row.productUuid);
      const technicalKg = stock?.technicalKg ?? 0;
      const reservedKg = stock?.reservedKg ?? 0;
      const availableKg = technicalKg - reservedKg;
      const toBeReceivedShortTermKg =
        onOrderByProduct.get(row.productUuid) ?? 0;
      const economicStockKg = availableKg + toBeReceivedShortTermKg;

      const consumption = consumptionByProduct.get(row.productUuid);
      const avgMonthlyConsumptionLastYearKg =
        (consumption?.lastYearKg ?? 0) / 12;
      const consumptionPreviousMonthKg = consumption?.previousMonthKg ?? 0;
      const avgMonthlyConsumptionLast3YearsKg =
        (consumption?.last3YearsKg ?? 0) / 36;

      // The policy is a multiple of the monthly average — "1 times the avg.
      // monthly consumption" for the minimum, "3 times" for the maximum, which
      // is what a product's stock policy reads on the reference system.
      const minMultiplier = Number(row.minStockMultiplier ?? 0);
      const minFixed = Number(row.minStockFixedValue ?? 0);
      const minStockKg =
        row.minStockMode === "fixed_value"
          ? minFixed
          : Math.max(minMultiplier * avgMonthlyConsumptionLastYearKg, minFixed);

      const maxMultiplier = Number(row.maxStockMultiplier ?? 0);
      const maxFixed = Number(row.maxStockFixedValue ?? 0);
      const maxByMultiplier = maxMultiplier * avgMonthlyConsumptionLastYearKg;
      const maxStockKg =
        row.maxStockMode === "fixed_value"
          ? maxFixed
          : maxFixed > 0
            ? Math.min(maxByMultiplier, maxFixed)
            : maxByMultiplier;

      // Nothing is advised until the position has actually fallen through the
      // minimum. Topping every product up to its maximum the moment it dips
      // would put the whole catalogue on a purchase order every week.
      const adviceWeightRounded = roundAdviceWeight(
        economicStockKg < minStockKg
          ? Math.max(0, maxStockKg - economicStockKg)
          : 0,
      );

      const weightPerPiece = Number(row.theoreticalWeight ?? 0);
      const weightPerM1 = Number(row.weightPerM1 ?? 0);
      const adviceQtyPurchaseUnit = convertKgToUnit(
        adviceWeightRounded,
        row.purchasingUnit,
        weightPerPiece,
        weightPerM1,
      );

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
        stockPurchaseUnit: convertKgToUnit(
          technicalKg,
          row.purchasingUnit,
          weightPerPiece,
          weightPerM1,
        ),
        reservedKg,
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
        economicCoverage:
          avgMonthlyConsumptionLastYearKg > 0
            ? economicStockKg / avgMonthlyConsumptionLastYearKg
            : null,
        technicalCoverage:
          avgMonthlyConsumptionLastYearKg > 0
            ? technicalKg / avgMonthlyConsumptionLastYearKg
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
