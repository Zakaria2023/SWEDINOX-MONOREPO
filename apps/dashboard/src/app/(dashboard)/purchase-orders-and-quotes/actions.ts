"use server";

import { PURCHASE_ORDER_QUOTE_COLUMNS } from "@/app/(dashboard)/purchase-orders-and-quotes/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { PurchaseQuoteItems } from "@/db/schema/purchase-quote-items";
import {
  PurchaseQuotes,
  SelectPurchaseQuotes,
} from "@/db/schema/purchase-quotes";
import { PurchaseReturnOrderItems } from "@/db/schema/purchase-return-order-items";
import { PurchaseReturnOrders } from "@/db/schema/purchase-return-orders";
import {
  purchaseOrderStatuses,
  purchaseOrderTypes,
  purchaseQuoteStatuses,
  openPurchaseOrderStatuses,
} from "@/lib/enums";
import {
  describeError,
  documentStatusLabel,
  personInitials,
} from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, eq, like, or, SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// The two document kinds this screen puts in one list. A row is one or the
// other, and several columns only mean anything on one of them: a quote has a
// validity and an expiry reason, an order has a delivery date and a way of
// reaching the supplier.
const ORDER = "Order";
const QUOTE = "Quote";
// A purchase return sits in the same list on the reference (`IR950008`,
// `IR950030`, `IR950033` under `Delivered`), its weight and money signed
// negative because the goods go back.
const RETURN = "Return";

// The money on a line is the net price times the line's weight in the unit the
// price is struck in — a tonne price divides by a thousand. Rolled up from the
// lines rather than read off the header, because the header's stored totals
// were never filled: they say 0 on 78 of 80 orders whose lines carry both a
// price and a weight.
const orderRevenueSql = sql<number>`(
  SELECT COALESCE(SUM(
    COALESCE(${PurchaseOrderItems.netPrice}, 0) *
    CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
      THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
      ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0) / 1000
    END
  ), 0)
  FROM ${PurchaseOrderItems}
  WHERE ${PurchaseOrderItems.purchaseOrderUuid} = ${PurchaseOrders.uuid}
)`;

const orderWeightSql = sql<number>`(
  SELECT COALESCE(SUM(${PurchaseOrderItems.kgPurchased}), 0)
  FROM ${PurchaseOrderItems}
  WHERE ${PurchaseOrderItems.purchaseOrderUuid} = ${PurchaseOrders.uuid}
)`;

const orderLineCountSql = sql<number>`(
  SELECT COUNT(*) FROM ${PurchaseOrderItems}
  WHERE ${PurchaseOrderItems.purchaseOrderUuid} = ${PurchaseOrders.uuid}
)`;

const quoteRevenueSql = sql<number>`(
  SELECT COALESCE(SUM(${PurchaseQuoteItems.amount}), 0)
  FROM ${PurchaseQuoteItems}
  WHERE ${PurchaseQuoteItems.purchaseQuoteUuid} = ${PurchaseQuotes.uuid}
)`;

const quoteWeightSql = sql<number>`(
  SELECT COALESCE(SUM(${PurchaseQuoteItems.kg}), 0)
  FROM ${PurchaseQuoteItems}
  WHERE ${PurchaseQuoteItems.purchaseQuoteUuid} = ${PurchaseQuotes.uuid}
)`;

const quoteLineCountSql = sql<number>`(
  SELECT COUNT(*) FROM ${PurchaseQuoteItems}
  WHERE ${PurchaseQuoteItems.purchaseQuoteUuid} = ${PurchaseQuotes.uuid}
)`;

const returnRevenueSql = sql<number>`(
  SELECT -ABS(COALESCE(SUM(${PurchaseReturnOrderItems.amount}), 0))
  FROM ${PurchaseReturnOrderItems}
  WHERE ${PurchaseReturnOrderItems.purchaseReturnOrderUuid} = ${PurchaseReturnOrders.uuid}
)`;

const returnWeightSql = sql<number>`(
  SELECT -ABS(COALESCE(SUM(${PurchaseReturnOrderItems.weightKg}), 0))
  FROM ${PurchaseReturnOrderItems}
  WHERE ${PurchaseReturnOrderItems.purchaseReturnOrderUuid} = ${PurchaseReturnOrders.uuid}
)`;

const returnLineCountSql = sql<number>`(
  SELECT COUNT(*) FROM ${PurchaseReturnOrderItems}
  WHERE ${PurchaseReturnOrderItems.purchaseReturnOrderUuid} = ${PurchaseReturnOrders.uuid}
)`;

// The document's own date, not the day the row was inserted. Every order in the
// database was imported inside two months while the orders themselves span
// twenty, so reading createdAt here made the whole screen report one date.
const orderDateSql = sql<
  string | null
>`COALESCE(${PurchaseOrders.orderDate}, DATE(${PurchaseOrders.createdAt}))`;

const quoteDateSql = sql<
  string | null
>`COALESCE(${PurchaseQuotes.quoteDate}, DATE(${PurchaseQuotes.createdAt}))`;

const returnDateSql = sql<
  string | null
>`DATE(${PurchaseReturnOrders.createdAt})`;

export type PurchaseOrderQuoteRow = {
  kind: typeof ORDER | typeof QUOTE | typeof RETURN;
  uuid: SelectPurchaseOrders["uuid"];
  /** "Purchase order/Requests" — the document's own number. */
  number: SelectPurchaseOrders["id"];

  /** 1-4: when it was raised, and the buckets the reference groups it by. */
  creationDate: string | null;
  year: number | null;
  month: number | null;
  timeFrame: string | null;

  /** 6-8: who and where it stands. */
  purchaser: string | null;
  purchaserInitials: string | null;
  status: string | null;

  /** 9: the quote this order came from, or the order a quote became. */
  convertedUuid: string | null;
  convertedNumber: number | null;

  /** 10-12: the rollups, taken from the lines. */
  lines: number;
  weightKg: number;
  revenue: number;

  /** 13-14: who it is with, and who it is for. */
  supplierUuid: SelectCompanies["uuid"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["searchCode1"] | null;
  /** The company the goods are delivered to, when that is not us. */
  customerCode: SelectCompanies["searchCode1"] | null;

  /** 15-18: the fields that belong to one kind or the other. */
  deliveryDate: SelectPurchaseOrders["deliveryDate"] | null;
  orderType: SelectPurchaseOrders["purchaseOrderType"];
  expirationReason: SelectPurchaseQuotes["expirationReason"];
  quoteDate: SelectPurchaseQuotes["quoteDate"];
  validUntil: SelectPurchaseQuotes["validUntil"];

  /** 19-24: the text, the consignment flag and how it reached the supplier. */
  internalText: SelectPurchaseOrders["internalReference"];
  consignment: boolean | null;
  sent: boolean;
  mustBeSent: boolean;
  orderMethod: string | null;
  deliberatelyNotSent: boolean;

  /** 26-30: the affiliate, the classification and the two references. */
  affiliateCompany: SelectCompanies["companyName"] | null;
  classificationCode: SelectPurchaseOrders["orderCategory"];
  reference: SelectPurchaseOrders["reference"];
  ourReference: SelectPurchaseOrders["ourReference"];
};

type RawRow = Omit<
  PurchaseOrderQuoteRow,
  | "purchaser"
  | "purchaserInitials"
  | "sent"
  | "mustBeSent"
  | "orderMethod"
  | "consignment"
  | "deliberatelyNotSent"
  | "year"
  | "month"
  | "timeFrame"
> & {
  purchaserId: string | null;
  isPrinted: boolean | null;
  isMailed: boolean | null;
  isFaxed: boolean | null;
  sentViaStaalWeb: boolean | null;
  deliberatelyNotSent: boolean | null;
  consignment: boolean | null;
  /** Only a released document is owed to a supplier at all. */
  isLive: boolean;
};

const DeliveryAddressCompany = alias(Companies, "delivery_address_company");
const AgentCompany = alias(Companies, "agent_company");
const SourcePurchaseOrders = alias(PurchaseOrders, "source_purchase_order");

// A document nobody has released is not owed to anybody yet, so it is not
// "still to be sent" — it is still being written.
const UNSENT_ORDER_STATUSES = openPurchaseOrderStatuses;
const UNSENT_QUOTE_STATUSES = ["open", "received"] as const;

const searchCondition = (
  query: TableQuery,
  columns: readonly SQL[],
): SQL | undefined => {
  const term = (query.q ?? "").trim();
  if (term === "") {
    return undefined;
  }
  const escaped = term.replace(/[\\%_]/g, (character) => `\\${character}`);
  return or(...columns.map((column) => like(column, `%${escaped}%`)));
};

const rangeOf = (values: string[] | undefined): [string?, string?] => {
  const [from, to] = (values?.[0] ?? "").split("..");
  return [from || undefined, to || undefined];
};

const kindWanted = (query: TableQuery, kind: string): boolean => {
  const wanted = query.filters.kind;
  return !wanted || wanted.length === 0 || wanted.includes(kind);
};

const orderConditions = (query: TableQuery): Array<SQL | undefined> => {
  const [from, to] = rangeOf(query.filters.creationDate);
  return [
    kindWanted(query, ORDER) ? undefined : sql`1 = 0`,
    from ? sql`${orderDateSql} >= ${from}` : undefined,
    to ? sql`${orderDateSql} <= ${to}` : undefined,
    query.filters.supplier?.[0]
      ? eq(PurchaseOrders.supplierUuid, query.filters.supplier[0])
      : undefined,
    // The status filter carries both ladders; a value belonging to the other
    // kind simply selects nothing here, which is what it should do.
    query.filters.status && query.filters.status.length > 0
      ? sql`${PurchaseOrders.status} IN (${sql.join(
          query.filters.status
            .filter((value) =>
              (purchaseOrderStatuses as readonly string[]).includes(value),
            )
            .map((value) => sql`${value}`),
          sql`, `,
        )})`
      : // An expired order is off this screen unless asked for by name.
        sql`${PurchaseOrders.status} <> 'expired'`,
    query.filters.orderType?.[0] &&
    (purchaseOrderTypes as readonly string[]).includes(
      query.filters.orderType[0],
    )
      ? sql`${PurchaseOrders.purchaseOrderType} = ${query.filters.orderType[0]}`
      : undefined,
    searchCondition(query, [
      sql`CAST(${PurchaseOrders.id} AS CHAR)`,
      sql`COALESCE(${Companies.companyName}, '')`,
      sql`COALESCE(${PurchaseOrders.reference}, '')`,
      sql`COALESCE(${PurchaseOrders.ourReference}, '')`,
    ]),
  ];
};

const quoteConditions = (query: TableQuery): Array<SQL | undefined> => {
  const [from, to] = rangeOf(query.filters.creationDate);
  return [
    kindWanted(query, QUOTE) ? undefined : sql`1 = 0`,
    from ? sql`${quoteDateSql} >= ${from}` : undefined,
    to ? sql`${quoteDateSql} <= ${to}` : undefined,
    query.filters.supplier?.[0]
      ? eq(PurchaseQuotes.companyUuid, query.filters.supplier[0])
      : undefined,
    query.filters.status && query.filters.status.length > 0
      ? sql`${PurchaseQuotes.status} IN (${sql.join(
          query.filters.status
            .filter((value) =>
              (purchaseQuoteStatuses as readonly string[]).includes(value),
            )
            .map((value) => sql`${value}`),
          sql`, `,
        )})`
      : undefined,
    query.filters.orderType?.[0] &&
    (purchaseOrderTypes as readonly string[]).includes(
      query.filters.orderType[0],
    )
      ? sql`${PurchaseQuotes.purchaseOrderType} = ${query.filters.orderType[0]}`
      : undefined,
    searchCondition(query, [
      sql`CAST(${PurchaseQuotes.id} AS CHAR)`,
      sql`COALESCE(${Companies.companyName}, '')`,
      sql`COALESCE(${PurchaseQuotes.reference}, '')`,
      sql`COALESCE(${PurchaseQuotes.ourReference}, '')`,
    ]),
  ];
};

const returnConditions = (query: TableQuery): Array<SQL | undefined> => {
  const [from, to] = rangeOf(query.filters.creationDate);
  return [
    kindWanted(query, RETURN) ? undefined : sql`1 = 0`,
    from ? sql`${returnDateSql} >= ${from}` : undefined,
    to ? sql`${returnDateSql} <= ${to}` : undefined,
    query.filters.supplier?.[0]
      ? eq(PurchaseReturnOrders.supplierUuid, query.filters.supplier[0])
      : undefined,
    // A return walks the purchase order's own ladder.
    query.filters.status && query.filters.status.length > 0
      ? sql`${PurchaseReturnOrders.status} IN (${sql.join(
          query.filters.status
            .filter((value) =>
              (purchaseOrderStatuses as readonly string[]).includes(value),
            )
            .map((value) => sql`${value}`),
          sql`, `,
        )})`
      : sql`${PurchaseReturnOrders.status} NOT IN ('expired', 'cancelled')`,
    query.filters.orderType?.[0] &&
    (purchaseOrderTypes as readonly string[]).includes(
      query.filters.orderType[0],
    )
      ? sql`${PurchaseReturnOrders.purchaseOrderType} = ${query.filters.orderType[0]}`
      : undefined,
    searchCondition(query, [
      sql`CAST(${PurchaseReturnOrders.id} AS CHAR)`,
      sql`COALESCE(${Companies.companyName}, '')`,
      sql`COALESCE(${PurchaseReturnOrders.purchaseOrderReference}, '')`,
    ]),
  ];
};

const orderQuery = (query: TableQuery) =>
  db
    .select({
      kind: sql<typeof ORDER>`${ORDER}`,
      uuid: PurchaseOrders.uuid,
      number: PurchaseOrders.id,
      creationDate: orderDateSql,
      purchaserId: PurchaseOrders.purchaser,
      status: sql<string | null>`${PurchaseOrders.status}`,
      convertedUuid: PurchaseOrders.purchaseQuoteUuid,
      convertedNumber: sql<number | null>`(
        SELECT ${PurchaseQuotes.id} FROM ${PurchaseQuotes}
        WHERE ${PurchaseQuotes.uuid} = ${PurchaseOrders.purchaseQuoteUuid}
      )`,
      lines: orderLineCountSql,
      weightKg: orderWeightSql,
      revenue: orderRevenueSql,
      supplierUuid: PurchaseOrders.supplierUuid,
      supplierName: Companies.companyName,
      supplierCode: Companies.searchCode1,
      customerCode: DeliveryAddressCompany.searchCode1,
      deliveryDate: PurchaseOrders.deliveryDate,
      orderType: PurchaseOrders.purchaseOrderType,
      expirationReason: sql<null>`NULL`,
      quoteDate: sql<null>`NULL`,
      validUntil: sql<null>`NULL`,
      internalText: PurchaseOrders.internalReference,
      consignment: sql<boolean | null>`NULL`,
      isPrinted: PurchaseOrders.isPrinted,
      isMailed: PurchaseOrders.isMailed,
      isFaxed: PurchaseOrders.isFaxed,
      sentViaStaalWeb: PurchaseOrders.messageSentViaStaalWeb,
      deliberatelyNotSent: PurchaseOrders.deliberatelyNotSent,
      isLive: sql<boolean>`${PurchaseOrders.status} IN (${sql.join(
        UNSENT_ORDER_STATUSES.map((status) => sql`${status}`),
        sql`, `,
      )})`,
      affiliateCompany: AgentCompany.companyName,
      classificationCode: PurchaseOrders.orderCategory,
      reference: PurchaseOrders.reference,
      ourReference: PurchaseOrders.ourReference,
    })
    .from(PurchaseOrders)
    .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
    .leftJoin(AgentCompany, eq(PurchaseOrders.agentUuid, AgentCompany.uuid))
    // The delivery address names a company of its own when the goods go
    // straight to a customer rather than into our warehouse, which is the only
    // way a purchase document knows a customer at all.
    .leftJoin(
      CompanyAddresses,
      eq(PurchaseOrders.deliveryAddressUuid, CompanyAddresses.uuid),
    )
    .leftJoin(
      DeliveryAddressCompany,
      and(
        eq(CompanyAddresses.companyUuid, DeliveryAddressCompany.uuid),
        sql`${DeliveryAddressCompany.uuid} <> ${PurchaseOrders.supplierUuid}`,
      ),
    )
    .where(and(...orderConditions(query)));

const quoteQuery = (query: TableQuery) =>
  db
    .select({
      kind: sql<typeof QUOTE>`${QUOTE}`,
      uuid: PurchaseQuotes.uuid,
      number: PurchaseQuotes.id,
      creationDate: quoteDateSql,
      purchaserId: PurchaseQuotes.purchaser,
      status: sql<string | null>`${PurchaseQuotes.status}`,
      // The other half of the same link: the order this quote turned into.
      convertedUuid: sql<string | null>`(
        SELECT ${PurchaseOrders.uuid} FROM ${PurchaseOrders}
        WHERE ${PurchaseOrders.purchaseQuoteUuid} = ${PurchaseQuotes.uuid}
        LIMIT 1
      )`,
      convertedNumber: sql<number | null>`(
        SELECT ${PurchaseOrders.id} FROM ${PurchaseOrders}
        WHERE ${PurchaseOrders.purchaseQuoteUuid} = ${PurchaseQuotes.uuid}
        LIMIT 1
      )`,
      lines: quoteLineCountSql,
      weightKg: quoteWeightSql,
      revenue: quoteRevenueSql,
      supplierUuid: PurchaseQuotes.companyUuid,
      supplierName: Companies.companyName,
      supplierCode: Companies.searchCode1,
      customerCode: DeliveryAddressCompany.searchCode1,
      deliveryDate: PurchaseQuotes.deliveryDate,
      orderType: PurchaseQuotes.purchaseOrderType,
      expirationReason: PurchaseQuotes.expirationReason,
      quoteDate: PurchaseQuotes.quoteDate,
      validUntil: PurchaseQuotes.validUntil,
      internalText: sql<null>`NULL`,
      consignment: PurchaseQuotes.isConsignment,
      isPrinted: sql<boolean | null>`NULL`,
      isMailed: sql<boolean | null>`NULL`,
      isFaxed: sql<boolean | null>`NULL`,
      sentViaStaalWeb: sql<boolean | null>`NULL`,
      deliberatelyNotSent: sql<boolean | null>`NULL`,
      isLive: sql<boolean>`${PurchaseQuotes.status} IN (${sql.join(
        UNSENT_QUOTE_STATUSES.map((status) => sql`${status}`),
        sql`, `,
      )})`,
      // A quote raised through an agent carries that agent as its company, so
      // the affiliate is the agent exactly as it is on an order.
      affiliateCompany: sql<
        string | null
      >`CASE WHEN ${PurchaseQuotes.companyType} = 'agent' THEN ${Companies.companyName} ELSE NULL END`,
      classificationCode: PurchaseQuotes.orderCategory,
      reference: PurchaseQuotes.reference,
      ourReference: PurchaseQuotes.ourReference,
    })
    .from(PurchaseQuotes)
    .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
    .leftJoin(
      CompanyAddresses,
      eq(PurchaseQuotes.deliveryAddressUuid, CompanyAddresses.uuid),
    )
    .leftJoin(
      DeliveryAddressCompany,
      and(
        eq(CompanyAddresses.companyUuid, DeliveryAddressCompany.uuid),
        sql`${DeliveryAddressCompany.uuid} <> ${PurchaseQuotes.companyUuid}`,
      ),
    )
    .where(and(...quoteConditions(query)));

const returnQuery = (query: TableQuery) =>
  db
    .select({
      kind: sql<typeof RETURN>`${RETURN}`,
      uuid: PurchaseReturnOrders.uuid,
      number: PurchaseReturnOrders.id,
      creationDate: returnDateSql,
      purchaserId: PurchaseReturnOrders.purchaser,
      status: sql<string | null>`${PurchaseReturnOrders.status}`,
      convertedUuid: sql<string | null>`NULL`,
      convertedNumber: sql<number | null>`NULL`,
      lines: returnLineCountSql,
      weightKg: returnWeightSql,
      revenue: returnRevenueSql,
      supplierUuid: PurchaseReturnOrders.supplierUuid,
      supplierName: Companies.companyName,
      supplierCode: Companies.searchCode1,
      customerCode: sql<string | null>`NULL`,
      deliveryDate: PurchaseReturnOrders.returnDate,
      orderType: PurchaseReturnOrders.purchaseOrderType,
      expirationReason: sql<null>`NULL`,
      quoteDate: sql<null>`NULL`,
      validUntil: sql<null>`NULL`,
      internalText: sql<null>`NULL`,
      consignment: sql<boolean | null>`NULL`,
      isPrinted: PurchaseReturnOrders.isPrinted,
      isMailed: PurchaseReturnOrders.isMailed,
      isFaxed: PurchaseReturnOrders.isFaxed,
      sentViaStaalWeb: sql<boolean | null>`NULL`,
      deliberatelyNotSent: sql<boolean | null>`NULL`,
      isLive: sql<boolean>`${PurchaseReturnOrders.status} IN (${sql.join(
        UNSENT_ORDER_STATUSES.map((status) => sql`${status}`),
        sql`, `,
      )})`,
      // The affiliate the goods were bought through, read off the order the
      // return sends them back against.
      affiliateCompany: AgentCompany.companyName,
      classificationCode: SourcePurchaseOrders.orderCategory,
      // The reference's Reference on a return row is the purchase order it
      // returns against — `402598`, `403492`, `404102` (8-10-2026).
      reference: sql<
        string | null
      >`COALESCE(CAST(${SourcePurchaseOrders.id} AS CHAR), ${PurchaseReturnOrders.purchaseOrderReference})`,
      ourReference: sql<string | null>`NULL`,
    })
    .from(PurchaseReturnOrders)
    .leftJoin(Companies, eq(PurchaseReturnOrders.supplierUuid, Companies.uuid))
    .leftJoin(
      SourcePurchaseOrders,
      eq(PurchaseReturnOrders.purchaseOrderUuid, SourcePurchaseOrders.uuid),
    )
    .leftJoin(AgentCompany, eq(SourcePurchaseOrders.agentUuid, AgentCompany.uuid))
    .where(and(...returnConditions(query)));

// How the document reached the supplier. The reference keeps a method column
// beside the sent flags; ours reads the flags themselves, which is the same
// answer arrived at from the record rather than from a second field nobody
// fills in.
const orderMethodOf = (row: RawRow): string | null => {
  const methods = [
    row.isMailed ? "Email" : null,
    row.isPrinted ? "Print" : null,
    row.isFaxed ? "Fax" : null,
    row.sentViaStaalWeb ? "StaalWeb" : null,
  ].filter((method): method is string => method !== null);
  return methods.length > 0 ? methods.join(", ") : null;
};

const SORT_VALUES: Record<
  string,
  (row: PurchaseOrderQuoteRow) => number | string | null
> = {
  creationDate: (row) => row.creationDate,
  number: (row) => row.number,
  kind: (row) => row.kind,
  supplierName: (row) => row.supplierName,
  status: (row) => row.status,
  lines: (row) => row.lines,
  weightKg: (row) => row.weightKg,
  revenue: (row) => row.revenue,
  deliveryDate: (row) =>
    row.deliveryDate ? new Date(row.deliveryDate).getTime() : null,
};

const compareValues = (
  left: number | string | null,
  right: number | string | null,
): number => {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  if (typeof left === "string" || typeof right === "string") {
    return String(left).localeCompare(String(right));
  }
  return left - right;
};

/**
 * Every purchase order and every purchase quote, as one list.
 *
 * The two are separate tables that answer the same question — what buying is in
 * flight — so they are read side by side here rather than merged into one
 * table. Each side is filtered in SQL; the ordering and the page are then taken
 * across the pair, because a page of a merged list cannot be cut before the
 * halves are put together.
 */
const purchaseOrderQuoteRows = async (
  query: TableQuery,
): Promise<PurchaseOrderQuoteRow[]> => {
  const orders = (await orderQuery(query)) as RawRow[];
  const quotes = (await quoteQuery(query)) as RawRow[];
  const returns = (await returnQuery(query)) as RawRow[];

  const users = await getClerkUsersForSelect();
  const nameById = new Map(users.map((user) => [user.value, user.label]));

  const rows: PurchaseOrderQuoteRow[] = [
    ...orders,
    ...quotes,
    ...returns,
  ].map((row) => {
    const purchaser = row.purchaserId
      ? (nameById.get(row.purchaserId) ?? row.purchaserId)
      : null;
    const date = row.creationDate ? new Date(row.creationDate) : null;
    const sent = Boolean(
      row.isPrinted || row.isMailed || row.isFaxed || row.sentViaStaalWeb,
    );

    const {
      purchaserId: _purchaserId,
      isPrinted: _isPrinted,
      isMailed: _isMailed,
      isFaxed: _isFaxed,
      sentViaStaalWeb: _sentViaStaalWeb,
      isLive,
      ...rest
    } = row;
    void _purchaserId;
    void _isPrinted;
    void _isMailed;
    void _isFaxed;
    void _sentViaStaalWeb;

    return {
      ...rest,
      purchaser,
      purchaserInitials: personInitials(purchaser),
      year: date ? date.getFullYear() : null,
      month: date ? date.getMonth() + 1 : null,
      // The reference groups by year and by month in the two columns before
      // this one; the quarter is the bucket between them, and the one a buyer
      // reports a season in.
      timeFrame: date
        ? `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
        : null,
      lines: Number(row.lines ?? 0),
      weightKg: Number(row.weightKg ?? 0),
      revenue: Number(row.revenue ?? 0),
      consignment: row.consignment === null ? null : Boolean(row.consignment),
      sent,
      // Owed to the supplier and not yet gone, unless somebody decided it
      // should not go.
      mustBeSent: Boolean(isLive) && !sent && !row.deliberatelyNotSent,
      orderMethod: orderMethodOf(row),
      deliberatelyNotSent: Boolean(row.deliberatelyNotSent),
    };
  });

  const accessor = query.sort ? SORT_VALUES[query.sort] : undefined;
  const sign = query.dir === "desc" ? -1 : 1;

  return rows.sort((left, right) => {
    // The reference groups this screen by Status, so a page holds whole
    // groups, alphabetically, before it is ordered within them.
    const group = documentStatusLabel(left.kind, left.status).localeCompare(
      documentStatusLabel(right.kind, right.status),
    );
    if (group !== 0) {
      return group;
    }
    const ordered = accessor
      ? sign * compareValues(accessor(left), accessor(right))
      : // Oldest first, on creation date — the reference's own default order.
        compareValues(left.creationDate, right.creationDate);
    return ordered !== 0
      ? ordered
      : left.kind.localeCompare(right.kind) || right.number - left.number;
  });
};

export const getPurchaseOrdersAndQuotes = async (
  query: TableQuery,
): Promise<Paged<PurchaseOrderQuoteRow>> => {
  try {
    const rows = await purchaseOrderQuoteRows(query);
    const offset = (query.page - 1) * query.pageSize;

    return {
      rows: rows.slice(offset, offset + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch purchase orders and quotes"),
    );
  }
};

export const exportPurchaseOrdersAndQuotes = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase orders and quotes",
    columns: PURCHASE_ORDER_QUOTE_COLUMNS,
    columnKeys,
    rows: async (limit, offset) => {
      const rows = await purchaseOrderQuoteRows(parseTableQuery(params));
      return rows.slice(offset, offset + limit);
    },
  });
