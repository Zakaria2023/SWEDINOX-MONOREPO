"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CustomerStock, SelectCustomerStock } from "@/db/schema/customer-stock";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import {
  InsertProductAlternatives,
  InsertProductPreferredLocations,
  InsertProductPriceStructures,
  InsertProductSawingPrices,
  InsertProductSuppliers,
  ProductAlternatives,
  ProductAppHistory,
  ProductFspHistory,
  ProductPreferredLocations,
  ProductPriceStructures,
  ProductSawingPrices,
  ProductSuppliers,
  SelectProductAlternatives,
  SelectProductAppHistory,
  SelectProductFspHistory,
  SelectProductPreferredLocations,
  SelectProductPriceStructures,
  SelectProductSawingPrices,
  SelectProductSuppliers,
} from "@/db/schema/product-details";
import { InsertProducts, Products, SelectProducts } from "@/db/schema/products";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  PurchaseQuoteItems,
  SelectPurchaseQuoteItems,
} from "@/db/schema/purchase-quote-items";
import { PurchaseQuotes } from "@/db/schema/purchase-quotes";
import { QuoteItems, SelectQuoteItems } from "@/db/schema/quote-items";
import { Quotes, SelectQuotes } from "@/db/schema/quotes";
import {
  ReturnOrderItems,
  SelectReturnOrderItems,
} from "@/db/schema/return-order-items";
import { ReturnOrders, SelectReturnOrders } from "@/db/schema/return-orders";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import {
  ProductOptionPrices,
  SalesOptions,
  SelectProductOptionPrices,
  SelectSalesOptions,
} from "@/db/schema/sales-options";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import {
  derivedWeightColumns,
  describeError,
  generateUuid,
} from "@/lib/helpers";
import {
  EMPTY_PURCHASE_COST,
  loadPurchaseCost,
  loadPurchaseCostByProduct,
  ProductPurchaseCost,
} from "@/lib/server/purchase-pricing";
import { articleGroups } from "@/lib/enums";
import {
  booleanFilter,
  enumFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import { PRODUCT_COLUMNS } from "@/app/(dashboard)/products/columns";
import { asc, count, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Both of these tables are joined twice in the detail query — a product's
// alternative is itself a product, and a preferred location has a restock
// location — so each needs an alias to be distinguishable in SQL.
const AlternativeProduct = alias(Products, "alternative_product");
const RestockLocation = alias(Warehouses, "restock_location");

export type ProductFields = Omit<
  InsertProducts,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

// The child rows the product form owns. Each arrives without a uuid or a parent
// reference — both are the server's to assign.
export type ProductAlternativeInput = Omit<
  InsertProductAlternatives,
  "id" | "uuid" | "productUuid" | "createdAt" | "updatedAt"
>;
export type ProductSupplierInput = Omit<
  InsertProductSuppliers,
  "id" | "uuid" | "productUuid" | "createdAt" | "updatedAt"
>;
export type ProductPreferredLocationInput = Omit<
  InsertProductPreferredLocations,
  "id" | "uuid" | "productUuid" | "createdAt" | "updatedAt"
>;
export type ProductPriceStructureInput = Omit<
  InsertProductPriceStructures,
  "id" | "uuid" | "productUuid" | "createdAt" | "updatedAt"
>;
export type ProductSawingPriceInput = Omit<
  InsertProductSawingPrices,
  "id" | "uuid" | "productUuid" | "createdAt" | "updatedAt"
>;

export type ProductChildren = {
  alternatives: ProductAlternativeInput[];
  suppliers: ProductSupplierInput[];
  preferredLocations: ProductPreferredLocationInput[];
  priceStructures: ProductPriceStructureInput[];
  sawingPrices: ProductSawingPriceInput[];
};

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
    | "theoreticalWeight"
    // The unit that says how to read the figure above. Without it a density of
    // 7 850 kg/m3 reads as a 7,85-tonne piece.
    | "weightUnit"
    | "weightTheoretical"
    | "priceUnit"
    | "stockUnit"
    | "length"
    | "widthDiameter"
    | "thickness"
  > & {
    productGroupName: SelectProductGroups["name"] | null;
    minProfitMarginStock: SelectProductGroups["minProfitMarginStock"] | null;
    minProfitMarginExWorks:
      | SelectProductGroups["minProfitMarginExWorks"]
      | null;
    qualityStandard: SelectProductGroups["standardsQuality"] | null;
    // Cost figures come off the supplier invoices rather than the product, so
    // they are aggregates rather than columns.
    averagePurchasePrice: number;
    replacementPrice: number;
  };

export type RevenueGroupOption = Pick<SelectRevenueGroups, "uuid" | "name">;

/** Revenue groups as the product form's picker needs them. */
export const getRevenueGroupsForSelect = async (): Promise<
  RevenueGroupOption[]
> =>
  db
    .select({ uuid: RevenueGroups.uuid, name: RevenueGroups.name })
    .from(RevenueGroups)
    .orderBy(asc(RevenueGroups.name));

const PRODUCT_SEARCH = [
  Products.productCode,
  Products.name,
  Products.commodityCode,
] as const;

const PRODUCT_SORTABLE = {
  createdAt: Products.createdAt,
  productCode: Products.productCode,
  name: Products.name,
  productGroup: ProductGroups.name,
  basePrice: Products.basePrice,
};

// The catalogue is searched by code far more than it is filtered, so the list
// is short: which group it sits in, what kind of article it is, whose product
// it is, and the two flags that decide whether it can be sold from stock at all.
const PRODUCT_FILTERS = {
  productGroup: relationFilter(Products.productGroupUuid),
  articleGroup: enumFilter(Products.articleGroup, articleGroups),
  company: relationFilter(Products.companyUuid),
  stockProduct: booleanFilter(Products.stockProduct),
  blockedForPurchasing: booleanFilter(Products.blockedForPurchasing),
};

/**
 * The rows one view of the products overview selects, as a window onto them.
 * Shared by the page and the export.
 */
const productRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<ProductListItem[]> =>
    db
      .select({
        ...getTableColumns(Products),
        productGroupName: ProductGroups.name,
      })
      .from(Products)
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .where(
        tableWhere({ query, search: PRODUCT_SEARCH, filters: PRODUCT_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          PRODUCT_SORTABLE,
          query,
          [desc(Products.createdAt)],
          Products.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every product the current view matches, as a workbook. */
export const exportProducts = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Products",
    columns: PRODUCT_COLUMNS,
    columnKeys,
    rows: productRows(parseTableQuery(params)),
  });

export const getProducts = async (
  query: TableQuery,
): Promise<Paged<ProductListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: PRODUCT_SEARCH,
      filters: PRODUCT_FILTERS,
    });

    return await runPaged(query, {
      rows: productRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Products)
          .leftJoin(
            ProductGroups,
            eq(Products.productGroupUuid, ProductGroups.uuid),
          )
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
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
export const getProductsForPricing = async (): Promise<
  ProductPricingOption[]
> => {
  const [rows, costs] = await Promise.all([
    db
      .select({
        uuid: Products.uuid,
        productCode: Products.productCode,
        name: Products.name,
        productGroupUuid: Products.productGroupUuid,
        basePrice: Products.basePrice,
        theoreticalWeight: Products.theoreticalWeight,
        weightUnit: Products.weightUnit,
        weightTheoretical: Products.weightTheoretical,
        priceUnit: Products.priceUnit,
        stockUnit: Products.stockUnit,
        length: Products.length,
        widthDiameter: Products.widthDiameter,
        thickness: Products.thickness,
        productGroupName: ProductGroups.name,
        minProfitMarginStock: ProductGroups.minProfitMarginStock,
        minProfitMarginExWorks: ProductGroups.minProfitMarginExWorks,
        qualityStandard: ProductGroups.standardsQuality,
      })
      .from(Products)
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .where(isNull(Products.companyUuid))
      .orderBy(asc(Products.productCode)),

    loadPurchaseCostByProduct(),
  ]);

  return rows.map((row) => {
    const cost = costs.get(row.uuid) ?? EMPTY_PURCHASE_COST;
    return {
      ...row,
      averagePurchasePrice: cost.averagePurchasePrice,
      replacementPrice: cost.lastPurchasePrice,
    };
  });
};

// Writes the product's own child rows. Always a full replace: the form submits
// the complete list, so reconciling row by row would only risk the saved set
// disagreeing with what was on screen.
const writeProductChildren = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productUuid: string,
  children: ProductChildren,
) => {
  await tx
    .delete(ProductAlternatives)
    .where(eq(ProductAlternatives.productUuid, productUuid));
  await tx
    .delete(ProductSuppliers)
    .where(eq(ProductSuppliers.productUuid, productUuid));
  await tx
    .delete(ProductPreferredLocations)
    .where(eq(ProductPreferredLocations.productUuid, productUuid));
  await tx
    .delete(ProductPriceStructures)
    .where(eq(ProductPriceStructures.productUuid, productUuid));
  await tx
    .delete(ProductSawingPrices)
    .where(eq(ProductSawingPrices.productUuid, productUuid));

  if (children.alternatives.length > 0) {
    await tx.insert(ProductAlternatives).values(
      children.alternatives.map((row) => ({
        ...row,
        uuid: generateUuid(),
        productUuid,
      })),
    );
  }
  if (children.suppliers.length > 0) {
    await tx.insert(ProductSuppliers).values(
      children.suppliers.map((row) => ({
        ...row,
        uuid: generateUuid(),
        productUuid,
      })),
    );
  }
  if (children.preferredLocations.length > 0) {
    await tx.insert(ProductPreferredLocations).values(
      children.preferredLocations.map((row) => ({
        ...row,
        uuid: generateUuid(),
        productUuid,
      })),
    );
  }
  if (children.priceStructures.length > 0) {
    await tx.insert(ProductPriceStructures).values(
      children.priceStructures.map((row) => ({
        ...row,
        uuid: generateUuid(),
        productUuid,
      })),
    );
  }
  if (children.sawingPrices.length > 0) {
    await tx.insert(ProductSawingPrices).values(
      children.sawingPrices.map((row) => ({
        ...row,
        uuid: generateUuid(),
        productUuid,
      })),
    );
  }
};

const EMPTY_CHILDREN: ProductChildren = {
  alternatives: [],
  suppliers: [],
  preferredLocations: [],
  priceStructures: [],
  sawingPrices: [],
};

/**
 * Re-derives the weight columns from the article's own shape, dimensions and
 * grade before it is written.
 *
 * These three are geometry, not opinions: a 20 mm round bar in 304 weighs
 * 2.4819 kg/m and nothing a person types about it makes that a different
 * number. Deriving them on the way in stops a stale figure surviving a change
 * of dimension or grade. Where the geometry genuinely does not yield them — a
 * beam, whose section comes from a profile table this system does not hold —
 * whatever was typed is kept.
 */
const withDerivedWeights = (fields: ProductFields): ProductFields => ({
  ...fields,
  // Left blank the product has no density of its own and falls back to its
  // grade, so an empty box has to reach the column as null rather than as an
  // empty string a decimal cannot hold.
  densityKgDm3: fields.densityKgDm3?.trim() ? fields.densityKgDm3 : null,
  ...derivedWeightColumns(
    fields.dimensionShape,
    {
      length: Number(fields.length ?? 0),
      widthDiameter: Number(fields.widthDiameter ?? 0),
      thickness: Number(fields.thickness ?? 0),
    },
    fields.featuresQuality,
    Number(fields.densityKgDm3 ?? 0) || null,
  ),
});

export const createProduct = async (
  fields: ProductFields,
  children: ProductChildren = EMPTY_CHILDREN,
): Promise<ProductActionResult> => {
  const uuid = generateUuid();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(Products).values({ ...withDerivedWeights(fields), uuid });
      await writeProductChildren(tx, uuid, children);
    });
    revalidatePath("/products");
    return { success: true, productUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
};

export const updateProduct = async (
  uuid: string,
  fields: ProductFields,
  children: ProductChildren = EMPTY_CHILDREN,
): Promise<ProductActionResult> => {
  try {
    const [existing] = await db
      .select({ uuid: Products.uuid })
      .from(Products)
      .where(eq(Products.uuid, uuid))
      .limit(1);

    if (!existing) {
      return { error: "Product not found." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(Products)
        .set(withDerivedWeights(fields))
        .where(eq(Products.uuid, uuid));
      await writeProductChildren(tx, uuid, children);
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${uuid}`);
  redirect(`/products/${uuid}`);
};

export const deleteProduct = async (
  uuid: string,
): Promise<ProductActionResult> => {
  try {
    // A product that has ever been sold, bought or stocked cannot be removed —
    // the documents that reference it would lose the article they describe.
    const [stocked] = await db
      .select({ uuid: Stock.uuid })
      .from(Stock)
      .where(eq(Stock.productUuid, uuid))
      .limit(1);
    const [ordered] = await db
      .select({ uuid: OrderItems.uuid })
      .from(OrderItems)
      .where(eq(OrderItems.productUuid, uuid))
      .limit(1);
    const [quoted] = await db
      .select({ uuid: QuoteItems.uuid })
      .from(QuoteItems)
      .where(eq(QuoteItems.productUuid, uuid))
      .limit(1);

    if (stocked || ordered || quoted) {
      return {
        error:
          "Cannot delete: this product is used on stock, orders or quotes. Block it for sales and purchasing instead.",
      };
    }

    await db.transaction(async (tx) => {
      await writeProductChildren(tx, uuid, EMPTY_CHILDREN);
      await tx
        .delete(ProductAppHistory)
        .where(eq(ProductAppHistory.productUuid, uuid));
      await tx
        .delete(ProductFspHistory)
        .where(eq(ProductFspHistory.productUuid, uuid));
      await tx.delete(Products).where(eq(Products.uuid, uuid));
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }

  revalidatePath("/products");
  redirect("/products");
};

// ── Detail ──────────────────────────────────────────────────────────────────
// Every line-level grid on the product screen is a document line joined back to
// its header, so each row can say which order, quote or customer it belongs to.

export type ProductOrderLine = SelectOrderItems & {
  orderId: SelectOrders["id"] | null;
  orderStatus: SelectOrders["status"] | null;
  orderCreatedAt: SelectOrders["createdAt"] | null;
  customerName: SelectCompanies["companyName"] | null;
};

export type ProductQuoteLine = SelectQuoteItems & {
  quoteId: SelectQuotes["id"] | null;
  quoteDate: SelectQuotes["quoteDate"] | null;
  decisionDate: SelectQuotes["decisionDate"] | null;
  customerName: SelectCompanies["companyName"] | null;
};

export type ProductReturnLine = SelectReturnOrderItems & {
  returnOrderId: SelectReturnOrders["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
};

export type ProductPurchaseOrderLine = SelectPurchaseOrderItems & {
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseOrderStatus: SelectPurchaseOrders["status"] | null;
  supplierName: SelectCompanies["companyName"] | null;
};

export type ProductPurchaseQuoteLine = SelectPurchaseQuoteItems & {
  purchaseQuoteId: number | null;
  supplierName: SelectCompanies["companyName"] | null;
};

export type ProductStockRow = SelectStock & {
  locationName: SelectWarehouses["name"] | null;
};

export type ProductStockMovementRow = SelectStockMovements & {
  companyName: SelectCompanies["companyName"] | null;
};

export type ProductCustomerStockRow = SelectCustomerStock & {
  customerName: SelectCompanies["companyName"] | null;
};

export type ProductOptionPriceRow = SelectProductOptionPrices & {
  optionCode: SelectSalesOptions["code"] | null;
  optionName: SelectSalesOptions["name"] | null;
};

export type ProductAlternativeRow = SelectProductAlternatives & {
  alternativeProductCode: SelectProducts["productCode"] | null;
  alternativeProductName: SelectProducts["name"] | null;
};

export type ProductSupplierRow = SelectProductSuppliers & {
  supplierName: SelectCompanies["companyName"] | null;
};

export type ProductPreferredLocationRow = SelectProductPreferredLocations & {
  locationName: SelectWarehouses["name"] | null;
  restockLocationName: SelectWarehouses["name"] | null;
};

export type ProductDetail = SelectProducts & {
  productGroupName: SelectProductGroups["name"] | null;
  companyName: SelectCompanies["companyName"] | null;

  // What the article has actually been billed at, read back from the supplier
  // invoices — the product itself carries no purchase price.
  purchaseCost: ProductPurchaseCost;

  // Own child rows
  alternatives: ProductAlternativeRow[];
  suppliers: ProductSupplierRow[];
  preferredLocations: ProductPreferredLocationRow[];
  priceStructures: SelectProductPriceStructures[];
  sawingPrices: SelectProductSawingPrices[];
  optionPrices: ProductOptionPriceRow[];
  appHistory: SelectProductAppHistory[];
  fspHistory: SelectProductFspHistory[];

  // Traffic through the article — read-only on this screen, since each of these
  // belongs to the document that created it.
  orderLines: ProductOrderLine[];
  quoteLines: ProductQuoteLine[];
  returnLines: ProductReturnLine[];
  purchaseOrderLines: ProductPurchaseOrderLine[];
  purchaseQuoteLines: ProductPurchaseQuoteLine[];
  stock: ProductStockRow[];
  stockMovements: ProductStockMovementRow[];
  customerStock: ProductCustomerStockRow[];
};

// Line history is capped: an article that has moved for years would otherwise
// pull tens of thousands of rows into a screen nobody scrolls that far down.
const LINE_HISTORY_LIMIT = 200;

export const getProductDetail = async (
  uuid: string,
): Promise<ProductDetail | null> => {
  const [product] = await db
    .select({
      ...getTableColumns(Products),
      productGroupName: ProductGroups.name,
      companyName: Companies.companyName,
    })
    .from(Products)
    .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
    .leftJoin(Companies, eq(Products.companyUuid, Companies.uuid))
    .where(eq(Products.uuid, uuid))
    .limit(1);

  if (!product) {
    return null;
  }

  const [
    alternatives,
    suppliers,
    preferredLocations,
    priceStructures,
    sawingPrices,
    optionPrices,
    appHistory,
    fspHistory,
    orderLines,
    quoteLines,
    returnLines,
    purchaseOrderLines,
    purchaseQuoteLines,
    stock,
    stockMovements,
    customerStock,
    purchaseCost,
  ] = await Promise.all([
    db
      .select({
        ...getTableColumns(ProductAlternatives),
        alternativeProductCode: AlternativeProduct.productCode,
        alternativeProductName: AlternativeProduct.name,
      })
      .from(ProductAlternatives)
      .leftJoin(
        AlternativeProduct,
        eq(ProductAlternatives.alternativeProductUuid, AlternativeProduct.uuid),
      )
      .where(eq(ProductAlternatives.productUuid, uuid)),

    db
      .select({
        ...getTableColumns(ProductSuppliers),
        supplierName: Companies.companyName,
      })
      .from(ProductSuppliers)
      .leftJoin(Companies, eq(ProductSuppliers.supplierUuid, Companies.uuid))
      .where(eq(ProductSuppliers.productUuid, uuid))
      .orderBy(desc(ProductSuppliers.preferred)),

    db
      .select({
        ...getTableColumns(ProductPreferredLocations),
        locationName: Warehouses.name,
        restockLocationName: RestockLocation.name,
      })
      .from(ProductPreferredLocations)
      .leftJoin(
        Warehouses,
        eq(ProductPreferredLocations.locationUuid, Warehouses.uuid),
      )
      .leftJoin(
        RestockLocation,
        eq(ProductPreferredLocations.restockLocationUuid, RestockLocation.uuid),
      )
      .where(eq(ProductPreferredLocations.productUuid, uuid))
      .orderBy(asc(ProductPreferredLocations.preference)),

    db
      .select()
      .from(ProductPriceStructures)
      .where(eq(ProductPriceStructures.productUuid, uuid))
      .orderBy(desc(ProductPriceStructures.validFrom)),

    db
      .select()
      .from(ProductSawingPrices)
      .where(eq(ProductSawingPrices.productUuid, uuid))
      .orderBy(desc(ProductSawingPrices.validFrom)),

    db
      .select({
        ...getTableColumns(ProductOptionPrices),
        optionCode: SalesOptions.code,
        optionName: SalesOptions.name,
      })
      .from(ProductOptionPrices)
      .leftJoin(
        SalesOptions,
        eq(ProductOptionPrices.optionUuid, SalesOptions.uuid),
      )
      .where(eq(ProductOptionPrices.productUuid, uuid)),

    db
      .select()
      .from(ProductAppHistory)
      .where(eq(ProductAppHistory.productUuid, uuid))
      .orderBy(desc(ProductAppHistory.startDate)),

    db
      .select()
      .from(ProductFspHistory)
      .where(eq(ProductFspHistory.productUuid, uuid))
      .orderBy(desc(ProductFspHistory.startDate)),

    db
      .select({
        ...getTableColumns(OrderItems),
        orderId: Orders.id,
        orderStatus: Orders.status,
        orderCreatedAt: Orders.createdAt,
        customerName: Companies.companyName,
      })
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .where(eq(OrderItems.productUuid, uuid))
      .orderBy(desc(OrderItems.createdAt))
      .limit(LINE_HISTORY_LIMIT),

    db
      .select({
        ...getTableColumns(QuoteItems),
        quoteId: Quotes.id,
        quoteDate: Quotes.quoteDate,
        decisionDate: Quotes.decisionDate,
        customerName: Companies.companyName,
      })
      .from(QuoteItems)
      .leftJoin(Quotes, eq(QuoteItems.quoteUuid, Quotes.uuid))
      .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
      .where(eq(QuoteItems.productUuid, uuid))
      .orderBy(desc(QuoteItems.createdAt))
      .limit(LINE_HISTORY_LIMIT),

    db
      .select({
        ...getTableColumns(ReturnOrderItems),
        returnOrderId: ReturnOrders.id,
        customerName: Companies.companyName,
      })
      .from(ReturnOrderItems)
      .leftJoin(
        ReturnOrders,
        eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
      )
      .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
      .where(eq(ReturnOrderItems.productUuid, uuid))
      .orderBy(desc(ReturnOrderItems.createdAt))
      .limit(LINE_HISTORY_LIMIT),

    db
      .select({
        ...getTableColumns(PurchaseOrderItems),
        purchaseOrderId: PurchaseOrders.id,
        purchaseOrderStatus: PurchaseOrders.status,
        supplierName: Companies.companyName,
      })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .where(eq(PurchaseOrderItems.productUuid, uuid))
      .orderBy(desc(PurchaseOrderItems.createdAt))
      .limit(LINE_HISTORY_LIMIT),

    db
      .select({
        ...getTableColumns(PurchaseQuoteItems),
        purchaseQuoteId: PurchaseQuotes.id,
        supplierName: Companies.companyName,
      })
      .from(PurchaseQuoteItems)
      .leftJoin(
        PurchaseQuotes,
        eq(PurchaseQuoteItems.purchaseQuoteUuid, PurchaseQuotes.uuid),
      )
      .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
      .where(eq(PurchaseQuoteItems.productUuid, uuid))
      .orderBy(desc(PurchaseQuoteItems.createdAt))
      .limit(LINE_HISTORY_LIMIT),

    db
      .select({
        ...getTableColumns(Stock),
        locationName: Warehouses.name,
      })
      .from(Stock)
      .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
      .where(eq(Stock.productUuid, uuid)),

    // A stock movement has no counterparty of its own — it points at the
    // document that caused it. The supplier shown here is the one on the
    // purchase order behind a receipt; a sales movement leaves it blank.
    db
      .select({
        ...getTableColumns(StockMovements),
        companyName: Companies.companyName,
      })
      .from(StockMovements)
      .leftJoin(
        PurchaseOrders,
        eq(StockMovements.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .where(eq(StockMovements.productUuid, uuid))
      .orderBy(desc(StockMovements.createdAt))
      .limit(LINE_HISTORY_LIMIT),

    db
      .select({
        ...getTableColumns(CustomerStock),
        customerName: Companies.companyName,
      })
      .from(CustomerStock)
      .leftJoin(Companies, eq(CustomerStock.companyUuid, Companies.uuid))
      .where(eq(CustomerStock.productUuid, uuid)),

    loadPurchaseCost(uuid),
  ]);

  return {
    ...product,
    purchaseCost,
    alternatives,
    suppliers,
    preferredLocations,
    priceStructures,
    sawingPrices,
    optionPrices,
    appHistory,
    fspHistory,
    orderLines,
    quoteLines,
    returnLines,
    purchaseOrderLines,
    purchaseQuoteLines,
    stock,
    stockMovements,
    customerStock,
  };
};
