"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

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
  /** Null when the product records no factor to convert kilos by. */
  avgMonthlyConsumption: number | null;
  revenue: number;
  sales: number;
  stock: number;
  available: number;
};

// Sold products that are NOT in the reorder scheme — invoiced within the
// period but whose group isn't making order advices, or which aren't stock
// products (either reason keeps them off "Order advice"). Highlights demand
// that no reorder logic is currently watching.
export const getSoldProductsNotAdvised = async (): Promise<
  SoldProductNotAdvisedRow[]
> => {
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
        productName: Products.name,
        stockUnit: Products.stockUnit,
        theoreticalWeight: Products.theoreticalWeight,
        weightPerM1: Products.weightPerM1,
        stockProduct: Products.stockProduct,
        standardProduct: Products.standardProduct,
        // The reference system reads the hierarchy from the root down, not
        // from the product up: a product hung straight off "Aluminum" shows
        // that as its Main group and leaves Product group empty, rather than
        // showing it as a product group with no main group above it.
        productGroup: sql<
          string | null
        >`CASE WHEN ${ProductGroups.parentUuid} IS NULL THEN NULL ELSE ${ProductGroups.name} END`,
        mainGroup: sql<
          string | null
        >`COALESCE(${Root.name}, ${Grandparent.name}, ${Parent.name}, ${ProductGroups.name})`,
        pacClassification: ProductGroups.pacClassification,
        sales: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
        // The invoice line's own snapshot — see revenue-per-revenue-group.
        revenue: sql<string>`COALESCE(SUM(${InvoiceItems.amount}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .leftJoin(Parent, eq(ProductGroups.parentUuid, Parent.uuid))
      .leftJoin(Grandparent, eq(Parent.parentUuid, Grandparent.uuid))
      .leftJoin(Root, eq(Grandparent.parentUuid, Root.uuid))
      .where(
        // Not on the order recommendation: the exact complement of what
        // Order advice includes, read off the product rather than its group —
        // the two screens share groups but never share a product, and 83
        // products sit on this screen while a sibling in the same group sits
        // on the other one.
        sql`NOT (COALESCE(${Products.makingOrderAdvices}, 0) = 1 AND COALESCE(${Products.stockProduct}, 0) = 1)`,
      )
      .groupBy(
        Products.uuid,
        Products.productCode,
        Products.name,
        Products.stockUnit,
        Products.theoreticalWeight,
        Products.weightPerM1,
        Products.stockProduct,
        Products.standardProduct,
        ProductGroups.name,
        ProductGroups.parentUuid,
        Parent.name,
        Grandparent.name,
        Root.name,
        ProductGroups.pacClassification,
      )
      .orderBy(
        sql`COALESCE(${Root.name}, ${Grandparent.name}, ${Parent.name}, ${ProductGroups.name})`,
        Products.productCode,
      );

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

    // Average monthly demand over the trailing 12 months, weighed. The
    // reference system's own heading says "(Stk.U.)", so this is restated in
    // the product's stock unit below rather than reported in kilos.
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
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch sold products not on the order recommendation",
      ),
    );
  }
};
