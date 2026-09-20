"use server";

import { CUSTOMER_OVERVIEW_COLUMNS } from "@/app/(dashboard)/customer-overview/columns";
import {
  db,
  Companies,
  Complaints,
  CounterOrderItems,
  CounterOrders,
  InvoiceItems,
  Invoices,
  OrderItems,
  Orders,
  Quotes,
  ReturnOrderItems,
  ReturnOrders,
  SelectCompanies,
  SelectCompanyAddresses,
  VisitReports,
} from "@/db";
import { customerGroups, salesRepresentatives } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { exportRows } from "@/lib/server/excel";
import {
  enumFilter,
  FilterBindings,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
  valueFilter,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, countDistinct, eq, inArray, ne, sql, SQL } from "drizzle-orm";
import { AnyMySqlColumn } from "drizzle-orm/mysql-core";

/**
 * The reference window this screen was asked for.
 *
 * Every count on the reference screen is windowed by a `Reference date from` /
 * `u/i` filter, and the screen prints that filter back as two columns on every
 * row — so a sheet can never be read out of context. Both ends are optional
 * here; unbounded means the customer's whole history, which the reference
 * cannot express.
 */
export type ReferenceWindow = {
  from: string | null;
  to: string | null;
};

export type CustomerOverviewRow = {
  companyUuid: SelectCompanies["uuid"];
  customerCode: SelectCompanies["id"];
  companyName: SelectCompanies["companyName"];
  searchCode1: SelectCompanies["searchCode1"];
  searchCode2: SelectCompanies["searchCode2"];
  searchCode3: SelectCompanies["searchCode3"];
  representative: SelectCompanies["representative"];
  customerGroup: SelectCompanies["customerGroup"];
  region: SelectCompanies["region"];
  vatNumber: SelectCompanies["vatNumber"];
  visitFrequency: SelectCompanies["visitFrequency"];
  invoiceEmailEnabled: SelectCompanies["invoiceEmailEnabled"];
  invoiceEmailTo: SelectCompanies["invoiceEmailTo"];
  streetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  city: SelectCompanyAddresses["city"] | null;
  postalCode: SelectCompanyAddresses["postalCode"] | null;
  quotes: number;
  outstandingQuotes: number;
  orders: number;
  orderLines: number;
  outstandingOrders: number;
  invoices: number;
  invoiceLines: number;
  counterOrders: number;
  counterOrderLines: number;
  outstandingCounterOrders: number;
  returnOrders: number;
  returnOrderLines: number;
  outstandingReturnOrders: number;
  complaints: number;
  outstandingComplaints: number;
  visits: number;
  lastOrderDate: Date | null;
  ordersUnder200Eur: number;
  ordersUnder500Eur: number;
  ordersUnder2000Eur: number;
  ordersUnder200Kg: number;
  ordersUnder500Kg: number;
  ordersUnder2000Kg: number;
  invoicedOrders: number;
  invoicedOrdersRevenue: number;
  avgOrderSize: number;
  referenceFrom: string | null;
  referenceTo: string | null;
};

/** One customer's document tallies, before they go back on the company row. */
type CustomerTallies = {
  quotes: number;
  outstandingQuotes: number;
  orders: number;
  orderLines: number;
  outstandingOrders: number;
  invoices: number;
  invoiceLines: number;
  counterOrders: number;
  counterOrderLines: number;
  outstandingCounterOrders: number;
  returnOrders: number;
  returnOrderLines: number;
  outstandingReturnOrders: number;
  complaints: number;
  outstandingComplaints: number;
  visits: number;
  lastOrderDate: Date | null;
  ordersUnder200Eur: number;
  ordersUnder500Eur: number;
  ordersUnder2000Eur: number;
  ordersUnder200Kg: number;
  ordersUnder500Kg: number;
  ordersUnder2000Kg: number;
  invoicedOrders: number;
  invoicedOrdersRevenue: number;
};

/** The customer itself, before any document has been counted against it. */
type CompanyRow = {
  companyUuid: SelectCompanies["uuid"];
  customerCode: SelectCompanies["id"];
  companyName: SelectCompanies["companyName"];
  searchCode1: SelectCompanies["searchCode1"];
  searchCode2: SelectCompanies["searchCode2"];
  searchCode3: SelectCompanies["searchCode3"];
  representative: SelectCompanies["representative"];
  customerGroup: SelectCompanies["customerGroup"];
  region: SelectCompanies["region"];
  vatNumber: SelectCompanies["vatNumber"];
  visitFrequency: SelectCompanies["visitFrequency"];
  invoiceEmailEnabled: SelectCompanies["invoiceEmailEnabled"];
  invoiceEmailTo: SelectCompanies["invoiceEmailTo"];
  streetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  city: SelectCompanyAddresses["city"] | null;
  postalCode: SelectCompanyAddresses["postalCode"] | null;
};

// The screen is the customer list. A prospect is a checkbox on the same
// company record, so the role selects the rows; there is no prospect table.
const IS_CUSTOMER = sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`;

// Three search codes exist and only the third is filled on the reference's
// rows, so the name has to carry the search as well.
const CUSTOMER_OVERVIEW_SEARCH = [
  Companies.companyName,
  Companies.searchCode1,
  Companies.searchCode2,
  Companies.searchCode3,
] as const;

const CUSTOMER_OVERVIEW_FILTERS: FilterBindings = {
  representative: enumFilter(Companies.representative, salesRepresentatives),
  customerGroup: enumFilter(Companies.customerGroup, customerGroups),
  region: valueFilter(Companies.region),
};

const CUSTOMER_OVERVIEW_SORTABLE: SortableColumns = {
  customerCode: Companies.id,
  companyName: Companies.companyName,
  searchCode3: Companies.searchCode3,
  representative: Companies.representative,
  customerGroup: Companies.customerGroup,
  region: Companies.region,
};

/** A sales document is outstanding until it is invoiced, closed or cancelled. */
const OPEN_ORDER_STATUSES = [
  "provisional",
  "released",
  "checked",
  "in_progress",
  "partially_delivered",
  "partially_invoiced",
] as const;

const EMPTY_TALLIES: CustomerTallies = {
  quotes: 0,
  outstandingQuotes: 0,
  orders: 0,
  orderLines: 0,
  outstandingOrders: 0,
  invoices: 0,
  invoiceLines: 0,
  counterOrders: 0,
  counterOrderLines: 0,
  outstandingCounterOrders: 0,
  returnOrders: 0,
  returnOrderLines: 0,
  outstandingReturnOrders: 0,
  complaints: 0,
  outstandingComplaints: 0,
  visits: 0,
  lastOrderDate: null,
  ordersUnder200Eur: 0,
  ordersUnder500Eur: 0,
  ordersUnder2000Eur: 0,
  ordersUnder200Kg: 0,
  ordersUnder500Kg: 0,
  ordersUnder2000Kg: 0,
  invoicedOrders: 0,
  invoicedOrdersRevenue: 0,
};

/**
 * The window the current view was asked for, as the two stamped columns.
 *
 * Not exported: everything a "use server" file exports has to be an async
 * function, and this is a plain read of the query.
 */
const referenceWindowOf = (query: TableQuery): ReferenceWindow => {
  const [from, to] = (query.filters.referenceDate?.[0] ?? "").split("..");
  return { from: from || null, to: to || null };
};

/**
 * A document falls inside the window by its own business date, falling back to
 * the day it was written when that date was never filled.
 */
const within = (
  date: AnyMySqlColumn | null,
  createdAt: AnyMySqlColumn,
  window: ReferenceWindow,
): SQL | undefined => {
  const on = date
    ? sql`COALESCE(${date}, DATE(${createdAt}))`
    : sql`DATE(${createdAt})`;
  return and(
    window.from ? sql`${on} >= ${window.from}` : undefined,
    window.to ? sql`${on} <= ${window.to}` : undefined,
  );
};

/** How many of the grouped rows carry a value below a threshold. */
const under = (column: AnyMySqlColumn, limit: number) =>
  sql<number>`SUM(CASE WHEN ${column} < ${limit} THEN 1 ELSE 0 END)`;

const visitingAddress = () => companyAddressFor("visit", "visiting_address");

const companyRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<CompanyRow[]> => {
    const visiting = visitingAddress();
    return db
      .select({
        companyUuid: Companies.uuid,
        customerCode: Companies.id,
        companyName: Companies.companyName,
        searchCode1: Companies.searchCode1,
        searchCode2: Companies.searchCode2,
        searchCode3: Companies.searchCode3,
        representative: Companies.representative,
        customerGroup: Companies.customerGroup,
        region: Companies.region,
        vatNumber: Companies.vatNumber,
        visitFrequency: Companies.visitFrequency,
        invoiceEmailEnabled: Companies.invoiceEmailEnabled,
        invoiceEmailTo: Companies.invoiceEmailTo,
        streetAndNo: visiting.streetAndNo,
        city: visiting.city,
        postalCode: visiting.postalCode,
      })
      .from(Companies)
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(
        tableWhere({
          query,
          search: CUSTOMER_OVERVIEW_SEARCH,
          filters: CUSTOMER_OVERVIEW_FILTERS,
          scope: [IS_CUSTOMER],
        }),
      )
      .orderBy(
        ...tableOrderBy(
          CUSTOMER_OVERVIEW_SORTABLE,
          query,
          [sql`${Companies.id} desc`],
          Companies.id,
        ),
      )
      .limit(limit)
      .offset(offset);
  };

/**
 * The document tallies for one page of customers.
 *
 * Eleven grouped queries, run one after another rather than together: this
 * database caps connections, and a page is ten customers, so the cost is the
 * same eleven round trips whatever the size of the customer list. The screen
 * this replaces ran its aggregates over every customer that has ever existed,
 * on every load, and returned all of them.
 */
const talliesFor = async (
  companyUuids: string[],
  window: ReferenceWindow,
): Promise<Map<string, CustomerTallies>> => {
  const tallies = new Map<string, CustomerTallies>();
  const held = (uuid: string): CustomerTallies => {
    const existing = tallies.get(uuid);
    if (existing) {
      return existing;
    }
    const fresh = { ...EMPTY_TALLIES };
    tallies.set(uuid, fresh);
    return fresh;
  };

  const quoteRows = await db
    .select({
      companyUuid: Quotes.companyUuid,
      total: sql<number>`COUNT(*)`,
      outstanding: sql<number>`SUM(CASE WHEN ${inArray(Quotes.status, OPEN_ORDER_STATUSES)} THEN 1 ELSE 0 END)`,
    })
    .from(Quotes)
    .where(
      and(
        inArray(Quotes.companyUuid, companyUuids),
        within(Quotes.quoteDate, Quotes.createdAt, window),
      ),
    )
    .groupBy(Quotes.companyUuid);
  for (const row of quoteRows) {
    const at = held(row.companyUuid);
    at.quotes = Number(row.total);
    at.outstandingQuotes = Number(row.outstanding ?? 0);
  }

  // An order has no date column of its own — the day it was written is the
  // order date, which is what the reference's Last order date shows too.
  const orderRows = await db
    .select({
      companyUuid: Orders.companyUuid,
      total: sql<number>`COUNT(*)`,
      outstanding: sql<number>`SUM(CASE WHEN ${inArray(Orders.status, OPEN_ORDER_STATUSES)} THEN 1 ELSE 0 END)`,
      lastOrderDate: sql<string | null>`MAX(${Orders.createdAt})`,
      under200Eur: under(Orders.totalExclVat, 200),
      under500Eur: under(Orders.totalExclVat, 500),
      under2000Eur: under(Orders.totalExclVat, 2000),
      under200Kg: under(Orders.totalWeightKg, 200),
      under500Kg: under(Orders.totalWeightKg, 500),
      under2000Kg: under(Orders.totalWeightKg, 2000),
    })
    .from(Orders)
    .where(
      and(
        inArray(Orders.companyUuid, companyUuids),
        within(null, Orders.createdAt, window),
      ),
    )
    .groupBy(Orders.companyUuid);
  for (const row of orderRows) {
    const at = held(row.companyUuid);
    at.orders = Number(row.total);
    at.outstandingOrders = Number(row.outstanding ?? 0);
    at.lastOrderDate = row.lastOrderDate ? new Date(row.lastOrderDate) : null;
    at.ordersUnder200Eur = Number(row.under200Eur ?? 0);
    at.ordersUnder500Eur = Number(row.under500Eur ?? 0);
    at.ordersUnder2000Eur = Number(row.under2000Eur ?? 0);
    at.ordersUnder200Kg = Number(row.under200Kg ?? 0);
    at.ordersUnder500Kg = Number(row.under500Kg ?? 0);
    at.ordersUnder2000Kg = Number(row.under2000Kg ?? 0);
  }

  const orderLineRows = await db
    .select({
      companyUuid: Orders.companyUuid,
      lines: sql<number>`COUNT(*)`,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(Orders.uuid, OrderItems.orderUuid))
    .where(
      and(
        inArray(Orders.companyUuid, companyUuids),
        within(null, Orders.createdAt, window),
      ),
    )
    .groupBy(Orders.companyUuid);
  for (const row of orderLineRows) {
    held(row.companyUuid).orderLines = Number(row.lines);
  }

  // A cancelled invoice is neither a document the customer owes on nor
  // revenue, so it is out of the count and out of the money.
  const invoiceRows = await db
    .select({
      companyUuid: Invoices.companyUuid,
      total: sql<number>`COUNT(*)`,
    })
    .from(Invoices)
    .where(
      and(
        inArray(Invoices.companyUuid, companyUuids),
        eq(Invoices.cancelled, false),
        within(Invoices.invoiceDate, Invoices.createdAt, window),
      ),
    )
    .groupBy(Invoices.companyUuid);
  for (const row of invoiceRows) {
    if (row.companyUuid) {
      held(row.companyUuid).invoices = Number(row.total);
    }
  }

  // Invoiced orders are counted through the lines, because that is the only
  // link an invoice has back to the order it settles.
  const invoiceLineRows = await db
    .select({
      companyUuid: Invoices.companyUuid,
      lines: sql<number>`COUNT(*)`,
      invoicedOrders: countDistinct(OrderItems.orderUuid),
      revenue: sql<string>`COALESCE(SUM(${InvoiceItems.amount}), 0)`,
    })
    .from(InvoiceItems)
    .innerJoin(Invoices, eq(Invoices.uuid, InvoiceItems.invoiceUuid))
    .leftJoin(OrderItems, eq(OrderItems.uuid, InvoiceItems.orderItemUuid))
    .where(
      and(
        inArray(Invoices.companyUuid, companyUuids),
        eq(Invoices.cancelled, false),
        within(Invoices.invoiceDate, Invoices.createdAt, window),
      ),
    )
    .groupBy(Invoices.companyUuid);
  for (const row of invoiceLineRows) {
    if (row.companyUuid) {
      const at = held(row.companyUuid);
      at.invoiceLines = Number(row.lines);
      at.invoicedOrders = Number(row.invoicedOrders ?? 0);
      at.invoicedOrdersRevenue = Number(row.revenue ?? 0);
    }
  }

  // A counter order is a first-class document on this screen, counted three
  // ways like a quote or a return — the reference gives it its own columns.
  const counterOrderRows = await db
    .select({
      companyUuid: CounterOrders.companyUuid,
      total: sql<number>`COUNT(*)`,
      outstanding: sql<number>`SUM(CASE WHEN ${inArray(CounterOrders.status, ["open", "in_progress"])} THEN 1 ELSE 0 END)`,
    })
    .from(CounterOrders)
    .where(
      and(
        inArray(CounterOrders.companyUuid, companyUuids),
        within(CounterOrders.orderDate, CounterOrders.createdAt, window),
      ),
    )
    .groupBy(CounterOrders.companyUuid);
  for (const row of counterOrderRows) {
    const at = held(row.companyUuid);
    at.counterOrders = Number(row.total);
    at.outstandingCounterOrders = Number(row.outstanding ?? 0);
  }

  const counterOrderLineRows = await db
    .select({
      companyUuid: CounterOrders.companyUuid,
      lines: sql<number>`COUNT(*)`,
    })
    .from(CounterOrderItems)
    .innerJoin(
      CounterOrders,
      eq(CounterOrders.uuid, CounterOrderItems.counterOrderUuid),
    )
    .where(
      and(
        inArray(CounterOrders.companyUuid, companyUuids),
        within(CounterOrders.orderDate, CounterOrders.createdAt, window),
      ),
    )
    .groupBy(CounterOrders.companyUuid);
  for (const row of counterOrderLineRows) {
    held(row.companyUuid).counterOrderLines = Number(row.lines);
  }

  const returnOrderRows = await db
    .select({
      companyUuid: ReturnOrders.companyUuid,
      total: sql<number>`COUNT(*)`,
      outstanding: sql<number>`SUM(CASE WHEN ${inArray(ReturnOrders.status, ["open", "in_progress", "received"])} THEN 1 ELSE 0 END)`,
    })
    .from(ReturnOrders)
    .where(
      and(
        inArray(ReturnOrders.companyUuid, companyUuids),
        within(ReturnOrders.orderDate, ReturnOrders.createdAt, window),
      ),
    )
    .groupBy(ReturnOrders.companyUuid);
  for (const row of returnOrderRows) {
    const at = held(row.companyUuid);
    at.returnOrders = Number(row.total);
    at.outstandingReturnOrders = Number(row.outstanding ?? 0);
  }

  const returnOrderLineRows = await db
    .select({
      companyUuid: ReturnOrders.companyUuid,
      lines: sql<number>`COUNT(*)`,
    })
    .from(ReturnOrderItems)
    .innerJoin(
      ReturnOrders,
      eq(ReturnOrders.uuid, ReturnOrderItems.returnOrderUuid),
    )
    .where(
      and(
        inArray(ReturnOrders.companyUuid, companyUuids),
        within(ReturnOrders.orderDate, ReturnOrders.createdAt, window),
      ),
    )
    .groupBy(ReturnOrders.companyUuid);
  for (const row of returnOrderLineRows) {
    held(row.companyUuid).returnOrderLines = Number(row.lines);
  }

  // A complaint is counted on the customer and carries its own lifecycle — it
  // can sit open with no return order behind it at all.
  const complaintRows = await db
    .select({
      companyUuid: Complaints.companyUuid,
      total: sql<number>`COUNT(*)`,
      outstanding: sql<number>`SUM(CASE WHEN ${ne(Complaints.status, "done")} THEN 1 ELSE 0 END)`,
    })
    .from(Complaints)
    .where(
      and(
        inArray(Complaints.companyUuid, companyUuids),
        within(Complaints.reportDate, Complaints.createdAt, window),
      ),
    )
    .groupBy(Complaints.companyUuid);
  for (const row of complaintRows) {
    const at = held(row.companyUuid);
    at.complaints = Number(row.total);
    at.outstandingComplaints = Number(row.outstanding ?? 0);
  }

  // The reference shows a visit against 2 of its 1 679 customers while its own
  // Visits made screen holds 166 — its counter is a batch statistic that has
  // not run since the copy was taken. This one counts the reports themselves.
  const visitRows = await db
    .select({
      companyUuid: VisitReports.companyUuid,
      total: sql<number>`COUNT(*)`,
    })
    .from(VisitReports)
    .where(
      and(
        inArray(VisitReports.companyUuid, companyUuids),
        within(VisitReports.visitDate, VisitReports.createdAt, window),
      ),
    )
    .groupBy(VisitReports.companyUuid);
  for (const row of visitRows) {
    held(row.companyUuid).visits = Number(row.total);
  }

  return tallies;
};

const customerOverviewRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<CustomerOverviewRow[]> => {
    const companies = await companyRows(query)(limit, offset);
    if (companies.length === 0) {
      return [];
    }

    const window = referenceWindowOf(query);
    const tallies = await talliesFor(
      companies.map((company) => company.companyUuid),
      window,
    );

    return companies.map((company): CustomerOverviewRow => {
      const tally = tallies.get(company.companyUuid) ?? EMPTY_TALLIES;
      return {
        ...company,
        ...tally,
        // The reference's own identity, exact on all 1 679 of its rows: the
        // average order size is the revenue of the invoiced orders over how
        // many orders there were — not over how many invoices they took.
        avgOrderSize:
          tally.invoicedOrders > 0
            ? Number(
                (tally.invoicedOrdersRevenue / tally.invoicedOrders).toFixed(2),
              )
            : 0,
        referenceFrom: window.from,
        referenceTo: window.to,
      };
    });
  };

export const getCustomerOverview = async (
  query: TableQuery,
): Promise<Paged<CustomerOverviewRow>> => {
  try {
    return await runPaged(query, {
      rows: customerOverviewRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: sql<number>`COUNT(*)` })
          .from(Companies)
          .where(
            tableWhere({
              query,
              search: CUSTOMER_OVERVIEW_SEARCH,
              filters: CUSTOMER_OVERVIEW_FILTERS,
              scope: [IS_CUSTOMER],
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch customer overview"));
  }
};

export const exportCustomerOverview = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Customer overview",
    columns: CUSTOMER_OVERVIEW_COLUMNS,
    columnKeys,
    rows: customerOverviewRows(parseTableQuery(params)),
  });

/** The regions customers are actually in, for the filter. */
export const getCustomerOverviewRegions = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ region: Companies.region })
    .from(Companies)
    .where(and(IS_CUSTOMER, ne(Companies.region, "")))
    .orderBy(Companies.region);

  return rows
    .map((row) => row.region)
    .filter((region): region is string => region !== null);
};
