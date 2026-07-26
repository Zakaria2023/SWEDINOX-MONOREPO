"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  ContractNetPrices,
  SelectContractNetPrices,
} from "@/db/schema/contract-net-prices";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { Products } from "@/db/schema/products";
import { QuoteItems } from "@/db/schema/quote-items";
import { InsertQuotes, Quotes, SelectQuotes } from "@/db/schema/quotes";
import { StockUnit } from "@/lib/enums";
import {
  describeError,
  applyPriceDiscounts,
  generateUuid,
  profitMarginPercent,
  resolveTierDiscount,
} from "@/lib/helpers";
import { and, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type QuoteFields = Omit<
  InsertQuotes,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

// A line the salesperson adds on the quote form. Price is NOT taken from here —
// it is resolved on the server from the price list and the customer's contract,
// so a quote can never be saved at a hand-typed price that bypasses the agreed
// terms.
export type QuoteLineInput = {
  productUuid: string;
  quantity: string;
  unit?: StockUnit;
  lengthMm?: number | null;
  widthMm?: number | null;
  thicknessMm?: string | null;
  options?: string | null;
};

export type QuoteActionResult = {
  quoteUuid?: string;
  error?: string;
  success?: boolean;
};

export type QuoteListItem = SelectQuotes & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

// One priced quote line, ready to insert. The price is derived, never supplied
// by the caller.
type PricedLine = typeof QuoteItems.$inferInsert;

export const getQuotes = async (): Promise<QuoteListItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(Quotes),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(Quotes)
      .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Quotes.contactUuid, Contacts.uuid))
      .orderBy(desc(Quotes.createdAt));
    return rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch quotes"));
  }
};

// Resolves the price applied to one quote line: an agreed net price wins
// outright; otherwise the contract's gross price and tiered discounts apply;
// otherwise the list price stands on its own.
const resolveLinePricing = (
  listPrice: number,
  quantity: number,
  applicableNetPrice: SelectContractNetPrices | undefined,
  contract: SelectContracts | undefined,
): {
  grossPrice: number;
  groupDiscount: number;
  lineDiscount: number;
  netPrice: number;
} => {
  if (applicableNetPrice) {
    return {
      grossPrice: listPrice,
      groupDiscount: 0,
      lineDiscount: 0,
      netPrice: Number(applicableNetPrice.netPrice ?? 0),
    };
  }
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

// Prices the quote's lines against the price list and the customer's contract:
//
//   1. If the contract has an agreed net price for the product (the tier whose
//      threshold the quantity reaches), use it directly.
//   2. Otherwise take the product's base price (its fixed sales price /
//      marked-up replacement price) and apply the contract's group + line
//      discounts for that quantity, then the contract's extra discount.
//   3. Otherwise the base price stands on its own.
//
// Cost is always the product's replacement price, so profit and margin reflect
// what it costs to re-buy the goods today.
const priceQuoteLines = async (
  quoteUuid: string,
  contractUuid: string | null,
  isConsignment: boolean,
  reference: string | null,
  deliveryDate: string | null,
  items: QuoteLineInput[],
): Promise<PricedLine[]> => {
  const productUuids = items.map((item) => item.productUuid);
  if (productUuids.length === 0) {
    return [];
  }

  const products = await db
    .select({
      uuid: Products.uuid,
      name: Products.name,
      basePrice: Products.basePrice,
      replacementPrice: Products.replacementPrice,
      priceUnit: Products.priceUnit,
      stockUnit: Products.stockUnit,
      revenueGroupUuid: Products.revenueGroupUuid,
      theoreticalWeight: Products.theoreticalWeight,
    })
    .from(Products)
    .where(inArray(Products.uuid, productUuids));
  const productByUuid = new Map(products.map((p) => [p.uuid, p]));

  const [contract] = contractUuid
    ? await db
        .select()
        .from(Contracts)
        .where(eq(Contracts.uuid, contractUuid))
        .limit(1)
    : [];

  const netPriceRows = contractUuid
    ? await db
        .select()
        .from(ContractNetPrices)
        .where(
          and(
            eq(ContractNetPrices.contractUuid, contractUuid),
            inArray(ContractNetPrices.productUuid, productUuids),
          ),
        )
    : [];

  const rows: PricedLine[] = [];

  for (const [index, item] of items.entries()) {
    const product = productByUuid.get(item.productUuid);
    if (!product) {
      throw new Error("A selected product could not be found.");
    }

    const quantity = Number(item.quantity);
    const basePrice = Number(product.basePrice ?? 0);
    const replacementPrice = Number(product.replacementPrice ?? 0);
    const listPrice = basePrice > 0 ? basePrice : replacementPrice;

    // The agreed net price for this product at this quantity, if the contract
    // has one — the highest tier the quantity reaches.
    const applicableNetPrice = netPriceRows
      .filter(
        (row) =>
          row.productUuid === item.productUuid &&
          Number(row.fromQty ?? 0) <= quantity,
      )
      .sort((a, b) => Number(b.fromQty ?? 0) - Number(a.fromQty ?? 0))[0];

    const { grossPrice, groupDiscount, lineDiscount, netPrice } =
      resolveLinePricing(listPrice, quantity, applicableNetPrice, contract);

    const amount = netPrice * quantity;
    const costPrice = replacementPrice;
    const profit = amount - costPrice * quantity;
    const unit = item.unit ?? "st";
    const weightKg = quantity * Number(product.theoreticalWeight ?? 0);

    rows.push({
      uuid: generateUuid(),
      quoteUuid,
      productUuid: item.productUuid,
      revenueGroupUuid: product.revenueGroupUuid,
      lineNumber: index + 1,
      lineType: "material",
      description: product.name,
      reference,
      deliveryDate,
      lengthMm: item.lengthMm ?? null,
      widthMm: item.widthMm ?? null,
      thicknessMm: item.thicknessMm ?? null,
      quantity: quantity.toFixed(3),
      unit,
      weightKg: weightKg.toFixed(2),
      grossPrice: grossPrice.toFixed(2),
      priceUnit: product.priceUnit ?? unit,
      groupDiscount: groupDiscount.toFixed(2),
      lineDiscount: lineDiscount.toFixed(2),
      netPrice: netPrice.toFixed(2),
      amount: amount.toFixed(2),
      costPrice: costPrice.toFixed(2),
      profit: profit.toFixed(2),
      profitMargin: profitMarginPercent(amount, profit).toFixed(2),
      isConsignment,
      options: item.options ?? null,
    });
  }

  return rows;
};

export const createQuote = async (
  fields: QuoteFields,
  items: QuoteLineInput[] = [],
): Promise<QuoteActionResult> => {
  const uuid = generateUuid();
  try {
    const reference = fields.customerRef ?? null;
    const deliveryDate =
      fields.deliveryDate instanceof Date
        ? fields.deliveryDate.toISOString().slice(0, 10)
        : (fields.deliveryDate ?? null);

    const pricedLines = await priceQuoteLines(
      uuid,
      fields.contractUuid ?? null,
      fields.isConsignment ?? false,
      reference,
      deliveryDate,
      items,
    );

    await db.transaction(async (tx) => {
      await tx.insert(Quotes).values({ ...fields, uuid });

      if (pricedLines.length > 0) {
        await tx.insert(QuoteItems).values(pricedLines);

        // Roll the priced lines up into the header's summary snapshot so the
        // quote list shows totals that match its lines.
        const revenue = pricedLines.reduce(
          (sum, line) => sum + Number(line.amount ?? 0),
          0,
        );
        const profit = pricedLines.reduce(
          (sum, line) => sum + Number(line.profit ?? 0),
          0,
        );
        const weight = pricedLines.reduce(
          (sum, line) => sum + Number(line.weightKg ?? 0),
          0,
        );

        await tx
          .update(Quotes)
          .set({
            materialsRevenue: revenue.toFixed(2),
            materialsProfit: profit.toFixed(2),
            totalExclVat: revenue.toFixed(2),
            vatAmount: "0.00",
            totalInclVat: revenue.toFixed(2),
            totalWeightKg: weight.toFixed(2),
            avgKiloPrice: (weight === 0 ? 0 : revenue / weight).toFixed(2),
          })
          .where(eq(Quotes.uuid, uuid));
      }
    });

    revalidatePath("/quotes");
    revalidatePath("/quote-lines");
    return { success: true, quoteUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create quote",
    };
  }
};
