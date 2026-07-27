"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import {
  ProductGroupSuppliers,
  SelectProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  InsertSalesOptions,
  ProductOptionPrices,
  SalesOptions,
  SelectProductOptionPrices,
  SelectSalesOptions,
} from "@/db/schema/sales-options";
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { aliasedTable, and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// The far-future date the ERP uses for "no end date".
const OPEN_ENDED_UNTIL = "9999-12-31";

export type OptionPriceRow = SelectProductOptionPrices & {
  productCode: SelectProducts["productCode"] | null;
  oldProductCode: SelectProducts["oldProductCode"] | null;
  productName: SelectProducts["name"] | null;
  groupProduct: SelectProducts["groupProduct"] | null;
  stockProduct: SelectProducts["stockProduct"] | null;
  standardProduct: SelectProducts["standardProduct"] | null;
  mainGroup: SelectProductGroups["name"] | null;
  subGroup: SelectProductGroups["name"] | null;
  preferredSupplier: SelectCompanies["companyName"] | null;
  supplierProductCode:
    | SelectProductGroupSuppliers["externalProductCode"]
    | null;
  optionCode: SelectSalesOptions["code"] | null;
  optionName: SelectSalesOptions["name"] | null;
};

export type SalesOptionFields = Omit<
  InsertSalesOptions,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type SalesOptionActionResult = {
  error?: string;
  success?: boolean;
};

export type GenerateOptionPricesResult = {
  error?: string;
  success?: boolean;
  createdRows?: number;
};

const ParentGroups = aliasedTable(ProductGroups, "parent_groups");

// The preferred supplier of the product's group, resolved per row as
// correlated scalar subqueries built with the query builder; Companies is
// joined under an alias so the subquery stays independent of any Companies
// reference in the outer query.
const SupplierCompanies = aliasedTable(Companies, "supplier_companies");

const preferredSupplierRow = db
  .select({ companyName: SupplierCompanies.companyName })
  .from(ProductGroupSuppliers)
  .innerJoin(
    SupplierCompanies,
    eq(SupplierCompanies.uuid, ProductGroupSuppliers.supplierCompanyUuid),
  )
  .where(
    and(
      eq(ProductGroupSuppliers.productGroupUuid, Products.productGroupUuid),
      eq(ProductGroupSuppliers.preferred, true),
    ),
  )
  .limit(1);

const preferredSupplierName = sql<string | null>`(${preferredSupplierRow})`;

const supplierProductCodeRow = db
  .select({ code: ProductGroupSuppliers.externalProductCode })
  .from(ProductGroupSuppliers)
  .where(
    and(
      eq(ProductGroupSuppliers.productGroupUuid, Products.productGroupUuid),
      eq(ProductGroupSuppliers.preferred, true),
    ),
  )
  .limit(1);

const supplierProductCode = sql<string | null>`(${supplierProductCodeRow})`;

// Every priced product/option pair, with the product's grouping and preferred
// supplier alongside.
export const getOptionPrices = async (): Promise<OptionPriceRow[]> => {
  try {
    const rows = await db
      .select({
        optionPrice: ProductOptionPrices,
        productCode: Products.productCode,
        oldProductCode: Products.oldProductCode,
        productName: Products.name,
        groupProduct: Products.groupProduct,
        stockProduct: Products.stockProduct,
        standardProduct: Products.standardProduct,
        groupName: ProductGroups.name,
        groupParentUuid: ProductGroups.parentUuid,
        parentName: ParentGroups.name,
        preferredSupplier: preferredSupplierName,
        supplierProductCode,
        optionCode: SalesOptions.code,
        optionName: SalesOptions.name,
      })
      .from(ProductOptionPrices)
      .innerJoin(Products, eq(ProductOptionPrices.productUuid, Products.uuid))
      .innerJoin(
        SalesOptions,
        eq(ProductOptionPrices.optionUuid, SalesOptions.uuid),
      )
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .leftJoin(ParentGroups, eq(ProductGroups.parentUuid, ParentGroups.uuid))
      .orderBy(asc(Products.productCode), asc(SalesOptions.code));

    return rows.map((row) => ({
      ...row.optionPrice,
      productCode: row.productCode,
      oldProductCode: row.oldProductCode,
      productName: row.productName,
      groupProduct: row.groupProduct,
      stockProduct: row.stockProduct,
      standardProduct: row.standardProduct,
      mainGroup: row.groupParentUuid ? row.parentName : row.groupName,
      subGroup: row.groupParentUuid ? row.groupName : null,
      preferredSupplier: row.preferredSupplier,
      supplierProductCode: row.supplierProductCode,
      optionCode: row.optionCode,
      optionName: row.optionName,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch option prices"));
  }
};

export const getSalesOptions = async (): Promise<SelectSalesOptions[]> =>
  db.select().from(SalesOptions).orderBy(asc(SalesOptions.code));

export const createSalesOption = async (
  fields: SalesOptionFields,
): Promise<SalesOptionActionResult> => {
  try {
    const [existing] = await db
      .select({ uuid: SalesOptions.uuid })
      .from(SalesOptions)
      .where(eq(SalesOptions.code, fields.code))
      .limit(1);

    if (existing) {
      return { error: `An option with code "${fields.code}" already exists.` };
    }

    await db.insert(SalesOptions).values({ ...fields, uuid: generateUuid() });
    revalidatePath("/option-prices-per-product");
    revalidatePath("/options");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create option",
    };
  }
};

// Opens a price for every product/active-option pair that has none yet, seeded
// from the option's own base and cost price and valid from today onwards. Pairs
// that already have a price are left alone, so an option priced by hand keeps
// its value and the action can be re-run after adding products or options.
export const generateOptionPrices =
  async (): Promise<GenerateOptionPricesResult> => {
    try {
      const options = await db
        .select()
        .from(SalesOptions)
        .where(eq(SalesOptions.isActive, true));

      if (options.length === 0) {
        return {
          error: "No active options yet. Create one with “New option” first.",
        };
      }

      const products = await db
        .select({
          uuid: Products.uuid,
          priceUnit: Products.priceUnit,
          stockUnit: Products.stockUnit,
        })
        .from(Products);

      if (products.length === 0) {
        return { error: "No products yet. Create one first." };
      }

      const existing = await db
        .select({
          productUuid: ProductOptionPrices.productUuid,
          optionUuid: ProductOptionPrices.optionUuid,
        })
        .from(ProductOptionPrices);
      const priced = new Set(
        existing.map((row) => `${row.productUuid}:${row.optionUuid}`),
      );

      const validFrom = todayDateString();
      const rows: (typeof ProductOptionPrices.$inferInsert)[] = [];

      for (const product of products) {
        for (const option of options) {
          if (priced.has(`${product.uuid}:${option.uuid}`)) {
            continue;
          }
          rows.push({
            uuid: generateUuid(),
            productUuid: product.uuid,
            optionUuid: option.uuid,
            priceUnit:
              option.priceUnit ?? product.priceUnit ?? product.stockUnit,
            basePrice: option.basePrice ?? "0.00",
            costPrice: option.costPrice ?? "0.00",
            validFrom,
            validUntil: OPEN_ENDED_UNTIL,
          });
        }
      }

      if (rows.length === 0) {
        return { error: "Every product is already priced for every option." };
      }

      await db.insert(ProductOptionPrices).values(rows);

      revalidatePath("/option-prices-per-product");
      return { success: true, createdRows: rows.length };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate option prices",
      };
    }
  };
