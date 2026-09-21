"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { FollowUps, SelectFollowUps } from "@/db/schema/follow-ups";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  QuoteItemOptions,
  SelectQuoteItemOptions,
} from "@/db/schema/quote-item-options";
import { QuoteItems, SelectQuoteItems } from "@/db/schema/quote-items";
import {
  InsertQuoteSurcharges,
  QuoteSurcharges,
  SelectQuoteSurcharges,
} from "@/db/schema/quote-surcharges";
import { InsertQuotes, Quotes, SelectQuotes } from "@/db/schema/quotes";
import { SalesOptions, SelectSalesOptions } from "@/db/schema/sales-options";
import { orderStatuses, StockUnit } from "@/lib/enums";
import {
  computeQuoteSummary,
  describeError,
  generateUuid,
  getQuoteVatRatePercent,
  moneyString,
  productPieceWeightKg,
  quoteLineFinancials,
  QuoteSummary,
  resolveSurchargeAmounts,
} from "@/lib/helpers";
import {
  loadSalesPricingContext,
  minimumMarginFor,
  resolveLineNetPrice,
} from "@/lib/server/sales-pricing";
import { invoicePaymentTerms } from "@/lib/enums";
import {
  booleanFilter,
  dateRangeFilter,
  enumFilter,
  numberRangeFilter,
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
import { QUOTE_COLUMNS } from "@/app/(dashboard)/quotes/columns";
import { exportRows } from "@/lib/server/excel";
import { and, count, desc, eq, getTableColumns, isNotNull } from "drizzle-orm";
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

// A surcharge row as the form submits it. `order` and `quoteUuid` are set on
// save — the sequence follows the order the rows were typed in — so neither is
// the caller's to supply.
export type QuoteSurchargeInput = Omit<
  InsertQuoteSurcharges,
  "id" | "uuid" | "quoteUuid" | "order" | "createdAt" | "updatedAt"
>;

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

export type QuoteSurchargeDetail = SelectQuoteSurcharges & {
  companyName: SelectCompanies["companyName"] | null;
};

export type QuoteDetail = SelectQuotes & {
  companyName: SelectCompanies["companyName"] | null;
  companyCalculatesVat: SelectCompanies["calculateVat"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  contractCode: SelectContracts["code"] | null;
  items: QuoteLineDetail[];
  options: QuoteOptionDetail[];
  surcharges: QuoteSurchargeDetail[];
  // Customer-scoped context the reference system shows alongside a quote.
  complaints: SelectComplaints[];
  followUps: SelectFollowUps[];
  // The customer's competitors, as free text on the company — the reference's
  // `Competitors` is a company column, not a contact's.
  competitors: SelectCompanies["competitors"];
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

const QUOTE_SEARCH = [
  Quotes.customerRef,
  Quotes.ourReference,
  Companies.companyName,
] as const;

const QUOTE_SORTABLE = {
  createdAt: Quotes.createdAt,
  quoteDate: Quotes.quoteDate,
  validUntil: Quotes.validUntil,
  customer: Companies.companyName,
  totalInclVat: Quotes.totalInclVat,
};

// A quote climbs the same ladder as an order — the reference's six quotes read
// `Provisional`, `Released` and `Expired` from the column its orders use — so
// expiry is a rung rather than a flag beside one. `expired` is kept alongside
// it because a live quote list is the point of the screen and a salesperson
// reaches for that question directly.
const QUOTE_FILTERS = {
  company: relationFilter(Quotes.companyUuid),
  status: enumFilter(Quotes.status, orderStatuses),
  paymentTerms: enumFilter(Quotes.paymentTerms, invoicePaymentTerms),
  quoteDate: dateRangeFilter(Quotes.quoteDate),
  validUntil: dateRangeFilter(Quotes.validUntil),
  total: numberRangeFilter(Quotes.totalInclVat),
  expired: booleanFilter(Quotes.expired),
};

/** The rows one view of the quotes overview selects, as a window onto them. */
const quoteRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<QuoteListItem[]> =>
    db
      .select({
        ...getTableColumns(Quotes),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(Quotes)
      .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Quotes.contactUuid, Contacts.uuid))
      .where(
        tableWhere({ query, search: QUOTE_SEARCH, filters: QUOTE_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          QUOTE_SORTABLE,
          query,
          [desc(Quotes.createdAt)],
          Quotes.id,
        ),
      )
      .limit(limit)
      .offset(offset);

export const getQuotes = async (
  query: TableQuery,
): Promise<Paged<QuoteListItem>> => {
  try {
    return await runPaged(query, {
      rows: quoteRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Quotes)
          .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
          .where(
            tableWhere({ query, search: QUOTE_SEARCH, filters: QUOTE_FILTERS }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch quotes"));
  }
};

/** Every quote the current view matches, as a workbook. */
export const exportQuotes = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Quotes",
    columns: QUOTE_COLUMNS,
    columnKeys,
    rows: quoteRows(parseTableQuery(params)),
  });

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

  const context = await loadSalesPricingContext(contractUuid, productUuids);

  const rows: PricedLine[] = [];

  for (const [index, item] of items.entries()) {
    const product = context.productByUuid.get(item.productUuid);
    if (!product) {
      throw new Error("A selected product could not be found.");
    }

    const quantity = Number(item.quantity);
    const replacementPrice = Number(product.replacementPrice ?? 0);
    const purchasePrice = Number(product.averagePurchasePrice ?? 0);

    const { grossPrice, groupDiscount, lineDiscount, netPrice } =
      resolveLineNetPrice(context, item.productUuid, quantity);

    const unit = item.unit ?? "st";
    // Running metres come off the line's own length when one was entered,
    // otherwise the product's catalogue length.
    const lengthMm = item.lengthMm ?? null;

    // A pick-up quote is priced ex works, so it is held to the ex-works margin
    // floor; anything delivered from stock is held to the stock floor.
    const effectiveLengthMm =
      lengthMm !== null && lengthMm > 0 ? lengthMm : Number(product.length ?? 0);
    const widthMm = Number(product.widthDiameter ?? 0);
    const thicknessMm = Number(product.thickness ?? 0);

    const financials = quoteLineFinancials({
      netPrice,
      quantity,
      purchasePrice,
      replacementPrice,
      fspPrice: product.fsp,
      // Never `product.theoreticalWeight` on its own: that column holds a
      // density when the product's weight unit says M3, and reading it as a
      // per-piece weight overstates the line by orders of magnitude.
      theoreticalWeight:
        productPieceWeightKg({
          weightTheoretical: product.weightTheoretical,
          theoreticalWeight: product.theoreticalWeight,
          weightUnit: product.weightUnit,
          lengthMm: effectiveLengthMm,
          widthMm,
          thicknessMm,
        }) ?? 0,
      lengthMm: effectiveLengthMm,
      widthMm,
      thicknessMm,
      priceUnit: product.priceUnit,
      minProfitMargin: minimumMarginFor(product, isPickup),
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
      grossPrice: moneyString(grossPrice),
      priceUnit: product.priceUnit ?? unit,
      groupDiscount: moneyString(groupDiscount),
      lineDiscount: moneyString(lineDiscount),
      netPrice: moneyString(netPrice),
      amount: moneyString(financials.amount),
      purchasePrice: moneyString(financials.purchasePrice),
      replacementPrice: moneyString(replacementPrice),
      costPrice: moneyString(financials.costPrice),
      costAmount: moneyString(financials.costAmount),
      profit: moneyString(financials.profit),
      profitReplPrice: moneyString(financials.profitReplPrice),
      profitFsp: moneyString(financials.profitFsp),
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
  materialsRevenue: moneyString(summary.materials.revenue),
  materialsProfit: moneyString(summary.materials.profit),
  materialsProfitReplPrice: moneyString(summary.materials.profitReplPrice),
  optionsRevenue: moneyString(summary.options.revenue),
  optionsProfit: moneyString(summary.options.profit),
  optionsProfitReplPrice: moneyString(summary.options.profitReplPrice),
  surchargesRevenue: moneyString(summary.surcharges.revenue),
  surchargesProfit: moneyString(summary.surcharges.profit),
  surchargesProfitReplPrice: moneyString(summary.surcharges.profitReplPrice),
  totalExclVat: moneyString(summary.total.revenue),
  vatAmount: moneyString(summary.vatAmount),
  totalInclVat: moneyString(summary.totalInclVat),
  avgKiloPrice: moneyString(summary.avgKiloPrice),
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
    | "calculateVatIfApplicable"
    | "transportCosts"
    | "handlingCosts"
    | "companyUuid"
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

// Surcharge rows ready to insert, numbered in the order they were typed so the
// grid reads back the way it was entered.
//
// The amount each row charges is resolved here from its own rate and the basis
// its description implies, measured against the lines the quote actually
// carries: a decoil surcharge per kilo of them, a project discount as a
// percentage of their value, an order surcharge once. The form only knows the
// rate, so it cannot do this itself.
const surchargeRows = (
  quoteUuid: string,
  surcharges: QuoteSurchargeInput[],
  lines: readonly { amount?: string | null; weightKg?: string | null }[],
): InsertQuoteSurcharges[] =>
  resolveSurchargeAmounts(surcharges, {
    goodsValue: lines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0),
    weightKg: lines.reduce((sum, line) => sum + Number(line.weightKg ?? 0), 0),
    lineCount: lines.length,
  }).map((surcharge, index) => ({
    ...surcharge,
    uuid: generateUuid(),
    quoteUuid,
    order: index + 1,
  }));

export const createQuote = async (
  fields: QuoteFields,
  items: QuoteLineInput[] = [],
  surcharges: QuoteSurchargeInput[] = [],
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

      if (surcharges.length > 0) {
        await tx
          .insert(QuoteSurcharges)
          .values(surchargeRows(uuid, surcharges, pricedLines));
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

  const [items, options, surcharges, complaints, followUps, [company]] =
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
        .leftJoin(
          SalesOptions,
          eq(QuoteItemOptions.optionUuid, SalesOptions.uuid),
        )
        .where(eq(QuoteItemOptions.quoteUuid, uuid)),
      db
        .select({
          ...getTableColumns(QuoteSurcharges),
          companyName: Companies.companyName,
        })
        .from(QuoteSurcharges)
        .leftJoin(Companies, eq(QuoteSurcharges.companyUuid, Companies.uuid))
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
        .select({ competitors: Companies.competitors })
        .from(Companies)
        .where(eq(Companies.uuid, quote.companyUuid))
        .limit(1),
    ]);

  return {
    ...quote,
    items,
    options,
    surcharges,
    complaints,
    followUps,
    competitors: company?.competitors || null,
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
  surcharges: QuoteSurchargeInput[] = [],
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
      await tx
        .delete(QuoteSurcharges)
        .where(eq(QuoteSurcharges.quoteUuid, uuid));

      if (pricedLines.length > 0) {
        await tx.insert(QuoteItems).values(pricedLines);
      }

      if (surcharges.length > 0) {
        await tx
          .insert(QuoteSurcharges)
          .values(surchargeRows(uuid, surcharges, pricedLines));
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

export const deleteQuote = async (uuid: string): Promise<QuoteActionResult> => {
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
