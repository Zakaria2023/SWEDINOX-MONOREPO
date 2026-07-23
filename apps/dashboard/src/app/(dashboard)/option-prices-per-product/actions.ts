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
import { generateUuid, todayDateString } from "@/lib/helpers";
import { aliasedTable, and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// The far-future date the ERP uses for "no end date".
const OPEN_ENDED_UNTIL = "9999-12-31";

export type OptionPriceFilter = {
  codeFrom?: string;
  codeTo?: string;
};

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

const ParentGroups = aliasedTable(ProductGroups, "parent_groups");

// The supplier's own name is fetched in a correlated subquery. The joined
// Companies table is aliased with a raw `sc` inside the SQL string — an
// `aliasedTable` interpolated into a raw sql template renders only the alias,
// not `Companies AS alias`, which would query a table that does not exist.
const preferredSupplierName = sql<
  string | null
>`(SELECT sc.company_name FROM ${ProductGroupSuppliers} INNER JOIN ${Companies} sc ON sc.uuid = ${ProductGroupSuppliers.supplierCompanyUuid} WHERE ${ProductGroupSuppliers.productGroupUuid} = ${Products.productGroupUuid} AND ${ProductGroupSuppliers.preferred} = TRUE LIMIT 1)`;

const supplierProductCode = sql<
  string | null
>`(SELECT ${ProductGroupSuppliers.externalProductCode} FROM ${ProductGroupSuppliers} WHERE ${ProductGroupSuppliers.productGroupUuid} = ${Products.productGroupUuid} AND ${ProductGroupSuppliers.preferred} = TRUE LIMIT 1)`;

// Every priced product/option pair, with the product's grouping and preferred
// supplier alongside. Filtered on a product code range, as the legacy overview
// does.
export const getOptionPrices = async (
  filter: OptionPriceFilter = {},
): Promise<OptionPriceRow[]> => {
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
      .where(
        and(
          filter.codeFrom
            ? gte(Products.productCode, filter.codeFrom)
            : undefined,
          filter.codeTo ? lte(Products.productCode, filter.codeTo) : undefined,
        ),
      )
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
  } catch {
    throw new Error("Failed to fetch option prices");
  }
};

export const getSalesOptions = async (): Promise<SelectSalesOptions[]> =>
  db.select().from(SalesOptions).orderBy(asc(SalesOptions.code));

export type SalesOptionFields = Omit<
  InsertSalesOptions,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type SalesOptionActionResult = {
  error?: string;
  success?: boolean;
};

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

export type GenerateOptionPricesResult = {
  error?: string;
  success?: boolean;
  createdRows?: number;
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
