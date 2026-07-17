"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  InsertProductGroupSuppliers,
  ProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import {
  InsertProductGroups,
  ProductGroups,
  SelectProductGroups,
} from "@/db/schema/product-groups";
import { generateUuid } from "@/lib/helpers";
import { and, asc, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProductGroupFields = Omit<
  InsertProductGroups,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ProductGroupSupplierInput = Omit<
  InsertProductGroupSuppliers,
  "id" | "uuid" | "productGroupUuid" | "createdAt" | "updatedAt"
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
      .where(isNull(ProductGroups.parentUuid))
      .orderBy(desc(ProductGroups.createdAt));
  } catch {
    throw new Error("Failed to fetch product groups");
  }
};

export const getProductGroupsForSelect = async (): Promise<
  ProductGroupOption[]
> =>
  db
    .select({
      uuid: ProductGroups.uuid,
      name: ProductGroups.name,
      parentUuid: ProductGroups.parentUuid,
      productShape: ProductGroups.productShape,
      articleGroup: ProductGroups.articleGroup,
    })
    .from(ProductGroups)
    .orderBy(asc(ProductGroups.name));

export const createProductGroup = async (
  fields: ProductGroupFields,
  suppliers: ProductGroupSupplierInput[] = [],
): Promise<ProductGroupActionResult> => {
  const uuid = generateUuid();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(ProductGroups).values({ ...fields, uuid });
      if (suppliers.length > 0) {
        await tx.insert(ProductGroupSuppliers).values(
          suppliers.map((supplier) => ({
            ...supplier,
            uuid: generateUuid(),
            productGroupUuid: uuid,
          })),
        );
      }
    });
    revalidatePath("/product-groups");
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
