"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import {
  ProductGroupSuppliers,
  SelectProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import { describeError, todayDateString } from "@/lib/helpers";
import { aliasedTable, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProductPriceRow = SelectProducts & {
  mainGroup: SelectProductGroups["name"] | null;
  subGroup: SelectProductGroups["name"] | null;
  preferredSupplier: SelectCompanies["companyName"] | null;
  supplierProductCode:
    | SelectProductGroupSuppliers["externalProductCode"]
    | null;
};

export type RecalculatePricesResult = {
  error?: string;
  success?: boolean;
  updated?: number;
};

// A product group is at most two levels deep here: a group with no parent is
// itself the main group, otherwise its parent is the main group and the group
// is the subgroup.
const ParentGroups = aliasedTable(ProductGroups, "parent_groups");

// The preferred supplier of the product's group, and that supplier's own code
// for the article. Scalar subqueries rather than joins, so a group with several
// suppliers can't multiply the product rows.
const preferredSupplierName = sql<
  string | null
>`(SELECT ${Companies.companyName} FROM ${ProductGroupSuppliers} INNER JOIN ${Companies} ON ${Companies.uuid} = ${ProductGroupSuppliers.supplierCompanyUuid} WHERE ${ProductGroupSuppliers.productGroupUuid} = ${Products.productGroupUuid} AND ${ProductGroupSuppliers.preferred} = TRUE LIMIT 1)`;

const supplierProductCode = sql<
  string | null
>`(SELECT ${ProductGroupSuppliers.externalProductCode} FROM ${ProductGroupSuppliers} WHERE ${ProductGroupSuppliers.productGroupUuid} = ${Products.productGroupUuid} AND ${ProductGroupSuppliers.preferred} = TRUE LIMIT 1)`;

// Every product with the prices it is bought and sold at.
export const getProductPrices = async (): Promise<ProductPriceRow[]> => {
  try {
    const rows = await db
      .select({
        product: Products,
        groupName: ProductGroups.name,
        groupParentUuid: ProductGroups.parentUuid,
        parentName: ParentGroups.name,
        preferredSupplier: preferredSupplierName,
        supplierProductCode,
      })
      .from(Products)
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .leftJoin(ParentGroups, eq(ProductGroups.parentUuid, ParentGroups.uuid))
      .orderBy(asc(Products.productCode));

    return rows.map((row) => ({
      ...row.product,
      mainGroup: row.groupParentUuid ? row.parentName : row.groupName,
      subGroup: row.groupParentUuid ? row.groupName : null,
      preferredSupplier: row.preferredSupplier,
      supplierProductCode: row.supplierProductCode,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch product prices"));
  }
};

// Recomputes the sales price chain for every product:
//
//   APP            = weighted average of what was actually paid per unit, taken
//                    from the goods received against purchase orders
//   Replacement    = kept as maintained, or seeded from the APP when it is
//                    still zero, so a freshly-bought product has a cost basis
//   Base price     = the fixed sales price when one is set, otherwise the
//                    replacement price plus the markup percentage
//
// Products with no markup of their own take `defaultMarkupPercent`, so a whole
// catalogue can be priced in one pass.
export const recalculateProductPrices = async (
  defaultMarkupPercent: number,
): Promise<RecalculatePricesResult> => {
  if (!Number.isFinite(defaultMarkupPercent) || defaultMarkupPercent < 0) {
    return { error: "Enter a markup percentage of 0 or more." };
  }

  try {
    const products = await db
      .select({
        uuid: Products.uuid,
        replacementPrice: Products.replacementPrice,
        markup: Products.markup,
        fixedSalesPrice: Products.fixedSalesPrice,
      })
      .from(Products);

    if (products.length === 0) {
      return { error: "No products yet. Create one first." };
    }

    // Weighted average purchase price per product, from the received goods.
    const received = await db
      .select({
        productUuid: PurchaseLineReceivals.productUuid,
        value: sql<string>`SUM(${PurchaseLineReceivals.receivedQty} * ${PurchaseLineReceivals.invoicedPrice})`,
        quantity: sql<string>`SUM(${PurchaseLineReceivals.receivedQty})`,
      })
      .from(PurchaseLineReceivals)
      .groupBy(PurchaseLineReceivals.productUuid);

    const appByProduct = new Map<string, number>();
    for (const row of received) {
      if (!row.productUuid) {
        continue;
      }
      const quantity = Number(row.quantity ?? 0);
      if (quantity <= 0) {
        continue;
      }
      appByProduct.set(row.productUuid, Number(row.value ?? 0) / quantity);
    }

    const priceDate = todayDateString();
    let updated = 0;

    for (const product of products) {
      const app = appByProduct.get(product.uuid) ?? 0;
      const currentReplacement = Number(product.replacementPrice ?? 0);
      const replacementPrice =
        currentReplacement > 0 ? currentReplacement : app;
      const markup =
        Number(product.markup ?? 0) > 0
          ? Number(product.markup)
          : defaultMarkupPercent;
      const fixedSalesPrice = Number(product.fixedSalesPrice ?? 0);
      const basePrice =
        fixedSalesPrice > 0
          ? fixedSalesPrice
          : replacementPrice * (1 + markup / 100);

      await db
        .update(Products)
        .set({
          averagePurchasePrice: app.toFixed(2),
          replacementPrice: replacementPrice.toFixed(2),
          markup: markup.toFixed(2),
          basePrice: basePrice.toFixed(2),
          priceDate,
        })
        .where(eq(Products.uuid, product.uuid));
      updated += 1;
    }

    revalidatePath("/product-prices");
    revalidatePath("/products");
    return { success: true, updated };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to recalculate product prices",
    };
  }
};
