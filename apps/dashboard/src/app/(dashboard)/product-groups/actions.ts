"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  InsertProductGroupSuppliers,
  ProductGroupSuppliers,
  SelectProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import {
  InsertProductGroups,
  ProductGroups,
  SelectProductGroups,
} from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";

// How many catalogue products the group detail screen lists. A group can hold
// thousands, and that screen exists to identify the group rather than to browse
// the catalogue — the products overview does that.
const PRODUCT_GROUP_PRODUCT_LIMIT = 100;

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

export type ProductGroupSupplierRow = SelectProductGroupSuppliers & {
  supplierName: SelectCompanies["companyName"] | null;
  supplierCompanyId: SelectCompanies["id"] | null;
};

export type ProductGroupProductRow = Pick<
  SelectProducts,
  "uuid" | "productCode" | "name"
>;

export type ProductGroupChildRow = Pick<
  SelectProductGroups,
  "uuid" | "name" | "productShape" | "articleGroup"
>;

export type ProductGroupDetail = SelectProductGroups & {
  parentName: SelectProductGroups["name"] | null;
  suppliers: ProductGroupSupplierRow[];
  children: ProductGroupChildRow[];
  products: ProductGroupProductRow[];
};

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
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch product groups"));
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

/**
 * One product group with everything recorded on it, plus what hangs off it: the
 * suppliers that can deliver it, its sub-groups, and the catalogue products
 * filed under it.
 *
 * The product list is capped at PRODUCT_GROUP_PRODUCT_LIMIT — see the note
 * there for why.
 */
export const getProductGroupDetail = async (
  uuid: string,
): Promise<ProductGroupDetail | null> => {
  const ParentGroup = alias(ProductGroups, "parent_group");

  const [group] = await db
    .select({
      ...getTableColumns(ProductGroups),
      parentName: ParentGroup.name,
    })
    .from(ProductGroups)
    .leftJoin(ParentGroup, eq(ParentGroup.uuid, ProductGroups.parentUuid))
    .where(eq(ProductGroups.uuid, uuid))
    .limit(1);

  if (!group) {
    return null;
  }

  const [suppliers, children, products] = await Promise.all([
    db
      .select({
        ...getTableColumns(ProductGroupSuppliers),
        supplierName: Companies.companyName,
        supplierCompanyId: Companies.id,
      })
      .from(ProductGroupSuppliers)
      .leftJoin(
        Companies,
        eq(Companies.uuid, ProductGroupSuppliers.supplierCompanyUuid),
      )
      .where(eq(ProductGroupSuppliers.productGroupUuid, uuid))
      .orderBy(desc(ProductGroupSuppliers.preferred)),
    db
      .select({
        uuid: ProductGroups.uuid,
        name: ProductGroups.name,
        productShape: ProductGroups.productShape,
        articleGroup: ProductGroups.articleGroup,
      })
      .from(ProductGroups)
      .where(eq(ProductGroups.parentUuid, uuid))
      .orderBy(asc(ProductGroups.name)),
    db
      .select({
        uuid: Products.uuid,
        productCode: Products.productCode,
        name: Products.name,
      })
      .from(Products)
      .where(eq(Products.productGroupUuid, uuid))
      .orderBy(asc(Products.productCode))
      .limit(PRODUCT_GROUP_PRODUCT_LIMIT),
  ]);

  return { ...group, suppliers, children, products };
};

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
