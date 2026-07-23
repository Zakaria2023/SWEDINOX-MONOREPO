"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { Contracts } from "@/db/schema/contracts";
import { FollowUps, SelectFollowUps } from "@/db/schema/follow-ups";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { QuoteItems, SelectQuoteItems } from "@/db/schema/quote-items";
import { Quotes, SelectQuotes } from "@/db/schema/quotes";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  applyPriceDiscounts,
  generateUuid,
  profitMarginPercent,
  resolveOrderTypeLabel,
} from "@/lib/helpers";
import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type QuoteLinePeriodFilter = { year?: number; month?: number };

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
  // Composed from the quote header's independent order-type flags.
  orderType: string;
  // Derived from the quote date so the overview can group by period.
  quoteMonth: number | null;
  quoteYear: number | null;
};

// The customer's main address city — a scalar subquery rather than a join, so a
// company with several addresses can't multiply its quote lines.
const customerCity = sql<
  string | null
>`(SELECT ${CompanyAddresses.city} FROM ${CompanyAddresses} WHERE ${CompanyAddresses.companyUuid} = ${Companies.uuid} ORDER BY ${CompanyAddresses.sequenceNumber} ASC LIMIT 1)`;

const lastFollowUpDate = sql<
  string | null
>`(SELECT ${FollowUps.date} FROM ${FollowUps} WHERE ${FollowUps.companyUuid} = ${Companies.uuid} ORDER BY ${FollowUps.date} DESC LIMIT 1)`;

const lastFollowUpText = sql<
  string | null
>`(SELECT ${FollowUps.text} FROM ${FollowUps} WHERE ${FollowUps.companyUuid} = ${Companies.uuid} ORDER BY ${FollowUps.date} DESC LIMIT 1)`;

const lastFollowUpBy = sql<
  string | null
>`(SELECT ${FollowUps.by} FROM ${FollowUps} WHERE ${FollowUps.companyUuid} = ${Companies.uuid} ORDER BY ${FollowUps.date} DESC LIMIT 1)`;

// Every quote line, joined to its quote, customer, product and revenue group.
// Filtered on the quote date, matching the legacy overview's date range.
export const getQuoteLines = async (
  filter: QuoteLinePeriodFilter = {},
): Promise<QuoteLineRow[]> => {
  try {
    const year = sql<number>`YEAR(${Quotes.quoteDate})`;
    const month = sql<number>`MONTH(${Quotes.quoteDate})`;

    const rows = await db
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
      .leftJoin(Orders, eq(QuoteItems.convertedToOrderUuid, Orders.uuid))
      .where(
        and(
          filter.year ? eq(year, filter.year) : undefined,
          filter.month ? eq(month, filter.month) : undefined,
        ),
      )
      .orderBy(desc(Quotes.quoteDate), asc(QuoteItems.lineNumber));

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
      orderType: resolveOrderTypeLabel(rest),
      quoteMonth: rest.quoteMonth === null ? null : Number(rest.quoteMonth),
      quoteYear: rest.quoteYear === null ? null : Number(rest.quoteYear),
    }));
  } catch {
    throw new Error("Failed to fetch quote lines");
  }
};

export type QuoteLineActionResult = {
  error?: string;
  success?: boolean;
  createdLines?: number;
  orderUuid?: string;
};

// A quote's own gross price for a product is the price that product last
// actually sold for; failing that, its replacement price. Cost is always the
// replacement price — what it costs to re-buy the goods today.
type SourceLine = {
  productUuid: string;
  description: string | null;
  revenueGroupUuid: string | null;
  quantity: string;
  unit: SelectQuoteItems["unit"];
  lengthMm: number | null;
  widthMm: number | null;
  thicknessMm: string | null;
  weightKg: string;
  grossPrice: number;
  costPrice: number;
};

const priceLine = (
  line: SourceLine,
  groupDiscount: number,
  lineDiscount: number,
) => {
  const quantity = Number(line.quantity);
  const netPrice = applyPriceDiscounts(
    line.grossPrice,
    groupDiscount,
    lineDiscount,
  );
  const amount = netPrice * quantity;
  const profit = amount - line.costPrice * quantity;
  return {
    netPrice: netPrice.toFixed(2),
    amount: amount.toFixed(2),
    profit: profit.toFixed(2),
    profitMargin: profitMarginPercent(amount, profit).toFixed(2),
  };
};

// Fills quotes that have no lines yet. Lines come from what that customer has
// actually ordered before; a customer with no order history is quoted the
// standard product catalogue at quantity 1. Quotes that already have lines are
// skipped, so this can be re-run after adding more quotes.
export const generateQuoteLines = async (): Promise<QuoteLineActionResult> => {
  try {
    const quotes = await db
      .select({
        uuid: Quotes.uuid,
        companyUuid: Quotes.companyUuid,
        customerRef: Quotes.customerRef,
        deliveryDate: sql<
          string | null
        >`DATE_FORMAT(${Quotes.deliveryDate}, '%Y-%m-%d')`,
        isConsignment: Quotes.isConsignment,
      })
      .from(Quotes);
    if (quotes.length === 0) {
      return { error: "No quotes yet. Create one first." };
    }

    const existing = await db
      .select({ quoteUuid: QuoteItems.quoteUuid })
      .from(QuoteItems);
    const quotesWithLines = new Set(existing.map((row) => row.quoteUuid));

    const emptyQuotes = quotes.filter(
      (quote) => !quotesWithLines.has(quote.uuid),
    );
    if (emptyQuotes.length === 0) {
      return { error: "Every quote already has lines." };
    }

    const rows: (typeof QuoteItems.$inferInsert)[] = [];

    for (const quote of emptyQuotes) {
      const orderedLines = await db
        .select({
          productUuid: OrderItems.productUuid,
          quantity: OrderItems.quantity,
          unit: OrderItems.unit,
          lengthMm: OrderItems.lengthMm,
          widthMm: OrderItems.widthMm,
          thicknessMm: OrderItems.thicknessMm,
          weightKg: OrderItems.kgPlanned,
          grossPrice: OrderItems.grossPrice,
          priceUnit: OrderItems.priceUnit,
          productName: Products.name,
          revenueGroupUuid: Products.revenueGroupUuid,
          replacementPrice: Products.replacementPrice,
        })
        .from(OrderItems)
        .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
        .where(eq(Orders.companyUuid, quote.companyUuid));

      const sourceLines: SourceLine[] =
        orderedLines.length > 0
          ? orderedLines.map((line) => ({
              productUuid: line.productUuid,
              description: line.productName,
              revenueGroupUuid: line.revenueGroupUuid,
              quantity: line.quantity,
              unit: line.unit,
              lengthMm: line.lengthMm,
              widthMm: line.widthMm,
              thicknessMm: line.thicknessMm,
              weightKg: line.weightKg ?? "0.00",
              grossPrice:
                Number(line.grossPrice ?? 0) > 0
                  ? Number(line.grossPrice)
                  : Number(line.replacementPrice ?? 0),
              costPrice: Number(line.replacementPrice ?? 0),
            }))
          : (
              await db
                .select({
                  uuid: Products.uuid,
                  name: Products.name,
                  revenueGroupUuid: Products.revenueGroupUuid,
                  length: Products.length,
                  widthDiameter: Products.widthDiameter,
                  thickness: Products.thickness,
                  theoreticalWeight: Products.theoreticalWeight,
                  replacementPrice: Products.replacementPrice,
                })
                .from(Products)
                .where(eq(Products.standardProduct, true))
            ).map((product) => ({
              productUuid: product.uuid,
              description: product.name,
              revenueGroupUuid: product.revenueGroupUuid,
              quantity: "1.000",
              unit: "st" as const,
              lengthMm: product.length === null ? null : Number(product.length),
              widthMm:
                product.widthDiameter === null
                  ? null
                  : Number(product.widthDiameter),
              thicknessMm: product.thickness,
              weightKg: Number(product.theoreticalWeight ?? 0).toFixed(2),
              grossPrice: Number(product.replacementPrice ?? 0),
              costPrice: Number(product.replacementPrice ?? 0),
            }));

      let lineNumber = 1;
      for (const line of sourceLines) {
        const priced = priceLine(line, 0, 0);
        rows.push({
          uuid: generateUuid(),
          quoteUuid: quote.uuid,
          productUuid: line.productUuid,
          revenueGroupUuid: line.revenueGroupUuid,
          lineNumber: lineNumber++,
          lineType: "material",
          description: line.description,
          reference: quote.customerRef,
          deliveryDate: quote.deliveryDate,
          quantity: line.quantity,
          unit: line.unit ?? "st",
          lengthMm: line.lengthMm,
          widthMm: line.widthMm,
          thicknessMm: line.thicknessMm,
          weightKg: line.weightKg,
          grossPrice: line.grossPrice.toFixed(2),
          priceUnit: line.unit ?? "st",
          costPrice: line.costPrice.toFixed(2),
          isConsignment: quote.isConsignment,
          ...priced,
        });
      }
    }

    if (rows.length === 0) {
      return {
        error:
          "Nothing to quote — the quote's customer has no order history and there are no standard products.",
      };
    }

    await db.insert(QuoteItems).values(rows);
    await refreshQuoteTotals(emptyQuotes.map((quote) => quote.uuid));

    revalidatePath("/quote-lines");
    revalidatePath("/quotes");
    return { success: true, createdLines: rows.length };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate quote lines",
    };
  }
};

// Rolls the quote lines up into the header's summary snapshot, so /quotes shows
// the same totals the lines add up to.
const refreshQuoteTotals = async (quoteUuids: string[]) => {
  for (const quoteUuid of quoteUuids) {
    const [totals] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${QuoteItems.amount}), 0)`,
        profit: sql<string>`COALESCE(SUM(${QuoteItems.profit}), 0)`,
        weight: sql<string>`COALESCE(SUM(${QuoteItems.weightKg}), 0)`,
      })
      .from(QuoteItems)
      .where(eq(QuoteItems.quoteUuid, quoteUuid));

    const revenue = Number(totals?.revenue ?? 0);
    const weight = Number(totals?.weight ?? 0);

    await db
      .update(Quotes)
      .set({
        materialsRevenue: revenue.toFixed(2),
        materialsProfit: Number(totals?.profit ?? 0).toFixed(2),
        totalExclVat: revenue.toFixed(2),
        vatAmount: "0.00",
        totalInclVat: revenue.toFixed(2),
        totalWeightKg: weight.toFixed(2),
        avgKiloPrice: (weight === 0 ? 0 : revenue / weight).toFixed(2),
      })
      .where(eq(Quotes.uuid, quoteUuid));
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
      let remaining = Number(item.quantity ?? 0);
      if (remaining <= 0) {
        continue;
      }

      const lots = await db
        .select()
        .from(Stock)
        .where(
          and(
            eq(Stock.productUuid, item.productUuid),
            eq(Stock.status, "pending"),
            eq(Stock.blocked, false),
          ),
        )
        .orderBy(asc(Stock.receiptDate), asc(Stock.id));

      for (const lot of lots) {
        if (remaining <= 0) {
          break;
        }
        const alreadyTaken = takenPerLot.get(lot.uuid) ?? 0;
        const free =
          Number(lot.quantity) - Number(lot.reservedQuantity) - alreadyTaken;
        if (free <= 0) {
          continue;
        }
        const take = Math.min(free, remaining);
        allocations.push({ line: item, stock: lot, quantity: take });
        takenPerLot.set(lot.uuid, alreadyTaken + take);
        remaining -= take;
      }

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
        priceDate: quote.priceDate,
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

      let lineNumber = 0;
      for (const allocation of allocations) {
        lineNumber += 1;
        const quantity = allocation.quantity.toFixed(3);
        const nextReserved = (
          Number(allocation.stock.reservedQuantity) + allocation.quantity
        ).toFixed(3);

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

        await tx.insert(OrderItems).values({
          uuid: generateUuid(),
          orderUuid,
          stockUuid: allocation.stock.uuid,
          productUuid: allocation.stock.productUuid,
          quantity,
          qtyPlanned: quantity,
          qtyReserved: quantity,
          lineNumber,
          status: "reserved",
          lineType: allocation.line.lineType,
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
          amount: (
            Number(allocation.line.netPrice ?? 0) * allocation.quantity
          ).toFixed(2),
        });
      }

      await tx
        .update(QuoteItems)
        .set({ convertedToOrderUuid: orderUuid, status: "released" })
        .where(eq(QuoteItems.quoteUuid, quoteUuid));
    });

    revalidatePath("/quote-lines");
    revalidatePath("/quotes");
    revalidatePath("/orders");
    revalidatePath("/stock");
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

export type ConvertibleQuote = {
  uuid: SelectQuotes["uuid"];
  quoteId: SelectQuotes["id"];
  customerName: SelectCompanies["companyName"] | null;
  lineCount: number;
};

// Quotes that have lines but have not been converted yet — the ones the
// "Convert to order" control can act on.
export const getConvertibleQuotes = async (): Promise<ConvertibleQuote[]> => {
  const rows = await db
    .select({
      uuid: Quotes.uuid,
      quoteId: Quotes.id,
      customerName: Companies.companyName,
      lineCount: sql<number>`COUNT(${QuoteItems.uuid})`,
    })
    .from(Quotes)
    .innerJoin(QuoteItems, eq(QuoteItems.quoteUuid, Quotes.uuid))
    .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
    .where(isNull(QuoteItems.convertedToOrderUuid))
    .groupBy(Quotes.uuid, Quotes.id, Companies.companyName)
    .orderBy(desc(Quotes.id));

  return rows.map((row) => ({ ...row, lineCount: Number(row.lineCount) }));
};
