"use server";

import { db } from "@/db";
import { InsertProducts, Products, SelectProducts } from "@/db/schema/products";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { describeError, generateUuid } from "@/lib/helpers";
import { asc, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProductFields = Omit<
  InsertProducts,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ProductActionResult = {
  productUuid?: string;
  error?: string;
  success?: boolean;
};

export type ProductListItem = SelectProducts & {
  productGroupName: SelectProductGroups["name"] | null;
};

export type ProductOption = Pick<
  SelectProducts,
  "uuid" | "productCode" | "name" | "productGroupUuid"
>;

// Carries the product's pricing and weight alongside its identity, so a line
// editor can show what a line is worth before it is saved. The prices are still
// re-resolved on the server when the document is written — these are for the
// on-screen preview only, which is why plain pickers keep using ProductOption.
export type ProductPricingOption = ProductOption &
  Pick<
    SelectProducts,
    | "basePrice"
    | "replacementPrice"
    | "averagePurchasePrice"
    | "theoreticalWeight"
    | "priceUnit"
    | "stockUnit"
    | "length"
  > & {
    productGroupName: SelectProductGroups["name"] | null;
    minProfitMarginStock: SelectProductGroups["minProfitMarginStock"] | null;
    minProfitMarginExWorks: SelectProductGroups["minProfitMarginExWorks"] | null;
    qualityStandard: SelectProductGroups["standardsQuality"] | null;
  };

export const getProducts = async (): Promise<ProductListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Products),
        productGroupName: ProductGroups.name,
      })
      .from(Products)
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .orderBy(desc(Products.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch products"));
  }
};

/**
 * General catalog products only (companyUuid is null) — used as the
 * "assortment" a company-specific product is created from, so a company's
 * own product copies don't show up as pickable templates themselves.
 */
export const getProductsForSelect = async (): Promise<ProductOption[]> =>
  db
    .select({
      uuid: Products.uuid,
      productCode: Products.productCode,
      name: Products.name,
      productGroupUuid: Products.productGroupUuid,
    })
    .from(Products)
    .where(isNull(Products.companyUuid))
    .orderBy(asc(Products.productCode));

export const getProductsForCompany = async (
  companyUuid: string,
): Promise<ProductOption[]> =>
  db
    .select({
      uuid: Products.uuid,
      productCode: Products.productCode,
      name: Products.name,
      productGroupUuid: Products.productGroupUuid,
    })
    .from(Products)
    .where(eq(Products.companyUuid, companyUuid))
    .orderBy(asc(Products.productCode));

// The catalogue as a quote/order line editor needs it: identity plus the prices
// and weights that let the grid total a line the moment it is added, and the
// product group's margin floor so a thin line can be flagged on the spot.
export const getProductsForPricing = async (): Promise<ProductPricingOption[]> =>
  db
    .select({
      uuid: Products.uuid,
      productCode: Products.productCode,
      name: Products.name,
      productGroupUuid: Products.productGroupUuid,
      basePrice: Products.basePrice,
      replacementPrice: Products.replacementPrice,
      averagePurchasePrice: Products.averagePurchasePrice,
      theoreticalWeight: Products.theoreticalWeight,
      priceUnit: Products.priceUnit,
      stockUnit: Products.stockUnit,
      length: Products.length,
      productGroupName: ProductGroups.name,
      minProfitMarginStock: ProductGroups.minProfitMarginStock,
      minProfitMarginExWorks: ProductGroups.minProfitMarginExWorks,
      qualityStandard: ProductGroups.standardsQuality,
    })
    .from(Products)
    .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
    .where(isNull(Products.companyUuid))
    .orderBy(asc(Products.productCode));

export const createProduct = async (
  fields: ProductFields,
): Promise<ProductActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(Products).values({ ...fields, uuid });
    revalidatePath("/products");
    return { success: true, productUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
};
