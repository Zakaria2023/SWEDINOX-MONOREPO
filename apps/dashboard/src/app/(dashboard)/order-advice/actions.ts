"use server";
import { describeError } from "@/lib/helpers";

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
import { and, eq, inArray, isNull, like, sql } from "drizzle-orm";

export type OrderAdviceFilter = {
  productCode?: string;
  onlyAdvised?: boolean;
};

export type OrderAdviceRow = {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
  stockUnit: SelectProducts["stockUnit"];
  stockProduct: SelectProducts["stockProduct"];
  mainGroup: SelectProductGroups["name"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  // Physical / economic position (all in the product's stock unit)
  technicalStock: number;
  reserved: number;
  available: number;
  toBeReceived: number;
  economicStock: number;
  // Demand
  avgMonthlyConsumption: number;
  consumptionPreviousYear: number;
  // Coverage in months (null when there is no consumption to divide by)
  economicCoverage: number | null;
  technicalCoverage: number | null;
  // Policy levels + resulting advice
  minStockLevel: number;
  maxStockLevel: number;
  adviceQty: number;
  orderQty: number;
};

// Rounds an advised quantity up to the supplier's order series, never below the
// minimum order quantity — the same rounding the ERP applies to "Order Qty".
const roundToOrderQty = (
  advice: number,
  orderSeries: number,
  minOrderQty: number,
): number => {
  if (advice <= 0) {
    return 0;
  }
  const target = Math.max(advice, minOrderQty);
  if (orderSeries > 0) {
    return Math.ceil(target / orderSeries) * orderSeries;
  }
  return target;
};

// Order advice: for every stock product, compare its economic stock (on-hand
// minus reservations plus what is still on order) against the min/max stock
// policy carried by its product group, and advise a purchase quantity to bring
// it back up to the maximum level. Demand comes from invoiced sales history.
export const getOrderAdvice = async (
  filter: OrderAdviceFilter = {},
): Promise<OrderAdviceRow[]> => {
  try {
    const base = await db
      .select({
        productUuid: Products.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        stockUnit: Products.stockUnit,
        stockProduct: Products.stockProduct,
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
      .where(
        and(
          eq(Products.stockProduct, true),
          filter.productCode
            ? like(Products.productCode, `${filter.productCode}%`)
            : undefined,
        ),
      )
      .orderBy(Products.productCode);

    if (base.length === 0) {
      return [];
    }

    const productUuids = base.map((row) => row.productUuid);

    // On-hand stock: "pending" lots are the active/on-hand state in this schema
    // (a lot flips to "received" only once it is fully depleted). Own stock
    // only (no consignment) and not blocked.
    const stockRows = await db
      .select({
        productUuid: Stock.productUuid,
        technical: sql<string>`COALESCE(SUM(${Stock.quantity}), 0)`,
        reserved: sql<string>`COALESCE(SUM(${Stock.reservedQuantity}), 0)`,
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
        { technical: Number(row.technical), reserved: Number(row.reserved) },
      ]),
    );

    // Still on order: open purchase-order lines not yet fully received.
    const onOrderRows = await db
      .select({
        productUuid: PurchaseOrderItems.productUuid,
        toBeReceived: sql<string>`COALESCE(SUM(GREATEST(${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived}, 0)), 0)`,
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
      onOrderRows.map((row) => [row.productUuid, Number(row.toBeReceived)]),
    );

    // Demand: invoiced quantity over the trailing 12 months (→ monthly average)
    // and over the previous calendar year.
    const consumptionRows = await db
      .select({
        productUuid: InvoiceItems.productUuid,
        last12Months: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.quantity} ELSE 0 END), 0)`,
        previousYear: sql<string>`COALESCE(SUM(CASE WHEN YEAR(${Invoices.invoiceDate}) = YEAR(CURDATE()) - 1 THEN ${InvoiceItems.quantity} ELSE 0 END), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .where(inArray(InvoiceItems.productUuid, productUuids))
      .groupBy(InvoiceItems.productUuid);

    const consumptionByProduct = new Map(
      consumptionRows.map((row) => [
        row.productUuid,
        {
          last12Months: Number(row.last12Months),
          previousYear: Number(row.previousYear),
        },
      ]),
    );

    const rows: OrderAdviceRow[] = base.map((row) => {
      const stock = stockByProduct.get(row.productUuid);
      const technicalStock = stock?.technical ?? 0;
      const reserved = stock?.reserved ?? 0;
      const available = technicalStock - reserved;
      const toBeReceived = onOrderByProduct.get(row.productUuid) ?? 0;
      const economicStock = available + toBeReceived;

      const consumption = consumptionByProduct.get(row.productUuid);
      const avgMonthlyConsumption = (consumption?.last12Months ?? 0) / 12;
      const consumptionPreviousYear = consumption?.previousYear ?? 0;

      const minMultiplier = Number(row.minStockMultiplier ?? 0);
      const minFixed = Number(row.minStockFixedValue ?? 0);
      const minStockLevel =
        row.minStockMode === "fixed_value"
          ? minFixed
          : Math.max(minMultiplier * avgMonthlyConsumption, minFixed);

      const maxMultiplier = Number(row.maxStockMultiplier ?? 0);
      const maxFixed = Number(row.maxStockFixedValue ?? 0);
      const maxByMultiplier = maxMultiplier * avgMonthlyConsumption;
      const maxStockLevel =
        row.maxStockMode === "fixed_value"
          ? maxFixed
          : maxFixed > 0
            ? Math.min(maxByMultiplier, maxFixed)
            : maxByMultiplier;

      const adviceQty =
        economicStock < minStockLevel
          ? Math.max(0, maxStockLevel - economicStock)
          : 0;

      // Prefer the preferred supplier's terms, then the group's StockOp
      // settings, then the product's own defaults.
      const orderSeries =
        Number(row.supplierOrderSeries ?? 0) ||
        Number(row.groupOrderSeries ?? 0) ||
        Number(row.productOrderSeries ?? 0);
      const minOrderQty =
        Number(row.supplierMoq ?? 0) ||
        Number(row.groupMinOrderQty ?? 0) ||
        Number(row.productMinOrderQty ?? 0);
      const orderQty = roundToOrderQty(adviceQty, orderSeries, minOrderQty);

      return {
        productUuid: row.productUuid,
        productCode: row.productCode,
        productName: row.productName,
        stockUnit: row.stockUnit,
        stockProduct: row.stockProduct,
        mainGroup: row.mainGroup,
        supplierName: row.supplierName,
        technicalStock,
        reserved,
        available,
        toBeReceived,
        economicStock,
        avgMonthlyConsumption,
        consumptionPreviousYear,
        economicCoverage:
          avgMonthlyConsumption > 0
            ? economicStock / avgMonthlyConsumption
            : null,
        technicalCoverage:
          avgMonthlyConsumption > 0
            ? technicalStock / avgMonthlyConsumption
            : null,
        minStockLevel,
        maxStockLevel,
        adviceQty,
        orderQty,
      };
    });

    return filter.onlyAdvised ? rows.filter((row) => row.orderQty > 0) : rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch order advice"));
  }
};
