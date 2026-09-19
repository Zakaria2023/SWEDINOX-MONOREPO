"use server";

import { PRODUCT_PRICE_COLUMNS } from "@/app/(dashboard)/product-prices/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import {
  ProductGroupSuppliers,
  SelectProductGroupSuppliers,
} from "@/db/schema/product-group-suppliers";
import { Products, SelectProducts } from "@/db/schema/products";
import { salesUnitOptions } from "@/lib/enums";
import { describeError, moneyString, todayDateString } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  EMPTY_PURCHASE_COST,
  loadPurchaseCostByProduct,
} from "@/lib/server/purchase-pricing";
import {
  booleanFilter,
  enumFilter,
  FilterBinding,
  FilterBindings,
  numberRangeFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  aliasedTable,
  and,
  asc,
  count,
  eq,
  inArray,
  isNotNull,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

// A product group is at most two levels deep here: a group with no parent is
// itself the main group, otherwise its parent is the main group and the group
// is the subgroup.
const ParentGroups = aliasedTable(ProductGroups, "parent_groups");

// The preferred supplier of the product's group, and that supplier's own code
// for the article. Scalar subqueries rather than joins, so a group with several
// suppliers can't multiply the product rows; Companies is joined under an alias
// so the subquery stays independent of any Companies reference in the outer
// query.
const SupplierCompanies = aliasedTable(Companies, "supplier_companies");

const PRODUCT_PRICE_SEARCH = [
  Products.productCode,
  Products.oldProductCode,
  Products.name,
] as const;

const PRODUCT_PRICE_SORTABLE: SortableColumns = {
  productCode: Products.productCode,
  name: Products.name,
  basePrice: Products.basePrice,
  markup: Products.markup,
  fixedSalesPrice: Products.fixedSalesPrice,
};

export type ProductPriceRow = SelectProducts & {
  mainGroup: SelectProductGroups["name"] | null;
  subGroup: SelectProductGroups["name"] | null;
  preferredSupplier: SelectCompanies["companyName"] | null;
  supplierProductCode:
    | SelectProductGroupSuppliers["externalProductCode"]
    | null;
  // Both come off the supplier invoices rather than the product.
  replacementPrice: number;
  averagePurchasePrice: number;
};

export type RecalculatePricesResult = {
  error?: string;
  success?: boolean;
  updated?: number;
};

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

// The main group is the parent's name where there is a parent and the group's
// own name where there is not — the same rule the column renders, written once
// so the filter and the cell cannot disagree.
const mainGroupName = sql<string>`COALESCE(${ParentGroups.name}, ${ProductGroups.name})`;

const mainGroupFilter: FilterBinding = (values) => {
  const wanted = values.filter((value) => value.trim() !== "");
  if (wanted.length === 0) {
    return undefined;
  }
  return inArray(mainGroupName, wanted);
};

const PRODUCT_PRICE_FILTERS: FilterBindings = {
  mainGroup: mainGroupFilter,
  stockProduct: booleanFilter(Products.stockProduct),
  standardProduct: booleanFilter(Products.standardProduct),
  groupProduct: booleanFilter(Products.groupProduct),
  priceUnit: enumFilter(Products.priceUnit, salesUnitOptions),
  basePrice: numberRangeFilter(Products.basePrice),
};

/**
 * Every product with the prices it is bought and sold at. The sales prices are
 * the product's own; the purchase figures are read back from the supplier
 * invoices, since that is where a purchase price is recorded.
 *
 * Paged, because the catalogue is 19 383 articles in the reference and the
 * screen used to fetch all of them, join two group levels and two scalar
 * subqueries per row, then load the purchase cost of every product in the
 * system — before handing the whole array to the browser. That is what made
 * this one of the two pages that timed the production build out.
 *
 * The purchase costs are now loaded for the page's own products only, which is
 * what the loader's optional product list is for.
 */
const productPriceRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<ProductPriceRow[]> => {
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
      .where(
        tableWhere({
          query,
          search: PRODUCT_PRICE_SEARCH,
          filters: PRODUCT_PRICE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          PRODUCT_PRICE_SORTABLE,
          query,
          [asc(Products.productCode)],
          Products.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    const costs = await loadPurchaseCostByProduct(
      rows.map((row) => row.product.uuid),
    );

    return rows.map((row) => {
      const cost = costs.get(row.product.uuid) ?? EMPTY_PURCHASE_COST;
      return {
        ...row.product,
        mainGroup: row.groupParentUuid ? row.parentName : row.groupName,
        subGroup: row.groupParentUuid ? row.groupName : null,
        preferredSupplier: row.preferredSupplier,
        supplierProductCode: row.supplierProductCode,
        replacementPrice: cost.lastPurchasePrice,
        averagePurchasePrice: cost.averagePurchasePrice,
      };
    });
  };

export const getProductPrices = async (
  query: TableQuery,
): Promise<Paged<ProductPriceRow>> => {
  try {
    return await runPaged(query, {
      rows: productPriceRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Products)
          .leftJoin(
            ProductGroups,
            eq(Products.productGroupUuid, ProductGroups.uuid),
          )
          .leftJoin(
            ParentGroups,
            eq(ProductGroups.parentUuid, ParentGroups.uuid),
          )
          .where(
            tableWhere({
              query,
              search: PRODUCT_PRICE_SEARCH,
              filters: PRODUCT_PRICE_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch product prices"));
  }
};

export const exportProductPrices = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Product prices",
    columns: PRODUCT_PRICE_COLUMNS,
    columnKeys,
    rows: productPriceRows(parseTableQuery(params)),
  });

/** The main groups the catalogue actually uses, for the overview's filter. */
export const getProductMainGroups = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ mainGroup: mainGroupName })
    .from(Products)
    .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
    .leftJoin(ParentGroups, eq(ProductGroups.parentUuid, ParentGroups.uuid))
    .where(isNotNull(ProductGroups.uuid))
    .orderBy(asc(mainGroupName));

  return rows
    .map((row) => row.mainGroup)
    .filter((group): group is string => Boolean(group));
};

// Recomputes the sales price of every product from what it actually cost:
//
//   Cost basis     = the last price a supplier invoiced the article at, or its
//                    weighted average invoiced price when it has never carried
//                    a single latest line to point at
//   Base price     = the fixed sales price when one is set, otherwise the cost
//                    basis plus the markup percentage
//
// Only the sales side is written. The cost basis is not stored back onto the
// product: it is whatever the purchase invoices say, and copying it onto the
// article would only create a second version of the same fact.
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
    const [products, costs] = await Promise.all([
      db
        .select({
          uuid: Products.uuid,
          markup: Products.markup,
          fixedSalesPrice: Products.fixedSalesPrice,
        })
        .from(Products),

      loadPurchaseCostByProduct(),
    ]);

    if (products.length === 0) {
      return { error: "No products yet. Create one first." };
    }

    const priceDate = todayDateString();

    for (const product of products) {
      const cost = costs.get(product.uuid) ?? EMPTY_PURCHASE_COST;
      const costBasis =
        cost.lastPurchasePrice > 0
          ? cost.lastPurchasePrice
          : cost.averagePurchasePrice;
      const markup =
        Number(product.markup ?? 0) > 0
          ? Number(product.markup)
          : defaultMarkupPercent;
      const fixedSalesPrice = Number(product.fixedSalesPrice ?? 0);
      const basePrice =
        fixedSalesPrice > 0 ? fixedSalesPrice : costBasis * (1 + markup / 100);

      await db
        .update(Products)
        .set({
          markup: markup.toFixed(2),
          basePrice: moneyString(basePrice),
          priceDate,
        })
        .where(eq(Products.uuid, product.uuid));
    }

    revalidatePath("/product-prices");
    revalidatePath("/products");
    return { success: true, updated: products.length };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to recalculate product prices",
    };
  }
};
