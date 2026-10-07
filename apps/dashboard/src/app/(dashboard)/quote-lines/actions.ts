"use server";

import { Paged, TableQuery } from "@/lib/table-query";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { Contracts } from "@/db/schema/contracts";
import { FollowUps, SelectFollowUps } from "@/db/schema/follow-ups";
import {
  BranchSettings,
  SelectBranchSettings,
} from "@/db/schema/branch-settings";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { QuoteItems, SelectQuoteItems } from "@/db/schema/quote-items";
import { Quotes, SelectQuotes } from "@/db/schema/quotes";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { SelectStock, Stock } from "@/db/schema/stock";
import { Warehouses } from "@/db/schema/warehouses";
import {
  describeError,
  generateUuid,
  moneyString,
  NON_SELLABLE_LOCATION_TYPES,
  quoteLineFinancials,
  resolveOrderTypeLabel,
  sortLotsForDispatch,
  STOCK_QUANTITY_SCALE,
} from "@/lib/helpers";
import { buildOrderSummary } from "@/app/(dashboard)/orders/actions";
import { checkCredit } from "@/lib/server/credit-control";
import { writeSystemLog } from "@/lib/server/system-log";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  isNull,
  notInArray,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type QuoteLineRow = SelectQuoteItems & {
  quoteId: SelectQuotes["id"] | null;
  ourReference: SelectQuotes["ourReference"] | null;
  quoteDate: SelectQuotes["quoteDate"] | null;
  decisionDate: SelectQuotes["decisionDate"] | null;
  validUntil: SelectQuotes["validUntil"] | null;
  seller: SelectQuotes["seller"] | null;
  customerRef: SelectQuotes["customerRef"] | null;
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  representative: SelectCompanies["representative"] | null;
  city: SelectCompanyAddresses["city"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  convertedToOrderId: SelectOrders["id"] | null;
  lastFollowUpDate: SelectFollowUps["date"] | null;
  lastFollowUp: SelectFollowUps["text"] | null;
  lastFollowUpBy: SelectFollowUps["by"] | null;
  /** The branch's own legal name, from the settings. */
  affiliateName: SelectBranchSettings["affiliateName"];
  // Composed from the quote header's independent order-type flags.
  orderType: string;
  // Derived from the quote date so the overview can group by period.
  quoteMonth: number | null;
  quoteYear: number | null;
};

export type QuoteLineActionResult = {
  error?: string;
  success?: boolean;
  createdLines?: number;
  orderUuid?: string;
};

export type ConvertibleQuote = {
  uuid: SelectQuotes["uuid"];
  quoteId: SelectQuotes["id"];
  customerName: SelectCompanies["companyName"] | null;
  lineCount: number;
};

// The customer's main address city — a scalar subquery rather than a join, so a
// company with several addresses can't multiply its quote lines.
const customerCityRow = db
  .select({ city: CompanyAddresses.city })
  .from(CompanyAddresses)
  .where(eq(CompanyAddresses.companyUuid, Companies.uuid))
  .orderBy(asc(CompanyAddresses.sequenceNumber))
  .limit(1);

const customerCity = sql<string | null>`(${customerCityRow})`;

// The customer's most recent follow-up, one scalar subquery per printed field.
const lastFollowUpDateRow = db
  .select({ date: FollowUps.date })
  .from(FollowUps)
  .where(eq(FollowUps.companyUuid, Companies.uuid))
  .orderBy(desc(FollowUps.date))
  .limit(1);

const lastFollowUpDate = sql<string | null>`(${lastFollowUpDateRow})`;

const lastFollowUpTextRow = db
  .select({ text: FollowUps.text })
  .from(FollowUps)
  .where(eq(FollowUps.companyUuid, Companies.uuid))
  .orderBy(desc(FollowUps.date))
  .limit(1);

const lastFollowUpText = sql<string | null>`(${lastFollowUpTextRow})`;

const lastFollowUpByRow = db
  .select({ by: FollowUps.by })
  .from(FollowUps)
  .where(eq(FollowUps.companyUuid, Companies.uuid))
  .orderBy(desc(FollowUps.date))
  .limit(1);

const lastFollowUpBy = sql<string | null>`(${lastFollowUpByRow})`;

// Every quote line, joined to its quote, customer, product and revenue group.
//
// The overview and the detail screen show the same row, so they share one query
// and differ only in the filter applied. `where` is left off for the overview.
const selectQuoteLines = async (where?: SQL): Promise<QuoteLineRow[]> => {
  const year = sql<number>`YEAR(${Quotes.quoteDate})`;
  const month = sql<number>`MONTH(${Quotes.quoteDate})`;

  const base = db
    .select({
      item: QuoteItems,
      quoteId: Quotes.id,
      ourReference: Quotes.ourReference,
      quoteDate: Quotes.quoteDate,
      decisionDate: Quotes.decisionDate,
      validUntil: Quotes.validUntil,
      seller: Quotes.seller,
      customerRef: Quotes.customerRef,
      isPickup: Quotes.isPickup,
      isConsignment: Quotes.isConsignment,
      isIncidental: Quotes.isIncidental,
      isInternalProduction: Quotes.isInternalProduction,
      isCustomerMaterial: Quotes.isCustomerMaterial,
      customerCode: Companies.id,
      customerName: Companies.companyName,
      customerGroup: Companies.customerGroup,
      representative: Companies.representative,
      city: customerCity,
      productCode: Products.productCode,
      productName: Products.name,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      convertedToOrderId: Orders.id,
      lastFollowUpDate,
      lastFollowUp: lastFollowUpText,
      lastFollowUpBy,
      affiliateName: sql<string | null>`(
        SELECT ${BranchSettings.affiliateName} FROM ${BranchSettings} LIMIT 1
      )`,
      quoteMonth: month,
      quoteYear: year,
    })
    .from(QuoteItems)
    .innerJoin(Quotes, eq(QuoteItems.quoteUuid, Quotes.uuid))
    .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(QuoteItems.productUuid, Products.uuid))
    .leftJoin(
      RevenueGroups,
      eq(QuoteItems.revenueGroupUuid, RevenueGroups.uuid),
    )
    .leftJoin(Orders, eq(QuoteItems.convertedToOrderUuid, Orders.uuid));

  const rows = await (where ? base.where(where) : base).orderBy(
    desc(Quotes.quoteDate),
    asc(QuoteItems.lineNumber),
  );

  return rows.map(({ item, ...rest }) => ({
    ...item,
    quoteId: rest.quoteId,
    ourReference: rest.ourReference,
    quoteDate: rest.quoteDate,
    decisionDate: rest.decisionDate,
    validUntil: rest.validUntil,
    seller: rest.seller,
    customerRef: rest.customerRef,
    customerCode: rest.customerCode,
    customerName: rest.customerName,
    customerGroup: rest.customerGroup,
    representative: rest.representative,
    city: rest.city,
    productCode: rest.productCode,
    productName: rest.productName,
    revenueGroupNumber: rest.revenueGroupNumber,
    revenueGroupName: rest.revenueGroupName,
    convertedToOrderId: rest.convertedToOrderId,
    lastFollowUpDate: rest.lastFollowUpDate,
    lastFollowUp: rest.lastFollowUp,
    lastFollowUpBy: rest.lastFollowUpBy,
    affiliateName: rest.affiliateName,
    orderType: resolveOrderTypeLabel(rest),
    quoteMonth: rest.quoteMonth === null ? null : Number(rest.quoteMonth),
    quoteYear: rest.quoteYear === null ? null : Number(rest.quoteYear),
  }));
};

const allQuoteLines = async (): Promise<QuoteLineRow[]> => {
  try {
    return await selectQuoteLines();
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch quote lines"));
  }
};

/**
 * One quote line with its quote, customer, product, revenue group, the order it
 * was converted into, and the last follow-up recorded against the quote.
 */
export const getQuoteLineDetail = async (
  uuid: string,
): Promise<QuoteLineRow | null> => {
  try {
    const [row] = await selectQuoteLines(eq(QuoteItems.uuid, uuid));
    return row ?? null;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch quote line"));
  }
};

// Turns an accepted quote into a real order: each quote line is allocated
// against the pending stock lots for its product (oldest receipt first, which
// can span several lots), reserving the stock exactly the way the order form
// does. The quote's lines then point at the order they became, which is what
// the overview's "Converted to" column reads.
export const convertQuoteToOrder = async (
  quoteUuid: string,
): Promise<QuoteLineActionResult> => {
  try {
    const [quote] = await db
      .select()
      .from(Quotes)
      .where(eq(Quotes.uuid, quoteUuid))
      .limit(1);

    if (!quote) {
      return { error: "Quote not found." };
    }

    const lines = await db
      .select({
        item: QuoteItems,
        productCode: Products.productCode,
      })
      .from(QuoteItems)
      .leftJoin(Products, eq(QuoteItems.productUuid, Products.uuid))
      .where(eq(QuoteItems.quoteUuid, quoteUuid))
      .orderBy(asc(QuoteItems.lineNumber));

    if (lines.length === 0) {
      return { error: "This quote has no lines to convert." };
    }
    if (lines.some((line) => line.item.convertedToOrderUuid)) {
      return { error: "This quote has already been converted to an order." };
    }

    // Allocate every line against real stock before touching anything, so a
    // quote that can't be fully covered is rejected as a whole.
    type Allocation = {
      line: SelectQuoteItems;
      stock: SelectStock;
      quantity: number;
    };
    const allocations: Allocation[] = [];
    const takenPerLot = new Map<string, number>();

    for (const { item, productCode } of lines) {
      if (!item.productUuid) {
        return { error: `Quote line ${item.lineNumber} has no product.` };
      }
      const requested = Number(item.quantity ?? 0);
      if (requested <= 0) {
        continue;
      }

      // Only lots standing somewhere a sales order may draw from. Scrap,
      // inspection, the loading bay and a machine all hold real stock that is
      // spoken for or not yet approved; allocating from one of those would
      // promise a customer steel that is already somebody else's or not yet
      // passed.
      const openLots = await db
        .select({
          ...getTableColumns(Stock),
          dispatchStrategy: Products.batchDispatchStrategy,
        })
        .from(Stock)
        .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
        .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
        .where(
          and(
            eq(Stock.productUuid, item.productUuid),
            eq(Stock.status, "pending"),
            eq(Stock.blocked, false),
            or(
              isNull(Stock.locationUuid),
              isNull(Warehouses.locationType),
              notInArray(Warehouses.locationType, NON_SELLABLE_LOCATION_TYPES),
            ),
          ),
        );

      // Which lot goes first is the product's own dispatch strategy, which was
      // stored and never read: allocation always took the oldest receipt, so a
      // LIFO article was dispatched FIFO. Lots with no receipt date sort last
      // either way — an undated lot is not evidence of being the oldest.
      const lots = sortLotsForDispatch(openLots, openLots[0]?.dispatchStrategy);

      // Greedily take from the lots in that order, carrying the still-needed
      // quantity through the fold.
      const remaining = lots.reduce((left, lot) => {
        if (left <= 0) {
          return left;
        }
        const alreadyTaken = takenPerLot.get(lot.uuid) ?? 0;
        const free =
          Number(lot.quantity) - Number(lot.reservedQuantity) - alreadyTaken;
        if (free <= 0) {
          return left;
        }
        const take = Math.min(free, left);
        allocations.push({ line: item, stock: lot, quantity: take });
        takenPerLot.set(lot.uuid, alreadyTaken + take);
        return left - take;
      }, requested);

      if (remaining > 0) {
        return {
          error: `Not enough free stock for ${productCode ?? "the quoted product"} — ${remaining.toFixed(3)} short. Purchase or receive stock first.`,
        };
      }
    }

    if (allocations.length === 0) {
      return { error: "Every quote line has a zero quantity." };
    }

    const orderUuid = generateUuid();

    await db.transaction(async (tx) => {
      await tx.insert(Orders).values({
        uuid: orderUuid,
        companyUuid: quote.companyUuid,
        contactUuid: quote.contactUuid,
        customerRef: quote.customerRef,
        ourReference: quote.ourReference,
        seller: quote.seller,
        projectUuid: quote.projectUuid,
        // 🔑 The order is priced as of the day it was offered: `O106623`
        // carries price date 23-4-2026, the date of quote `Q300013`, though it
        // was created on the 24th (G4, 7-10-2026).
        priceDate: quote.priceDate ?? quote.quoteDate,
        // Carried over, as on the reference — `Telephone` on both.
        orderMethod: quote.requestMethod,
        deliveryTerms: quote.deliveryTerms,
        deliveryAddressUuid: quote.deliveryAddressUuid,
        billingAddressUuid: quote.billingAddressUuid,
        deliveryType: quote.deliveryType,
        deliveryDate: quote.deliveryDate,
        deliveryWeek: quote.deliveryWeek,
        deliveryYear: quote.deliveryYear,
        paymentTerms: quote.paymentTerms,
        isPickup: quote.isPickup,
        isConsignment: quote.isConsignment,
        isIncidental: quote.isIncidental,
        isInternalProduction: quote.isInternalProduction,
        isCustomerMaterial: quote.isCustomerMaterial,
        weightType: quote.weightType,
        // Both were being dropped on conversion, so an order made from a quote
        // came out more profitable than the quote that won it. They are costs
        // that earn nothing, and the reference prints them on the order's own
        // summary — watched on order 102191, 21-9-2026.
        transportCosts: quote.transportCosts,
        handlingCosts: quote.handlingCosts,
        remarks: quote.remarks,
      });

      // The order inherits the quote's contract the same way the order form
      // links one: the contract points at the order, not the other way round.
      if (quote.contractUuid) {
        await tx
          .update(Contracts)
          .set({ orderUuid })
          .where(eq(Contracts.uuid, quote.contractUuid));
      }

      for (const [index, allocation] of allocations.entries()) {
        const quantity = allocation.quantity.toFixed(3);
        const nextReserved = (
          Number(allocation.stock.reservedQuantity) + allocation.quantity
        ).toFixed(STOCK_QUANTITY_SCALE);

        // Guard: only reserve while the free quantity checked above is still
        // there, so a concurrent order can't oversell the lot.
        const [updateResult] = await tx
          .update(Stock)
          .set({ reservedQuantity: nextReserved })
          .where(
            and(
              eq(Stock.uuid, allocation.stock.uuid),
              eq(Stock.status, "pending"),
              gte(
                sql`(${Stock.quantity} - ${Stock.reservedQuantity})`,
                quantity,
              ),
            ),
          );

        if (updateResult.affectedRows === 0) {
          throw new Error(
            "Stock changed while converting — please refresh and try again.",
          );
        }

        // The quote priced this line from the product's average purchase price,
        // because no lot had been chosen yet. Now one has, so the order line is
        // costed against that lot's own valuation — which is why an order can
        // report a truer margin than the quote it came from, and why the two
        // figures legitimately differ.
        const financials = quoteLineFinancials({
          netPrice: Number(allocation.line.netPrice ?? 0),
          quantity: allocation.quantity,
          purchasePrice: Number(allocation.stock.valuationPrice ?? 0),
          replacementPrice: Number(allocation.line.replacementPrice ?? 0),
          // The quote line already stores a finished weight for its whole
          // quantity, so the per-piece figure is a division rather than a
          // catalogue lookup — no unit to interpret.
          theoreticalWeight:
            allocation.quantity === 0
              ? 0
              : Number(allocation.line.weightKg ?? 0) /
                Number(allocation.line.quantity ?? 1),
          lengthMm: allocation.line.lengthMm ?? 0,
          priceUnit: allocation.line.priceUnit,
          minProfitMargin: 0,
        });

        await tx.insert(OrderItems).values({
          uuid: generateUuid(),
          orderUuid,
          stockUuid: allocation.stock.uuid,
          productUuid: allocation.stock.productUuid,
          quantity,
          qtyPlanned: quantity,
          qtyReserved: quantity,
          kgPlanned: financials.weightKg.toFixed(2),
          lineNumber: index + 1,
          status: "reserved",
          lineType: allocation.line.lineType,
          sourceType: allocation.line.sourceType,
          seller: quote.seller,
          deliveryDate: allocation.line.deliveryDate,
          unit: allocation.line.unit,
          lengthMm: allocation.line.lengthMm,
          widthMm: allocation.line.widthMm,
          thicknessMm: allocation.line.thicknessMm,

          grossPrice: allocation.line.grossPrice,
          priceUnit: allocation.line.priceUnit,
          groupDiscount: allocation.line.groupDiscount,
          lineDiscount: allocation.line.lineDiscount,
          netPrice: allocation.line.netPrice,
          amount: moneyString(financials.amount),

          costPrice: financials.costPrice.toFixed(4),
          costAmount: moneyString(financials.costAmount),
          replacementPrice: allocation.line.replacementPrice,
          profit: moneyString(financials.profit),
          profitMargin: financials.profitMargin.toFixed(2),
          profitReplPrice: moneyString(financials.profitReplPrice),
        });
      }

      await tx
        .update(QuoteItems)
        .set({ convertedToOrderUuid: orderUuid, status: "released" })
        .where(eq(QuoteItems.quoteUuid, quoteUuid));

      // The quote's own life ends here: `Converted`, a terminal rung of its
      // own, beside `Expired`.
      await tx
        .update(Quotes)
        .set({ status: "converted" })
        .where(eq(Quotes.uuid, quoteUuid));

      const summary = await buildOrderSummary(tx, orderUuid, quote.companyUuid);

      // A converted quote is a new order and meets the same credit rule as one
      // typed by hand — see `createOrder`.
      const credit = await checkCredit(tx, {
        companyUuid: quote.companyUuid,
        orderAmount: Number(summary.totalExclVat),
        excludeOrderUuid: orderUuid,
      });

      await tx
        .update(Orders)
        .set({
          ...summary,
          ...(credit.reason ? { blockingReason: credit.reason } : {}),
          ...(credit.blocked
            ? { financialBlockage: true, financialBlockManual: false }
            : {}),
        })
        .where(eq(Orders.uuid, orderUuid));

      if (credit.blocked) {
        await writeSystemLog(tx, {
          category: "financial_block",
          message: `Order converted from a quote and held by the credit rule — ${credit.reason}`,
          orderUuid,
        });
      }
    });

    revalidatePath("/quote-lines");
    revalidatePath("/quotes");
    revalidatePath("/orders");
    return { success: true, orderUuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to convert the quote to an order",
    };
  }
};

// Quotes that have lines but have not been converted yet — the ones the
// "Convert to order" control can act on.
export const getConvertibleQuotes = async (): Promise<ConvertibleQuote[]> => {
  const rows = await db
    .select({
      uuid: Quotes.uuid,
      quoteId: Quotes.id,
      customerName: Companies.companyName,
      lineCount: count(QuoteItems.uuid),
    })
    .from(Quotes)
    .innerJoin(QuoteItems, eq(QuoteItems.quoteUuid, Quotes.uuid))
    .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
    .where(isNull(QuoteItems.convertedToOrderUuid))
    .groupBy(Quotes.uuid, Quotes.id, Companies.companyName)
    .orderBy(desc(Quotes.id));

  return rows.map((row) => ({ ...row, lineCount: Number(row.lineCount) }));
};

/**
 * One page of the list.
 *
 * The rows are read in full and then sliced, because this screen is built from
 * more than one query and the grain is settled in code rather than in SQL.
 * What it stops is the screen rendering every row it has ever had.
 */
export const getQuoteLines = async (
  query: TableQuery,
): Promise<Paged<QuoteLineRow>> => {
  const rows = await allQuoteLines();
  const term = query.q?.toLowerCase() ?? null;
  const matched = term
    ? rows.filter((row) =>
        Object.values(row as Record<string, unknown>).some(
          (value) =>
            typeof value === "string" && value.toLowerCase().includes(term),
        ),
      )
    : rows;
  const start = (query.page - 1) * query.pageSize;

  return {
    rows: matched.slice(start, start + query.pageSize),
    total: matched.length,
    page: query.page,
    pageSize: query.pageSize,
  };
};
