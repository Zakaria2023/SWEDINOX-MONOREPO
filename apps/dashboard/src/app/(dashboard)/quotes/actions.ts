"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { FollowUps, SelectFollowUps } from "@/db/schema/follow-ups";
import {
  ContractNetPrices,
  SelectContractNetPrices,
} from "@/db/schema/contract-net-prices";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  QuoteItemOptions,
  SelectQuoteItemOptions,
} from "@/db/schema/quote-item-options";
import { QuoteItems, SelectQuoteItems } from "@/db/schema/quote-items";
import {
  QuoteSurcharges,
  SelectQuoteSurcharges,
} from "@/db/schema/quote-surcharges";
import { InsertQuotes, Quotes, SelectQuotes } from "@/db/schema/quotes";
import { SalesOptions, SelectSalesOptions } from "@/db/schema/sales-options";
import { StockUnit } from "@/lib/enums";
import {
  describeError,
  applyPriceDiscounts,
  computeQuoteSummary,
  generateUuid,
  fullName,
  getQuoteVatRatePercent,
  quoteLineFinancials,
  QuoteSummary,
  resolveTierDiscount,
} from "@/lib/helpers";
import {
  and,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

// A line as the quote screen's grid renders it: the stored line plus the
// product details the grid's Code / Product / Category columns show.
export type QuoteLineDetail = SelectQuoteItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  productGroupName: SelectProductGroups["name"] | null;
  qualityStandard: SelectProductGroups["standardsQuality"] | null;
};

export type QuoteOptionDetail = SelectQuoteItemOptions & {
  optionCode: SelectSalesOptions["code"] | null;
  optionName: SelectSalesOptions["name"] | null;
};

// A competitor the customer's contacts have named. The schema records these as
// free text against a contact, so the quote screen lists who said what rather
// than inventing a revenue share the app has nowhere to store.
export type QuoteCompetitor = {
  contactUuid: SelectContacts["uuid"];
  contactName: string;
  competitors: NonNullable<SelectContacts["competitors"]>;
};

export type QuoteDetail = SelectQuotes & {
  companyName: SelectCompanies["companyName"] | null;
  companyCalculatesVat: SelectCompanies["calculateVat"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  contractCode: SelectContracts["code"] | null;
  items: QuoteLineDetail[];
  options: QuoteOptionDetail[];
  surcharges: SelectQuoteSurcharges[];
  // Customer-scoped context the reference system shows alongside a quote.
  complaints: SelectComplaints[];
  followUps: SelectFollowUps[];
  competitors: QuoteCompetitor[];
};

// One priced quote line, ready to insert. The price is derived, never supplied
// by the caller.
type PricedLine = typeof QuoteItems.$inferInsert;

type PriceQuoteLinesParams = {
  quoteUuid: string;
  contractUuid: string | null;
  isConsignment: boolean;
  isPickup: boolean;
  reference: string | null;
  deliveryDate: string | null;
  items: QuoteLineInput[];
};

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
// Each line is costed twice — against the average purchase price and against
// today's replacement price — so the summary can report profit both ways.
const priceQuoteLines = async ({
  quoteUuid,
  contractUuid,
  isConsignment,
  isPickup,
  reference,
  deliveryDate,
  items,
}: PriceQuoteLinesParams): Promise<PricedLine[]> => {
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
      averagePurchasePrice: Products.averagePurchasePrice,
      priceUnit: Products.priceUnit,
      stockUnit: Products.stockUnit,
      revenueGroupUuid: Products.revenueGroupUuid,
      theoreticalWeight: Products.theoreticalWeight,
      length: Products.length,
      minProfitMarginStock: ProductGroups.minProfitMarginStock,
      minProfitMarginExWorks: ProductGroups.minProfitMarginExWorks,
    })
    .from(Products)
    .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
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
    const purchasePrice = Number(product.averagePurchasePrice ?? 0);
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

    const unit = item.unit ?? "st";
    // Running metres come off the line's own length when one was entered,
    // otherwise the product's catalogue length.
    const lengthMm = item.lengthMm ?? null;

    // A pick-up quote is priced ex works, so it is held to the ex-works margin
    // floor; anything delivered from stock is held to the stock floor.
    const financials = quoteLineFinancials({
      netPrice,
      quantity,
      purchasePrice,
      replacementPrice,
      theoreticalWeight: Number(product.theoreticalWeight ?? 0),
      lengthMm:
        lengthMm !== null && lengthMm > 0
          ? lengthMm
          : Number(product.length ?? 0),
      minProfitMargin: Number(
        (isPickup
          ? product.minProfitMarginExWorks
          : product.minProfitMarginStock) ?? 0,
      ),
    });

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
      lengthMm,
      widthMm: item.widthMm ?? null,
      thicknessMm: item.thicknessMm ?? null,
      quantity: quantity.toFixed(3),
      unit,
      weightKg: financials.weightKg.toFixed(2),
      m1PerPiece: financials.m1PerPiece.toFixed(3),
      grossPrice: grossPrice.toFixed(2),
      priceUnit: product.priceUnit ?? unit,
      groupDiscount: groupDiscount.toFixed(2),
      lineDiscount: lineDiscount.toFixed(2),
      netPrice: netPrice.toFixed(2),
      amount: financials.amount.toFixed(2),
      purchasePrice: financials.purchasePrice.toFixed(2),
      replacementPrice: replacementPrice.toFixed(2),
      costPrice: financials.costPrice.toFixed(2),
      costAmount: financials.costAmount.toFixed(2),
      profit: financials.profit.toFixed(2),
      profitReplPrice: financials.profitReplPrice.toFixed(2),
      profitMargin: financials.profitMargin.toFixed(2),
      profitTooLow: financials.profitTooLow,
      isConsignment,
      options: item.options ?? null,
    });
  }

  return rows;
};

// Rolls the priced lines, options and surcharges into the header's summary
// snapshot. The quote screen renders the summary read-only from these columns,
// and the quotes overview shows totals that match the lines, without either
// having to re-aggregate.
const summaryFields = (summary: QuoteSummary) => ({
  materialsRevenue: summary.materials.revenue.toFixed(2),
  materialsProfit: summary.materials.profit.toFixed(2),
  materialsProfitReplPrice: summary.materials.profitReplPrice.toFixed(2),
  optionsRevenue: summary.options.revenue.toFixed(2),
  optionsProfit: summary.options.profit.toFixed(2),
  optionsProfitReplPrice: summary.options.profitReplPrice.toFixed(2),
  surchargesRevenue: summary.surcharges.revenue.toFixed(2),
  surchargesProfit: summary.surcharges.profit.toFixed(2),
  surchargesProfitReplPrice: summary.surcharges.profitReplPrice.toFixed(2),
  totalExclVat: summary.total.revenue.toFixed(2),
  vatAmount: summary.vatAmount.toFixed(2),
  totalInclVat: summary.totalInclVat.toFixed(2),
  avgKiloPrice: summary.avgKiloPrice.toFixed(2),
  totalWeightKg: summary.totalWeightKg.toFixed(2),
  theorWeightKg: summary.theoreticalWeightKg.toFixed(2),
});

// The summary for a quote as it currently stands in the database. Called after
// the lines have been written, so it always reflects what was actually saved.
const buildQuoteSummary = async (
  tx: Pick<typeof db, "select">,
  quoteUuid: string,
  header: Pick<
    SelectQuotes,
    "calculateVatIfApplicable" | "transportCosts" | "handlingCosts" | "companyUuid"
  >,
): Promise<QuoteSummary> => {
  const [lines, options, surcharges, [company]] = await Promise.all([
    tx.select().from(QuoteItems).where(eq(QuoteItems.quoteUuid, quoteUuid)),
    tx
      .select()
      .from(QuoteItemOptions)
      .where(eq(QuoteItemOptions.quoteUuid, quoteUuid)),
    tx
      .select()
      .from(QuoteSurcharges)
      .where(eq(QuoteSurcharges.quoteUuid, quoteUuid)),
    tx
      .select({ calculateVat: Companies.calculateVat })
      .from(Companies)
      .where(eq(Companies.uuid, header.companyUuid))
      .limit(1),
  ]);

  return computeQuoteSummary({
    lines: lines.map((line) => ({
      amount: Number(line.amount ?? 0),
      costAmount: Number(line.costAmount ?? 0),
      replacementCost:
        Number(line.replacementPrice ?? 0) * Number(line.quantity ?? 0),
      // Nothing has been picked for a quote, so there is no weighed weight to
      // report yet: the line's weight is the theoretical one, and the summary's
      // two weight figures legitimately agree until the goods are allocated.
      weightKg: Number(line.weightKg ?? 0),
      theoreticalWeightKg: Number(line.weightKg ?? 0),
    })),
    options: options.map((option) => ({
      amount: Number(option.amount ?? 0),
      cost: Number(option.cost ?? 0),
    })),
    surcharges: surcharges.map((surcharge) => ({
      amount: Number(surcharge.amount ?? 0),
      profit: Number(surcharge.profit ?? 0),
    })),
    transportCosts: Number(header.transportCosts ?? 0),
    handlingCosts: Number(header.handlingCosts ?? 0),
    vatRatePercent: getQuoteVatRatePercent(
      header.calculateVatIfApplicable,
      company?.calculateVat,
    ),
  });
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

    const pricedLines = await priceQuoteLines({
      quoteUuid: uuid,
      contractUuid: fields.contractUuid ?? null,
      isConsignment: fields.isConsignment ?? false,
      isPickup: fields.isPickup ?? false,
      reference,
      deliveryDate,
      items,
    });

    await db.transaction(async (tx) => {
      await tx.insert(Quotes).values({ ...fields, uuid });

      if (pricedLines.length > 0) {
        await tx.insert(QuoteItems).values(pricedLines);
      }

      const summary = await buildQuoteSummary(tx, uuid, {
        companyUuid: fields.companyUuid,
        calculateVatIfApplicable: fields.calculateVatIfApplicable ?? false,
        transportCosts: fields.transportCosts ?? "0.00",
        handlingCosts: fields.handlingCosts ?? "0.00",
      });

      await tx
        .update(Quotes)
        .set(summaryFields(summary))
        .where(eq(Quotes.uuid, uuid));
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

export const getQuoteDetail = async (
  uuid: string,
): Promise<QuoteDetail | null> => {
  const [quote] = await db
    .select({
      ...getTableColumns(Quotes),
      companyName: Companies.companyName,
      companyCalculatesVat: Companies.calculateVat,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      contractCode: Contracts.code,
    })
    .from(Quotes)
    .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(Quotes.contactUuid, Contacts.uuid))
    .leftJoin(Contracts, eq(Quotes.contractUuid, Contracts.uuid))
    .where(eq(Quotes.uuid, uuid))
    .limit(1);

  if (!quote) {
    return null;
  }

  const [items, options, surcharges, complaints, followUps, contacts] =
    await Promise.all([
    db
      .select({
        ...getTableColumns(QuoteItems),
        productCode: Products.productCode,
        productName: Products.name,
        productGroupName: ProductGroups.name,
        qualityStandard: ProductGroups.standardsQuality,
      })
      .from(QuoteItems)
      .leftJoin(Products, eq(QuoteItems.productUuid, Products.uuid))
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .where(eq(QuoteItems.quoteUuid, uuid))
      .orderBy(QuoteItems.lineNumber),
    db
      .select({
        ...getTableColumns(QuoteItemOptions),
        optionCode: SalesOptions.code,
        optionName: SalesOptions.name,
      })
      .from(QuoteItemOptions)
      .leftJoin(SalesOptions, eq(QuoteItemOptions.optionUuid, SalesOptions.uuid))
      .where(eq(QuoteItemOptions.quoteUuid, uuid)),
    db
      .select()
      .from(QuoteSurcharges)
      .where(eq(QuoteSurcharges.quoteUuid, uuid))
      .orderBy(QuoteSurcharges.order),
      db
        .select()
        .from(Complaints)
        .where(eq(Complaints.companyUuid, quote.companyUuid))
        .orderBy(desc(Complaints.createdAt)),
      db
        .select()
        .from(FollowUps)
        .where(
          and(
            eq(FollowUps.companyUuid, quote.companyUuid),
            eq(FollowUps.completed, false),
          ),
        )
        .orderBy(desc(FollowUps.createdAt)),
      db
        .select({
          uuid: Contacts.uuid,
          firstName: Contacts.firstName,
          lastName: Contacts.lastName,
          competitors: Contacts.competitors,
        })
        .from(Contacts)
        .where(
          and(
            eq(Contacts.companyUuid, quote.companyUuid),
            isNotNull(Contacts.competitors),
          ),
        ),
    ]);

  return {
    ...quote,
    items,
    options,
    surcharges,
    complaints,
    followUps,
    competitors: contacts
      .filter((contact) => Boolean(contact.competitors))
      .map((contact) => ({
        contactUuid: contact.uuid,
        contactName:
          fullName(contact.firstName, contact.lastName) || contact.uuid,
        competitors: contact.competitors ?? "",
      })),
  };
};

// Rewrites the quote header and re-prices its lines from scratch. Lines are
// replaced rather than patched: the price a line carries depends on the
// contract and quantity of the quote as a whole, so editing the header can move
// every line's price and re-pricing all of them is the only consistent result.
export const updateQuote = async (
  uuid: string,
  fields: QuoteFields,
  items: QuoteLineInput[] = [],
): Promise<QuoteActionResult> => {
  try {
    const [existing] = await db
      .select({ uuid: Quotes.uuid })
      .from(Quotes)
      .where(eq(Quotes.uuid, uuid))
      .limit(1);

    if (!existing) {
      return { error: "Quote not found." };
    }

    // A line that has already become an order line is no longer the quote's to
    // reprice — the order it produced would silently disagree with it.
    const convertedLines = await db
      .select({ uuid: QuoteItems.uuid })
      .from(QuoteItems)
      .where(
        and(
          eq(QuoteItems.quoteUuid, uuid),
          isNotNull(QuoteItems.convertedToOrderUuid),
        ),
      )
      .limit(1);

    if (convertedLines.length > 0) {
      return {
        error:
          "Cannot edit: some lines on this quote have already been converted to an order.",
      };
    }

    const reference = fields.customerRef ?? null;
    const deliveryDate =
      fields.deliveryDate instanceof Date
        ? fields.deliveryDate.toISOString().slice(0, 10)
        : (fields.deliveryDate ?? null);

    const pricedLines = await priceQuoteLines({
      quoteUuid: uuid,
      contractUuid: fields.contractUuid ?? null,
      isConsignment: fields.isConsignment ?? false,
      isPickup: fields.isPickup ?? false,
      reference,
      deliveryDate,
      items,
    });

    await db.transaction(async (tx) => {
      await tx.update(Quotes).set(fields).where(eq(Quotes.uuid, uuid));

      await tx
        .delete(QuoteItemOptions)
        .where(eq(QuoteItemOptions.quoteUuid, uuid));
      await tx.delete(QuoteItems).where(eq(QuoteItems.quoteUuid, uuid));

      if (pricedLines.length > 0) {
        await tx.insert(QuoteItems).values(pricedLines);
      }

      const summary = await buildQuoteSummary(tx, uuid, {
        companyUuid: fields.companyUuid,
        calculateVatIfApplicable: fields.calculateVatIfApplicable ?? false,
        transportCosts: fields.transportCosts ?? "0.00",
        handlingCosts: fields.handlingCosts ?? "0.00",
      });

      await tx
        .update(Quotes)
        .set(summaryFields(summary))
        .where(eq(Quotes.uuid, uuid));
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update quote",
    };
  }

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${uuid}`);
  revalidatePath("/quote-lines");
  redirect(`/quotes/${uuid}`);
};

export const deleteQuote = async (
  uuid: string,
): Promise<QuoteActionResult> => {
  try {
    const converted = await db
      .select({ uuid: QuoteItems.uuid })
      .from(QuoteItems)
      .where(
        and(
          eq(QuoteItems.quoteUuid, uuid),
          isNotNull(QuoteItems.convertedToOrderUuid),
        ),
      )
      .limit(1);

    if (converted.length > 0) {
      return {
        error:
          "Cannot delete: some lines on this quote have already been converted to an order.",
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(QuoteItemOptions)
        .where(eq(QuoteItemOptions.quoteUuid, uuid));
      await tx
        .delete(QuoteSurcharges)
        .where(eq(QuoteSurcharges.quoteUuid, uuid));
      await tx.delete(QuoteItems).where(eq(QuoteItems.quoteUuid, uuid));
      await tx.delete(Quotes).where(eq(Quotes.uuid, uuid));
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete quote",
    };
  }

  revalidatePath("/quotes");
  revalidatePath("/quote-lines");
  redirect("/quotes");
};
