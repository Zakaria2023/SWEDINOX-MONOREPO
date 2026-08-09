"use server";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { Orders, SelectOrders } from "@/db/schema/orders";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Quotes } from "@/db/schema/quotes";
import { Stock } from "@/db/schema/stock";
import { AgeingBucket } from "@/lib/enums";
import {
  daysOverdue,
  describeError,
  percentChange,
  periodKey,
  profitMarginPercent,
  recentMonths,
  summariseAgeing,
  todayDateString,
} from "@/lib/helpers";
import { ExportSheet } from "@/lib/excel";
import { buildWorkbook } from "@/lib/server/excel";
import { getOpenReceivableItems } from "@/lib/server/receivables";

const MONTHS_ON_CHART = 12;
const TOP_CUSTOMER_LIMIT = 8;

/** The order states still being worked on, as against completed or cancelled. */
const LIVE_ORDER_STATUSES: Array<NonNullable<SelectOrders["status"]>> = [
  "open",
  "confirmed",
];

const LIVE_PURCHASE_STATUSES: Array<
  NonNullable<SelectPurchaseOrders["status"]>
> = ["open", "confirmed", "pre_notified"];

const LIVE_COMPLAINT_STATUSES: Array<NonNullable<SelectComplaints["status"]>> =
  ["new", "in_progress", "on_hold"];

export type DashboardMonth = {
  /** `year-month`, the key the period rows are matched on. */
  key: string;
  /** The short month name the chart axis carries, e.g. `Mar`. */
  label: string;
  revenue: number;
  profit: number;
  orderCount: number;
  orderValue: number;
  quoteCount: number;
  quoteValue: number;
};

export type OrderStatusSlice = {
  status: NonNullable<SelectOrders["status"]>;
  count: number;
  value: number;
};

export type PurchaseStatusSlice = {
  status: NonNullable<SelectPurchaseOrders["status"]>;
  count: number;
  value: number;
};

export type ComplaintStatusSlice = {
  status: NonNullable<SelectComplaints["status"]>;
  count: number;
};

export type AgeingSlice = {
  bucket: AgeingBucket;
  amount: number;
};

export type TopCustomerSlice = {
  companyUuid: SelectInvoices["companyUuid"];
  companyName: SelectCompanies["companyName"] | null;
  revenue: number;
  invoiceCount: number;
};

export type DashboardOverview = {
  /** The day every "to date" and "overdue" figure on the page is measured from. */
  asOf: string;
  months: DashboardMonth[];
  revenue: {
    yearToDate: number;
    previousYearToDate: number;
    changePercent: number | null;
    profitYearToDate: number;
    marginPercent: number;
    lastTwelveMonths: number;
  };
  receivables: {
    outstanding: number;
    overdue: number;
    openItems: number;
    overdueItems: number;
    buckets: AgeingSlice[];
  };
  orders: {
    liveCount: number;
    liveValue: number;
    byStatus: OrderStatusSlice[];
  };
  quotes: {
    openCount: number;
    openValue: number;
    expiredCount: number;
    totalCount: number;
  };
  purchasing: {
    liveCount: number;
    liveValue: number;
    byStatus: PurchaseStatusSlice[];
  };
  stock: {
    lines: number;
    valuation: number;
    weightKg: number;
    reservedPercent: number;
    blockedLines: number;
  };
  companies: {
    total: number;
    customers: number;
    prospects: number;
    suppliers: number;
    inactive: number;
  };
  complaints: {
    openCount: number;
    byStatus: ComplaintStatusSlice[];
  };
  topCustomers: TopCustomerSlice[];
};

/**
 * Writes a workbook for an overview that renders all of its rows.
 *
 * The grid comes from the browser, read off the table the reader is looking at,
 * so this action does no querying and reveals nothing the caller was not already
 * shown — it exists because the workbook library belongs on the server, not
 * because the data does. The overviews that page on the server export through
 * their own action instead, which re-runs the query without the page window.
 */
export const exportTableSheet = async (sheet: ExportSheet): Promise<string> =>
  buildWorkbook(sheet);

/**
 * Everything the home page reports, in one round of queries.
 *
 * Every money figure is read from the document that fixed it — the invoice for
 * revenue, the order for the pipeline, the lot for stock value — so the
 * dashboard agrees with the report each number has its own page for, and a past
 * month cannot move because something was revalued since.
 *
 * Revenue is invoiced revenue: a cancelled invoice is void and drops out, and a
 * credit note carries negative amounts, so crediting a customer reduces the
 * month it lands in rather than being counted as more turnover.
 */
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  try {
    const asOf = todayDateString();
    const months = recentMonths(MONTHS_ON_CHART);
    const firstMonth = months[0];
    if (!firstMonth) {
      throw new Error("The dashboard needs at least one month to report on");
    }
    const since = firstMonth.start;

    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;
    const previousYearStart = `${now.getFullYear() - 1}-01-01`;
    const previousYearAsOf = `${now.getFullYear() - 1}${asOf.slice(4)}`;

    const invoiceYear = sql<number>`YEAR(${Invoices.invoiceDate})`;
    const invoiceMonth = sql<number>`MONTH(${Invoices.invoiceDate})`;
    const orderYear = sql<number>`YEAR(${Orders.createdAt})`;
    const orderMonth = sql<number>`MONTH(${Orders.createdAt})`;
    const quoteYear = sql<number>`YEAR(${Quotes.createdAt})`;
    const quoteMonth = sql<number>`MONTH(${Quotes.createdAt})`;
    // A quote is live while it has not been marked expired and its validity has
    // not run out on its own — the flag is set by a run, the date is the truth
    // between two runs.
    const quoteIsOpen = sql`(COALESCE(${Quotes.expired}, 0) = 0 AND (${Quotes.validUntil} IS NULL OR ${Quotes.validUntil} >= ${asOf}))`;
    const invoicedRevenue = sql<string>`COALESCE(SUM(${Invoices.invoiceAmountExclVat}), 0)`;

    // The figures are read in small batches rather than fired at the pool all
    // at once: the server hands out a limited number of connections, and one
    // page load must not be able to take them all.
    const [revenueMonthRows, orderMonthRows, quoteMonthRows] =
      await Promise.all([
        db
          .select({
            year: invoiceYear,
            month: invoiceMonth,
            revenue: invoicedRevenue,
            profit: sql<string>`COALESCE(SUM(${Invoices.materialsProfit} + ${Invoices.surchargesProfit}), 0)`,
          })
          .from(Invoices)
          .where(
            and(
              eq(Invoices.cancelled, false),
              sql`${Invoices.invoiceDate} >= ${since}`,
            ),
          )
          .groupBy(invoiceYear, invoiceMonth),

        db
          .select({
            year: orderYear,
            month: orderMonth,
            count: sql<number>`COUNT(*)`,
            value: sql<string>`COALESCE(SUM(${Orders.totalExclVat}), 0)`,
          })
          .from(Orders)
          .where(sql`${Orders.createdAt} >= ${since}`)
          .groupBy(orderYear, orderMonth),

        db
          .select({
            year: quoteYear,
            month: quoteMonth,
            count: sql<number>`COUNT(*)`,
            value: sql<string>`COALESCE(SUM(${Quotes.totalExclVat}), 0)`,
          })
          .from(Quotes)
          .where(sql`${Quotes.createdAt} >= ${since}`)
          .groupBy(quoteYear, quoteMonth),
      ]);

    const [yearToDateRows, previousYearRows, orderStatusRows] =
      await Promise.all([
        db
          .select({
            revenue: invoicedRevenue,
            profit: sql<string>`COALESCE(SUM(${Invoices.materialsProfit} + ${Invoices.surchargesProfit}), 0)`,
          })
          .from(Invoices)
          .where(
            and(
              eq(Invoices.cancelled, false),
              sql`${Invoices.invoiceDate} BETWEEN ${yearStart} AND ${asOf}`,
            ),
          ),

        db
          .select({ revenue: invoicedRevenue })
          .from(Invoices)
          .where(
            and(
              eq(Invoices.cancelled, false),
              sql`${Invoices.invoiceDate} BETWEEN ${previousYearStart} AND ${previousYearAsOf}`,
            ),
          ),

        db
          .select({
            status: Orders.status,
            count: sql<number>`COUNT(*)`,
            value: sql<string>`COALESCE(SUM(${Orders.totalExclVat}), 0)`,
          })
          .from(Orders)
          .groupBy(Orders.status),
      ]);

    const [quoteRows, purchaseStatusRows, stockRows] = await Promise.all([
      db
        .select({
          total: sql<number>`COUNT(*)`,
          openCount: sql<number>`COALESCE(SUM(CASE WHEN ${quoteIsOpen} THEN 1 ELSE 0 END), 0)`,
          openValue: sql<string>`COALESCE(SUM(CASE WHEN ${quoteIsOpen} THEN ${Quotes.totalExclVat} ELSE 0 END), 0)`,
          expiredCount: sql<number>`COALESCE(SUM(CASE WHEN ${quoteIsOpen} THEN 0 ELSE 1 END), 0)`,
        })
        .from(Quotes),

      db
        .select({
          status: PurchaseOrders.status,
          count: sql<number>`COUNT(*)`,
          value: sql<string>`COALESCE(SUM(${PurchaseOrders.amount}), 0)`,
        })
        .from(PurchaseOrders)
        .groupBy(PurchaseOrders.status),

      db
        .select({
          lines: sql<number>`COUNT(*)`,
          valuation: sql<string>`COALESCE(SUM(${Stock.valuationEuro}), 0)`,
          weightKg: sql<string>`COALESCE(SUM(${Stock.quantityKg}), 0)`,
          quantity: sql<string>`COALESCE(SUM(${Stock.quantity}), 0)`,
          reserved: sql<string>`COALESCE(SUM(${Stock.reservedQuantity}), 0)`,
          blocked: sql<number>`COALESCE(SUM(CASE WHEN ${Stock.blocked} = 1 THEN 1 ELSE 0 END), 0)`,
        })
        .from(Stock)
        .where(eq(Stock.status, "received")),
    ]);

    const [companyRows, complaintStatusRows, topCustomerRows] =
      await Promise.all([
        db
          .select({
            total: sql<number>`COUNT(*)`,
            customers: sql<number>`COALESCE(SUM(JSON_CONTAINS(COALESCE(${Companies.roles}, '[]'), '"customer"')), 0)`,
            prospects: sql<number>`COALESCE(SUM(JSON_CONTAINS(COALESCE(${Companies.roles}, '[]'), '"prospect"')), 0)`,
            suppliers: sql<number>`COALESCE(SUM(JSON_CONTAINS(COALESCE(${Companies.roles}, '[]'), '"supplier"')), 0)`,
            inactive: sql<number>`COALESCE(SUM(CASE WHEN ${Companies.isInactive} = 1 THEN 1 ELSE 0 END), 0)`,
          })
          .from(Companies),

        db
          .select({
            status: Complaints.status,
            count: sql<number>`COUNT(*)`,
          })
          .from(Complaints)
          .groupBy(Complaints.status),

        db
          .select({
            companyUuid: Invoices.companyUuid,
            companyName: Companies.companyName,
            revenue: invoicedRevenue,
            invoiceCount: sql<number>`COUNT(*)`,
          })
          .from(Invoices)
          .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
          .where(
            and(
              eq(Invoices.cancelled, false),
              sql`${Invoices.invoiceDate} >= ${since}`,
            ),
          )
          .groupBy(Invoices.companyUuid, Companies.companyName)
          .orderBy(desc(invoicedRevenue))
          .limit(TOP_CUSTOMER_LIMIT),
      ]);

    const openReceivables = await getOpenReceivableItems();

    const revenueByPeriod = new Map(
      revenueMonthRows.map((row) => [
        periodKey(Number(row.year), Number(row.month)),
        row,
      ]),
    );
    const ordersByPeriod = new Map(
      orderMonthRows.map((row) => [
        periodKey(Number(row.year), Number(row.month)),
        row,
      ]),
    );
    const quotesByPeriod = new Map(
      quoteMonthRows.map((row) => [
        periodKey(Number(row.year), Number(row.month)),
        row,
      ]),
    );

    const monthRows: DashboardMonth[] = months.map((month) => {
      const revenueRow = revenueByPeriod.get(month.key);
      const orderRow = ordersByPeriod.get(month.key);
      const quoteRow = quotesByPeriod.get(month.key);
      return {
        key: month.key,
        label: month.label,
        revenue: Number(revenueRow?.revenue ?? 0),
        profit: Number(revenueRow?.profit ?? 0),
        orderCount: Number(orderRow?.count ?? 0),
        orderValue: Number(orderRow?.value ?? 0),
        quoteCount: Number(quoteRow?.count ?? 0),
        quoteValue: Number(quoteRow?.value ?? 0),
      };
    });

    const yearToDate = Number(yearToDateRows[0]?.revenue ?? 0);
    const profitYearToDate = Number(yearToDateRows[0]?.profit ?? 0);
    const previousYearToDate = Number(previousYearRows[0]?.revenue ?? 0);

    const ageing = summariseAgeing(openReceivables, asOf);
    const overdue = ageing.total - ageing.not_due;

    const orderStatusSlices: OrderStatusSlice[] = orderStatusRows.map(
      (row) => ({
        status: row.status,
        count: Number(row.count),
        value: Number(row.value),
      }),
    );

    const purchaseStatusSlices: PurchaseStatusSlice[] = purchaseStatusRows.map(
      (row) => ({
        status: row.status,
        count: Number(row.count),
        value: Number(row.value),
      }),
    );

    const complaintStatusSlices: ComplaintStatusSlice[] = complaintStatusRows
      .filter((row) => row.status !== null)
      .map((row) => ({
        // Narrowed by the filter above: a complaint with no status is left out
        // rather than shown under a made-up one.
        status: row.status ?? "new",
        count: Number(row.count),
      }));

    const liveOrders = orderStatusSlices.filter((slice) =>
      LIVE_ORDER_STATUSES.includes(slice.status),
    );
    const livePurchases = purchaseStatusSlices.filter((slice) =>
      LIVE_PURCHASE_STATUSES.includes(slice.status),
    );
    const liveComplaints = complaintStatusSlices.filter((slice) =>
      LIVE_COMPLAINT_STATUSES.includes(slice.status),
    );

    const stockQuantity = Number(stockRows[0]?.quantity ?? 0);
    const stockReserved = Number(stockRows[0]?.reserved ?? 0);

    return {
      asOf,
      months: monthRows,
      revenue: {
        yearToDate,
        previousYearToDate,
        changePercent: percentChange(yearToDate, previousYearToDate),
        profitYearToDate,
        marginPercent: profitMarginPercent(yearToDate, profitYearToDate),
        lastTwelveMonths: monthRows.reduce(
          (total, month) => total + month.revenue,
          0,
        ),
      },
      receivables: {
        outstanding: ageing.total,
        overdue,
        openItems: openReceivables.length,
        overdueItems: openReceivables.filter((item) => {
          const overdueBy = daysOverdue(item.dueDate, asOf);
          return overdueBy !== null && overdueBy > 0;
        }).length,
        buckets: [
          { bucket: "not_due", amount: ageing.not_due },
          { bucket: "days_1_30", amount: ageing.days_1_30 },
          { bucket: "days_31_60", amount: ageing.days_31_60 },
          { bucket: "days_61_90", amount: ageing.days_61_90 },
          { bucket: "days_over_90", amount: ageing.days_over_90 },
        ],
      },
      orders: {
        liveCount: liveOrders.reduce((total, slice) => total + slice.count, 0),
        liveValue: liveOrders.reduce((total, slice) => total + slice.value, 0),
        byStatus: orderStatusSlices,
      },
      quotes: {
        openCount: Number(quoteRows[0]?.openCount ?? 0),
        openValue: Number(quoteRows[0]?.openValue ?? 0),
        expiredCount: Number(quoteRows[0]?.expiredCount ?? 0),
        totalCount: Number(quoteRows[0]?.total ?? 0),
      },
      purchasing: {
        liveCount: livePurchases.reduce(
          (total, slice) => total + slice.count,
          0,
        ),
        liveValue: livePurchases.reduce(
          (total, slice) => total + slice.value,
          0,
        ),
        byStatus: purchaseStatusSlices,
      },
      stock: {
        lines: Number(stockRows[0]?.lines ?? 0),
        valuation: Number(stockRows[0]?.valuation ?? 0),
        weightKg: Number(stockRows[0]?.weightKg ?? 0),
        reservedPercent:
          stockQuantity === 0 ? 0 : (stockReserved / stockQuantity) * 100,
        blockedLines: Number(stockRows[0]?.blocked ?? 0),
      },
      companies: {
        total: Number(companyRows[0]?.total ?? 0),
        customers: Number(companyRows[0]?.customers ?? 0),
        prospects: Number(companyRows[0]?.prospects ?? 0),
        suppliers: Number(companyRows[0]?.suppliers ?? 0),
        inactive: Number(companyRows[0]?.inactive ?? 0),
      },
      complaints: {
        openCount: liveComplaints.reduce(
          (total, slice) => total + slice.count,
          0,
        ),
        byStatus: complaintStatusSlices,
      },
      topCustomers: topCustomerRows.map((row) => ({
        companyUuid: row.companyUuid,
        companyName: row.companyName ?? null,
        revenue: Number(row.revenue),
        invoiceCount: Number(row.invoiceCount),
      })),
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch dashboard overview"));
  }
};
