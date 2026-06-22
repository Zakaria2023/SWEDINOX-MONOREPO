"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  InsertProductGroups,
  ProductGroups,
  SelectProductGroups,
} from "@/db/schema/product-groups";
import { generateUuid } from "@/lib/helpers";
import { asc, desc, eq, getTableColumns, isNull } from "drizzle-orm";

export type ProductGroupFields = Omit<
  InsertProductGroups,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ProductGroupActionResult = {
  productGroupUuid?: string;
  error?: string;
  success?: boolean;
};

export type ProductGroupListItem = SelectProductGroups & {
  supplierName: SelectCompanies["companyName"] | null;
};

export type ProductGroupOption = Pick<
  SelectProductGroups,
  "uuid" | "name" | "parentUuid" | "productShape" | "articleGroup"
>;

export const getProductGroups = async (): Promise<ProductGroupListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(ProductGroups),
        supplierName: Companies.companyName,
      })
      .from(ProductGroups)
      .leftJoin(
        Companies,
        eq(ProductGroups.supplierCompanyUuid, Companies.uuid),
      )
      .where(isNull(ProductGroups.parentUuid))
      .orderBy(desc(ProductGroups.createdAt));
  } catch {
    throw new Error("Failed to fetch product groups");
  }
};

export const getProductGroupsForSelect = async (): Promise<
  ProductGroupOption[]
> => {
  return db
    .select({
      uuid: ProductGroups.uuid,
      name: ProductGroups.name,
      parentUuid: ProductGroups.parentUuid,
      productShape: ProductGroups.productShape,
      articleGroup: ProductGroups.articleGroup,
    })
    .from(ProductGroups)
    .orderBy(asc(ProductGroups.name));
};

export const createProductGroup = async (
  fields: ProductGroupFields,
): Promise<ProductGroupActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(ProductGroups).values({ ...fields, uuid });
    return { success: true, productGroupUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create product group",
    };
  }
};
