import "server-only";

import { db } from "@/db";
import {
  ContractNetPrices,
  SelectContractNetPrices,
} from "@/db/schema/contract-net-prices";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { ProductGroups } from "@/db/schema/product-groups";
import { Products } from "@/db/schema/products";
import { applyPriceDiscounts, resolveTierDiscount } from "@/lib/helpers";
import { and, eq, inArray } from "drizzle-orm";

/**
 * The product facts a sales line is priced and costed from. Loaded once per
 * document rather than per line, since a document usually repeats products.
 */
export type PricedProduct = {
  uuid: string;
  name: string;
  basePrice: string | null;
  replacementPrice: string | null;
  averagePurchasePrice: string | null;
  priceUnit: string | null;
  revenueGroupUuid: string | null;
  theoreticalWeight: string | null;
  length: string | null;
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

  const [products, contracts, netPriceRows] = await Promise.all([
    db
      .select({
        uuid: Products.uuid,
        name: Products.name,
        basePrice: Products.basePrice,
        replacementPrice: Products.replacementPrice,
        averagePurchasePrice: Products.averagePurchasePrice,
        priceUnit: Products.priceUnit,
        revenueGroupUuid: Products.revenueGroupUuid,
        theoreticalWeight: Products.theoreticalWeight,
        length: Products.length,
        minProfitMarginStock: ProductGroups.minProfitMarginStock,
        minProfitMarginExWorks: ProductGroups.minProfitMarginExWorks,
      })
      .from(Products)
      .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
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
  ]);

  return {
    productByUuid: new Map(products.map((product) => [product.uuid, product])),
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
  if (!contract) {
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
    (isPickup ? product?.minProfitMarginExWorks : product?.minProfitMarginStock) ??
      0,
  );
