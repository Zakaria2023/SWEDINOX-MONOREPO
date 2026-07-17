"use server";

import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { and, eq, inArray, isNull, like, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export type SoldProductsNotAdvisedFilter = {
  productCode?: string;
  from?: string;
  to?: string;
};

export type SoldProductNotAdvisedRow = {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
  stockUnit: SelectProducts["stockUnit"];
  stockProduct: SelectProducts["stockProduct"];
  standardProduct: SelectProducts["standardProduct"];
  mainGroup: SelectProductGroups["name"] | null;
  productGroup: SelectProductGroups["name"] | null;
  pacClassification: SelectProductGroups["pacClassification"] | null;
  avgMonthlyConsumption: number;
  revenue: number;
  sales: number;
  stock: number;
  available: number;
};

// Sold products that are NOT in the reorder scheme — invoiced within the
// period but whose group isn't making order advices, or which aren't stock
// products (either reason keeps them off "Order advice"). Highlights demand
// that no reorder logic is currently watching.
export const getSoldProductsNotAdvised = async (
  filter: SoldProductsNotAdvisedFilter = {},
): Promise<SoldProductNotAdvisedRow[]> => {
  try {
    const MainGroups = alias(ProductGroups, "main_groups");

    const base = await db
      .select({
        productUuid: Products.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        stockUnit: Products.stockUnit,
        stockProduct: Products.stockProduct,
        standardProduct: Products.standardProduct,
        productGroup: ProductGroups.name,
        mainGroup: MainGroups.name,
        pacClassification: ProductGroups.pacClassification,
        sales: sql<string>`COALESCE(SUM(${InvoiceItems.quantity}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
      .leftJoin(MainGroups, eq(ProductGroups.parentUuid, MainGroups.uuid))
      .where(
        and(
          // Not on the order recommendation: group not making advices OR not a
          // stock product (null group counts as not-advised too).
          sql`NOT (COALESCE(${ProductGroups.makingOrderAdvices}, 0) = 1 AND COALESCE(${Products.stockProduct}, 0) = 1)`,
          filter.productCode
            ? like(Products.productCode, `${filter.productCode}%`)
            : undefined,
          filter.from
            ? sql`${Invoices.invoiceDate} >= ${filter.from}`
            : undefined,
          filter.to ? sql`${Invoices.invoiceDate} <= ${filter.to}` : undefined,
        ),
      )
      .groupBy(
        Products.uuid,
        Products.productCode,
        Products.name,
        Products.stockUnit,
        Products.stockProduct,
        Products.standardProduct,
        ProductGroups.name,
        MainGroups.name,
        ProductGroups.pacClassification,
      )
      .orderBy(Products.productCode);

    if (base.length === 0) {
      return [];
    }

    const productUuids = base.map((row) => row.productUuid);

    // On-hand position (active "pending" lots, own & unblocked).
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

    // Average monthly demand over the trailing 12 months.
    const consumptionRows = await db
      .select({
        productUuid: InvoiceItems.productUuid,
        last12Months: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.quantity} ELSE 0 END), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .where(inArray(InvoiceItems.productUuid, productUuids))
      .groupBy(InvoiceItems.productUuid);

    const consumptionByProduct = new Map(
      consumptionRows.map((row) => [row.productUuid, Number(row.last12Months)]),
    );

    return base.map((row) => {
      const stock = stockByProduct.get(row.productUuid);
      const technical = stock?.technical ?? 0;
      const reserved = stock?.reserved ?? 0;
      return {
        productUuid: row.productUuid,
        productCode: row.productCode,
        productName: row.productName,
        stockUnit: row.stockUnit,
        stockProduct: row.stockProduct,
        standardProduct: row.standardProduct,
        mainGroup: row.mainGroup,
        productGroup: row.productGroup,
        pacClassification: row.pacClassification,
        avgMonthlyConsumption:
          (consumptionByProduct.get(row.productUuid) ?? 0) / 12,
        revenue: Number(row.revenue),
        sales: Number(row.sales),
        stock: technical,
        available: technical - reserved,
      };
    });
  } catch {
    throw new Error("Failed to fetch sold products not on the order recommendation");
  }
};
