import "server-only";

import { db } from "@/db";
import {
  ContractNetPrices,
  SelectContractNetPrices,
} from "@/db/schema/contract-net-prices";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { ProductFspHistory } from "@/db/schema/product-details";
import { ProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  applyPriceDiscounts,
  resolveTierDiscount,
  todayDateString,
} from "@/lib/helpers";
import {
  EMPTY_PURCHASE_COST,
  loadPurchaseCostByProduct,
} from "@/lib/server/purchase-pricing";
import { and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

/**
 * The product facts a sales line is priced and costed from. Loaded once per
 * document rather than per line, since a document usually repeats products.
 *
 * The two cost figures are not product columns: what the article costs is what
 * a supplier billed for it, so both are read back from its purchase invoices.
 */
export type PricedProduct = {
  uuid: string;
  name: string;
  basePrice: string | null;
  replacementPrice: number;
  averagePurchasePrice: number;
  /**
   * The fixed settlement price in force today, or 0 when the article carries
   * none. A third basis a line's profit is reported against, beside APP and the
   * replacement price — the reference prints all three side by side.
   */
  fsp: number;
  priceUnit: string | null;
  revenueGroupUuid: string | null;
  /**
   * The catalogue weight figure and the unit that says how to read it. On the
   * reference these hold 7 850 and `M3` for a stainless plate — a density, not
   * a weight — so the two travel together and are only ever read through
   * productPieceWeightKg.
   */
  theoreticalWeight: string | null;
  weightUnit: SelectProducts["weightUnit"];
  /** The finished per-piece weight, when the product form has derived one. */
  weightTheoretical: string | null;
  /**
   * The other two bases the same product can be billed on. The reference keeps
   * three side by side — theoretical, trade and German — and the order's weight
   * type picks which one bills the line. Zero means the basis is not offered on
   * this product, not that it weighs nothing.
   */
  weightTrade: string | null;
  weightGerman: string | null;
  length: string | null;
  widthDiameter: string | null;
  thickness: string | null;
  minProfitMarginStock: string | null;
  minProfitMarginExWorks: string | null;
};

/**
 * Everything needed to price a document's lines: the products it names, the
 * customer's contract, and the agreed net prices under it.
 */
export type SalesPricingContext = {
  productByUuid: Map<string, PricedProduct>;
  contract: SelectContracts | undefined;
  netPriceRows: SelectContractNetPrices[];
};

export type ResolvedLinePrice = {
  grossPrice: number;
  groupDiscount: number;
  lineDiscount: number;
  netPrice: number;
};

/**
 * Loads the pricing context for a set of products under one contract.
 *
 * Quotes and orders both go through this, so a line cannot be priced one way on
 * the quote and another on the order it becomes — which was possible while each
 * document carried its own copy of this logic.
 */
export const loadSalesPricingContext = async (
  contractUuid: string | null,
  productUuids: string[],
): Promise<SalesPricingContext> => {
  if (productUuids.length === 0) {
    return {
      productByUuid: new Map(),
      contract: undefined,
      netPriceRows: [],
    };
  }

  const [products, contracts, netPriceRows, purchaseCosts, fspRows] =
    await Promise.all([
    db
      .select({
        uuid: Products.uuid,
        name: Products.name,
        basePrice: Products.basePrice,
        priceUnit: Products.priceUnit,
        revenueGroupUuid: Products.revenueGroupUuid,
        theoreticalWeight: Products.theoreticalWeight,
        weightUnit: Products.weightUnit,
        weightTheoretical: Products.weightTheoretical,
        weightTrade: Products.weightTrade,
        weightGerman: Products.weightGerman,
        length: Products.length,
        widthDiameter: Products.widthDiameter,
        thickness: Products.thickness,
        minProfitMarginStock: ProductGroups.minProfitMarginStock,
        minProfitMarginExWorks: ProductGroups.minProfitMarginExWorks,
      })
      .from(Products)
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .where(inArray(Products.uuid, productUuids)),

    contractUuid
      ? db
          .select()
          .from(Contracts)
          .where(eq(Contracts.uuid, contractUuid))
          .limit(1)
      : Promise.resolve([]),

    contractUuid
      ? db
          .select()
          .from(ContractNetPrices)
          .where(
            and(
              eq(ContractNetPrices.contractUuid, contractUuid),
              inArray(ContractNetPrices.productUuid, productUuids),
            ),
          )
      : Promise.resolve([]),

    loadPurchaseCostByProduct(productUuids),

    // The settlement price whose period covers today. Dated history rather than
    // a column, so a line priced now is measured against the figure in force
    // now — the same window `Order advice` reads for the replacement price.
    db
      .select({
        productUuid: ProductFspHistory.productUuid,
        fsp: ProductFspHistory.fsp,
        startDate: ProductFspHistory.startDate,
      })
      .from(ProductFspHistory)
      .where(
        and(
          inArray(ProductFspHistory.productUuid, productUuids),
          lte(ProductFspHistory.startDate, todayDateString()),
          or(
            isNull(ProductFspHistory.endDate),
            gte(ProductFspHistory.endDate, todayDateString()),
          ),
        ),
      )
      .orderBy(desc(ProductFspHistory.startDate)),
  ]);

  // Newest first, so the first row seen for a product is the one in force.
  const fspByProduct = new Map<string, number>();
  fspRows.forEach((row) => {
    if (!fspByProduct.has(row.productUuid)) {
      fspByProduct.set(row.productUuid, Number(row.fsp ?? 0));
    }
  });

  return {
    productByUuid: new Map(
      products.map((product) => {
        const cost = purchaseCosts.get(product.uuid) ?? EMPTY_PURCHASE_COST;
        return [
          product.uuid,
          {
            ...product,
            averagePurchasePrice: cost.averagePurchasePrice,
            fsp: fspByProduct.get(product.uuid) ?? 0,
            // What re-buying the article costs today is the last price a
            // supplier invoiced it at.
            replacementPrice: cost.lastPurchasePrice,
          },
        ];
      }),
    ),
    contract: contracts[0],
    netPriceRows,
  };
};

/**
 * The agreed net price for a product at a quantity, if the contract has one —
 * the highest tier the quantity actually reaches.
 */
const applicableNetPriceFor = (
  context: SalesPricingContext,
  productUuid: string,
  quantity: number,
): SelectContractNetPrices | undefined =>
  context.netPriceRows
    .filter(
      (row) =>
        row.productUuid === productUuid && Number(row.fromQty ?? 0) <= quantity,
    )
    .sort((a, b) => Number(b.fromQty ?? 0) - Number(a.fromQty ?? 0))[0];

/**
 * Resolves what a customer pays for one line:
 *
 *   1. An agreed net price on the contract wins outright — it was negotiated,
 *      so no discount is layered on top of it.
 *   2. Otherwise the contract's gross price and its group + line discounts for
 *      that quantity apply, then the contract's extra discount.
 *   3. Otherwise the list price stands on its own.
 */
export const resolveLineNetPrice = (
  context: SalesPricingContext,
  productUuid: string,
  quantity: number,
): ResolvedLinePrice => {
  const product = context.productByUuid.get(productUuid);
  const basePrice = Number(product?.basePrice ?? 0);
  const replacementPrice = Number(product?.replacementPrice ?? 0);
  // A product with no sales price falls back to what it costs to re-buy, so a
  // line is never priced at zero merely because the price list is incomplete.
  const listPrice = basePrice > 0 ? basePrice : replacementPrice;

  const agreed = applicableNetPriceFor(context, productUuid, quantity);
  if (agreed) {
    return {
      grossPrice: listPrice,
      groupDiscount: 0,
      lineDiscount: 0,
      netPrice: Number(agreed.netPrice ?? 0),
    };
  }

  const { contract } = context;
  // A contract that is not about the price does not touch the price.
  //
  // Every contract in the reference declares what part of the build-up it
  // adjusts, and its ten rows use three of the six values we hold: `Certificaat
  // 3.1` is an **option**, `Toeslagen voor EU import` and `Pallet costs` are
  // **surcharges**, and only the rest restate a price. An options contract that
  // happened to carry a gross price would silently reprice the material, which
  // is not what anybody agreed to.
  //
  // A contract with no type recorded is left alone rather than assumed
  // harmless: that is the older data, and it priced lines before this column
  // existed.
  if (
    !contract ||
    contract.contractType === "options" ||
    contract.contractType === "surcharges"
  ) {
    return {
      grossPrice: listPrice,
      groupDiscount: 0,
      lineDiscount: 0,
      netPrice: listPrice,
    };
  }

  const grossPrice = contract.grossPrice
    ? Number(contract.grossPriceValue ?? 0) || listPrice
    : listPrice;
  const groupDiscount = contract.groupDiscount
    ? resolveTierDiscount(contract.groupDiscountTiers, quantity)
    : 0;
  const lineDiscount = contract.lineDiscount
    ? resolveTierDiscount(contract.lineDiscountTiers, quantity)
    : 0;
  const extraDiscount = contract.extraDiscount
    ? Number(contract.extraDiscountValue ?? 0)
    : 0;

  return {
    grossPrice,
    groupDiscount,
    lineDiscount,
    netPrice:
      applyPriceDiscounts(grossPrice, groupDiscount, lineDiscount) *
      (1 - extraDiscount / 100),
  };
};

/**
 * The margin floor a line is held to. A pick-up line is sold ex works, so it is
 * measured against the ex-works floor; anything delivered from stock is held to
 * the stock floor.
 */
export const minimumMarginFor = (
  product: PricedProduct | undefined,
  isPickup: boolean,
): number =>
  Number(
    (isPickup
      ? product?.minProfitMarginExWorks
      : product?.minProfitMarginStock) ?? 0,
  );
