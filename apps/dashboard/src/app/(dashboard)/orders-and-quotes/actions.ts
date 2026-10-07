"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectBranchSettings } from "@/db/schema/branch-settings";
import { CounterOrders } from "@/db/schema/counter-orders";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { QuoteItems } from "@/db/schema/quote-items";
import { Quotes } from "@/db/schema/quotes";
import { ReturnOrderItems } from "@/db/schema/return-order-items";
import { ReturnOrders } from "@/db/schema/return-orders";
import {
  describeError,
  documentProfitMarginPercent,
} from "@/lib/helpers";
import { ORDER_TYPE_LABELS, SALES_DOCUMENT_KIND_PREFIXES } from "@/lib/labels";
import { getBranchSettings } from "@/lib/server/branch-settings";
import { SalesDocumentKind } from "@/lib/enums";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { ORDER_OR_QUOTE_COLUMNS } from "@/app/(dashboard)/orders-and-quotes/columns";
import { desc, eq, sql } from "drizzle-orm";

// One row of the combined sales overview.
//
// The reference keeps four document series in this one grid and tells them
// apart only by the letter on the number: `O` orders, `R` return orders, `Q`
// quotes and `B` counter orders. They are four tables with four lifecycles
// here, so they are queried separately and merged rather than forced into a
// SQL UNION — a union would have to null-pad half its columns for whichever
// side each row came from anyway.
//
// A return comes through with negative revenue, weight and profit, which is
// why `profitMarginPercent` divides by the absolute revenue: dividing a
// negative profit by a negative revenue would report a loss as a gain.
export type OrderOrQuoteRow = {
  uuid: string;
  kind: SalesDocumentKind;
  documentNumber: number;
  /** The number as the reference prints it — `O101450`, `R290012`. */
  documentCode: string;
  href: string;
  createdAt: Date;
  deliveryDate: string | null;
  lineCount: number;
  status: string | null;
  orderType: string;
  customerName: string | null;
  reference: string | null;
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  seller: string | null;
  convertedFromTo: string | null;
  quoteDate: string | null;
  decisionDate: string | null;
  validUntil: string | null;
  expirationReason: string | null;
  customerCode: number | null;
  companyUuid: string | null;
  /** The account's owner, which is not the seller who typed the document. */
  representative: string | null;
  orderMethod: string | null;
  ourReference: string | null;
  mustBeSent: boolean;
  deliberatelyNotSent: boolean;
  /** Printed, mailed or faxed at least once. */
  alreadySent: boolean;
  /** Still to be sent: meant to go, not held back, and not yet gone out. */
  stillToSend: boolean;
  isPickup: boolean;
  isIncidental: boolean;
  isConsignment: boolean;
  classification: SelectCompanies["classification"] | null;
  /** The branch's own legal name, from the settings. */
  affiliateName: SelectBranchSettings["affiliateName"];
};

const asDateString = (value: Date | string | null): string | null => {
  if (!value) {
    return null;
  }
  return typeof value === "string"
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
};

/**
 * Whether a document is still waiting to go out.
 *
 * The reference's `Send` column is true on 1 482 of its 2 091 rows, which is
 * exactly the must-send-and-not-held-back set of 1 709 less the 227 that had
 * already been printed, mailed or faxed.
 */
const stillToSendFrom = (row: {
  mustBeSent: boolean;
  deliberatelyNotSent: boolean;
  isPrinted?: boolean | null;
  isMailed?: boolean | null;
  isFaxed?: boolean | null;
}): boolean =>
  row.mustBeSent &&
  !row.deliberatelyNotSent &&
  !(row.isPrinted || row.isMailed || row.isFaxed);

const documentCodeFor = (kind: SalesDocumentKind, id: number): string =>
  `${SALES_DOCUMENT_KIND_PREFIXES[kind]}${id}`;

const allDocuments = async (): Promise<OrderOrQuoteRow[]> => {
  try {
    const { affiliateName } = await getBranchSettings(db);
    // Sequential rather than concurrent: this database caps connections, and
    // four large reads at once is how that cap gets hit.
    const [orderRows, quoteRows, returnRows, counterRows] = [
      await db
        .select({
          uuid: Orders.uuid,
          id: Orders.id,
          createdAt: Orders.createdAt,
          deliveryDate: Orders.deliveryDate,
          status: Orders.status,
          customerRef: Orders.customerRef,
          seller: Orders.seller,
          companyName: Companies.companyName,
          companyUuid: Companies.uuid,
          customerCode: Companies.id,
          representative: Companies.representative,
          classification: Companies.classification,
          orderMethod: Orders.orderMethod,
          ourReference: Orders.ourReference,
          mustBeSent: Orders.mustBeSent,
          deliberatelyNotSent: Orders.deliberatelyNotSent,
          isPrinted: Orders.isPrinted,
          isMailed: Orders.isMailed,
          isFaxed: Orders.isFaxed,
          isPickup: Orders.isPickup,
          headerOrderType: Orders.orderType,
          isIncidental: Orders.isIncidental,
          isConsignment: Orders.isConsignment,
          isInternalProduction: Orders.isInternalProduction,
          isCustomerMaterial: Orders.isCustomerMaterial,
          lineCount: sql<string>`COUNT(${OrderItems.uuid})`,
          // Revenue, profit and weight come off the order's own summary
          // snapshot, the same way a quote's do — the header records what the
          // document was worth when it was placed.
          revenue: Orders.totalExclVat,
          profit: Orders.materialsProfit,
          weightKg: Orders.totalWeightKg,
        })
        .from(Orders)
        .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
        .leftJoin(OrderItems, eq(OrderItems.orderUuid, Orders.uuid))
        .groupBy(Orders.uuid)
        .orderBy(desc(Orders.createdAt)),

      await db
        .select({
          uuid: Quotes.uuid,
          id: Quotes.id,
          createdAt: Quotes.createdAt,
          deliveryDate: Quotes.deliveryDate,
          customerRef: Quotes.customerRef,
          seller: Quotes.seller,
          quoteDate: Quotes.quoteDate,
          decisionDate: Quotes.decisionDate,
          validUntil: Quotes.validUntil,
          status: Quotes.status,
          expirationReason: Quotes.expirationReason,
          companyName: Companies.companyName,
          companyUuid: Companies.uuid,
          customerCode: Companies.id,
          representative: Companies.representative,
          classification: Companies.classification,
          orderMethod: Quotes.requestMethod,
          ourReference: Quotes.ourReference,
          mustBeSent: Quotes.mustBeSent,
          deliberatelyNotSent: Quotes.deliberatelyNotSent,
          isPrinted: Quotes.isPrinted,
          isMailed: Quotes.isMailed,
          isFaxed: Quotes.isFaxed,
          isPickup: Quotes.isPickup,
          isIncidental: Quotes.isIncidental,
          isConsignment: Quotes.isConsignment,
          isInternalProduction: Quotes.isInternalProduction,
          isCustomerMaterial: Quotes.isCustomerMaterial,
          // The quote header already stores its rolled-up summary, so revenue
          // and profit come straight off it rather than being re-aggregated.
          revenue: Quotes.totalExclVat,
          materialsProfit: Quotes.materialsProfit,
          weightKg: Quotes.totalWeightKg,
          lineCount: sql<string>`COUNT(${QuoteItems.uuid})`,
          convertedCount: sql<string>`COUNT(${QuoteItems.convertedToOrderUuid})`,
        })
        .from(Quotes)
        .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
        .leftJoin(QuoteItems, eq(QuoteItems.quoteUuid, Quotes.uuid))
        .groupBy(Quotes.uuid)
        .orderBy(desc(Quotes.createdAt)),

      await db
        .select({
          uuid: ReturnOrders.uuid,
          id: ReturnOrders.id,
          createdAt: ReturnOrders.createdAt,
          status: ReturnOrders.status,
          customerRef: ReturnOrders.customerRef,
          companyName: Companies.companyName,
          companyUuid: Companies.uuid,
          customerCode: Companies.id,
          representative: Companies.representative,
          classification: Companies.classification,
          ourReference: ReturnOrders.ourReference,
          mustBeSent: ReturnOrders.mustBeSent,
          deliberatelyNotSent: ReturnOrders.deliberatelyNotSent,
          isPrinted: ReturnOrders.isPrinted,
          isMailed: ReturnOrders.isMailed,
          isFaxed: ReturnOrders.isFaxed,
          isPickup: ReturnOrders.isPickup,
          revenue: ReturnOrders.totalExclVat,
          weightKg: ReturnOrders.totalWeightKg,
          lineCount: sql<string>`COUNT(${ReturnOrderItems.uuid})`,
          // A return header keeps no profit snapshot. Its lines carry an
          // `amount` and a `costPrice`, and the cost has to be measured
          // against the line's own price unit before the two can be
          // subtracted — so the profit is summed here rather than in SQL.
          amount: sql<string>`COALESCE(SUM(${ReturnOrderItems.amount}), 0)`,
          costAmount: sql<string>`COALESCE(SUM(${ReturnOrderItems.costPrice} * ${ReturnOrderItems.quantity}), 0)`,
        })
        .from(ReturnOrders)
        .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
        .leftJoin(
          ReturnOrderItems,
          eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
        )
        .groupBy(ReturnOrders.uuid)
        .orderBy(desc(ReturnOrders.createdAt)),

      await db
        .select({
          uuid: CounterOrders.uuid,
          id: CounterOrders.id,
          createdAt: CounterOrders.createdAt,
          deliveryDate: CounterOrders.deliveryDate,
          status: CounterOrders.status,
          customerRef: CounterOrders.customerRef,
          seller: CounterOrders.seller,
          companyName: Companies.companyName,
          companyUuid: Companies.uuid,
          customerCode: Companies.id,
          representative: Companies.representative,
          classification: Companies.classification,
          orderMethod: CounterOrders.orderMethod,
          ourReference: CounterOrders.ourReference,
          mustBeSent: CounterOrders.mustBeSent,
          deliberatelyNotSent: CounterOrders.deliberatelyNotSent,
          isPrinted: CounterOrders.isPrinted,
          isMailed: CounterOrders.isMailed,
          isFaxed: CounterOrders.isFaxed,
          isPickup: CounterOrders.isPickup,
          isIncidental: CounterOrders.isIncidental,
          revenue: CounterOrders.amountExVat,
          weightKg: CounterOrders.weightKg,
        })
        .from(CounterOrders)
        .leftJoin(Companies, eq(CounterOrders.companyUuid, Companies.uuid))
        .orderBy(desc(CounterOrders.createdAt)),
    ];

    const orders: OrderOrQuoteRow[] = orderRows.map((row) => {
      const revenue = Number(row.revenue ?? 0);
      const profit = Number(row.profit ?? 0);
      return {
        uuid: row.uuid,
        kind: "order",
        documentNumber: row.id,
        documentCode: documentCodeFor("order", row.id),
        href: `/orders/${row.uuid}`,
        createdAt: row.createdAt,
        deliveryDate: asDateString(row.deliveryDate),
        lineCount: Number(row.lineCount),
        status: row.status,
        // The header's own dropdown — `Normal` 2 069, `Call-off` 16, `Rush` 5 on
        // the reference's 2 091 — not the pick-up and consignment ticks.
        orderType: ORDER_TYPE_LABELS[row.headerOrderType],
        customerName: row.companyName,
        reference: row.customerRef,
        weightKg: Number(row.weightKg ?? 0),
        revenue,
        profit,
        profitMargin: documentProfitMarginPercent(revenue, profit),
        seller: row.seller,
        convertedFromTo: null,
        quoteDate: null,
        decisionDate: null,
        validUntil: null,
        expirationReason: null,
        customerCode: row.customerCode,
        companyUuid: row.companyUuid,
        representative: row.representative,
        classification: row.classification,
        affiliateName,
        mustBeSent: row.mustBeSent,
        deliberatelyNotSent: row.deliberatelyNotSent,
        alreadySent: Boolean(row.isPrinted || row.isMailed || row.isFaxed),
        stillToSend: stillToSendFrom(row),
        orderMethod: row.orderMethod,
        ourReference: row.ourReference,
        isPickup: row.isPickup ?? false,
        isIncidental: row.isIncidental ?? false,
        isConsignment: row.isConsignment ?? false,
      };
    });

    const quotes: OrderOrQuoteRow[] = quoteRows.map((row) => {
      const revenue = Number(row.revenue ?? 0);
      const profit = Number(row.materialsProfit ?? 0);
      const converted = Number(row.convertedCount);

      return {
        uuid: row.uuid,
        kind: "quote",
        documentNumber: row.id,
        documentCode: documentCodeFor("quote", row.id),
        href: `/quotes/${row.uuid}`,
        createdAt: row.createdAt,
        deliveryDate: asDateString(row.deliveryDate),
        lineCount: Number(row.lineCount),
        status: row.status,
        orderType: ORDER_TYPE_LABELS.normal,
        customerName: row.companyName,
        reference: row.customerRef,
        weightKg: Number(row.weightKg ?? 0),
        revenue,
        profit,
        profitMargin: documentProfitMarginPercent(revenue, profit),
        seller: row.seller,
        convertedFromTo:
          converted > 0 ? `Converted to order (${converted} lines)` : null,
        quoteDate: asDateString(row.quoteDate),
        decisionDate: asDateString(row.decisionDate),
        validUntil: asDateString(row.validUntil),
        expirationReason: row.expirationReason,
        customerCode: row.customerCode,
        companyUuid: row.companyUuid,
        representative: row.representative,
        classification: row.classification,
        affiliateName,
        mustBeSent: row.mustBeSent,
        deliberatelyNotSent: row.deliberatelyNotSent,
        alreadySent: Boolean(row.isPrinted || row.isMailed || row.isFaxed),
        stillToSend: stillToSendFrom(row),
        orderMethod: row.orderMethod,
        ourReference: row.ourReference,
        isPickup: row.isPickup ?? false,
        isIncidental: row.isIncidental ?? false,
        isConsignment: row.isConsignment ?? false,
      };
    });

    // Returns carry their money negative — revenue, weight and profit alike.
    // Every row the reference shows with a negative revenue is a return, and
    // every one of those has a weight of zero or less.
    const returns: OrderOrQuoteRow[] = returnRows.map((row) => {
      const revenue = -Math.abs(Number(row.revenue ?? 0));
      // Credit given back, less what the goods cost to take back. Both come
      // off the lines negative, so the difference keeps its own sign — and a
      // return can show a positive profit, which is what the reference's
      // R290002, R290014, R290033 and R290044 do: the metal was credited for
      // less than it cost.
      const profit =
        -Math.abs(Number(row.amount ?? 0)) +
        Math.abs(Number(row.costAmount ?? 0));
      return {
        uuid: row.uuid,
        kind: "return",
        documentNumber: row.id,
        documentCode: documentCodeFor("return", row.id),
        href: `/return-orders/${row.uuid}`,
        createdAt: row.createdAt,
        deliveryDate: null,
        lineCount: Number(row.lineCount),
        status: row.status,
        orderType: "Normal",
        customerName: row.companyName,
        reference: row.customerRef,
        weightKg: -Math.abs(Number(row.weightKg ?? 0)),
        revenue,
        profit,
        profitMargin: documentProfitMarginPercent(revenue, profit),
        seller: null,
        convertedFromTo: null,
        quoteDate: null,
        decisionDate: null,
        validUntil: null,
        expirationReason: null,
        customerCode: row.customerCode,
        companyUuid: row.companyUuid,
        representative: row.representative,
        classification: row.classification,
        affiliateName,
        mustBeSent: row.mustBeSent,
        deliberatelyNotSent: row.deliberatelyNotSent,
        alreadySent: Boolean(row.isPrinted || row.isMailed || row.isFaxed),
        stillToSend: stillToSendFrom(row),
        // A return is raised against goods already delivered, so it has no
        // order method of its own.
        orderMethod: null,
        ourReference: row.ourReference,
        isPickup: row.isPickup ?? false,
        isIncidental: false,
        isConsignment: false,
      };
    });

    const counterOrders: OrderOrQuoteRow[] = counterRows.map((row) => {
      const revenue = Number(row.revenue ?? 0);
      return {
        uuid: row.uuid,
        kind: "counter_order",
        documentNumber: row.id,
        documentCode: documentCodeFor("counter_order", row.id),
        href: `/counter-orders/${row.uuid}`,
        createdAt: row.createdAt,
        deliveryDate: asDateString(row.deliveryDate),
        lineCount: 0,
        status: row.status,
        orderType: "Normal",
        customerName: row.companyName,
        reference: row.customerRef,
        weightKg: Number(row.weightKg ?? 0),
        revenue,
        profit: 0,
        profitMargin: documentProfitMarginPercent(revenue, 0),
        seller: row.seller,
        convertedFromTo: null,
        quoteDate: null,
        decisionDate: null,
        validUntil: null,
        expirationReason: null,
        customerCode: row.customerCode,
        companyUuid: row.companyUuid,
        representative: row.representative,
        classification: row.classification,
        affiliateName,
        mustBeSent: row.mustBeSent,
        deliberatelyNotSent: row.deliberatelyNotSent,
        alreadySent: Boolean(row.isPrinted || row.isMailed || row.isFaxed),
        stillToSend: stillToSendFrom(row),
        orderMethod: row.orderMethod,
        ourReference: row.ourReference,
        isPickup: row.isPickup ?? false,
        isIncidental: row.isIncidental ?? false,
        isConsignment: false,
      };
    });

    return [...orders, ...quotes, ...returns, ...counterOrders].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch orders and quotes"));
  }
};

/**
 * The documents one view of the screen shows.
 *
 * Four series in one grid, told apart by the letter on the number -- `O`
 * orders, `R` returns, `Q` quotes, `B` counter orders -- so the filtering and
 * the paging happen after the four reads rather than inside any one of them.
 */
const filteredDocuments = async (
  query: TableQuery,
): Promise<OrderOrQuoteRow[]> => {
  const all = await allDocuments();

  const term = query.q?.toLowerCase() ?? null;
  const kinds = query.filters.kind ?? [];
  const statuses = query.filters.status ?? [];
  const send = query.filters.stillToSend ?? [];

  return all.filter((row) => {
    if (
      term &&
      !`${row.documentCode} ${row.customerName ?? ""} ${row.reference ?? ""}`
        .toLowerCase()
        .includes(term)
    ) {
      return false;
    }
    if (kinds.length > 0 && !kinds.includes(row.kind)) {
      return false;
    }
    if (statuses.length > 0 && !statuses.includes(row.status ?? "")) {
      return false;
    }
    if (send.includes("yes") && !row.stillToSend) {
      return false;
    }
    if (send.includes("no") && row.stillToSend) {
      return false;
    }
    return true;
  });
};

export const getOrdersAndQuotes = async (
  query: TableQuery,
): Promise<Paged<OrderOrQuoteRow>> => {
  const rows = await filteredDocuments(query);
  const start = (query.page - 1) * query.pageSize;

  return {
    rows: rows.slice(start, start + query.pageSize),
    total: rows.length,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const exportOrdersAndQuotes = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await filteredDocuments(parseTableQuery(params));

  return exportRows({
    name: "Orders and quotes",
    columns: ORDER_OR_QUOTE_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};
