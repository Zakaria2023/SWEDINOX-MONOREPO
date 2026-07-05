"use server";

import { db } from "@/db";
import { InsertProducts, Products, SelectProducts } from "@/db/schema/products";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { generateUuid } from "@/lib/helpers";
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
  } catch {
    throw new Error("Failed to fetch products");
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
