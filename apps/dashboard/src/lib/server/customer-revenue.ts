import "server-only";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { OrderItemOptions } from "@/db/schema/order-item-options";
import { InvoiceSurcharges, Invoices } from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { INVOICE_SURCHARGE_REVENUE_GROUP_NUMBERS } from "@/lib/constants";
import { and, count, eq, inArray, isNotNull, min, sql } from "drizzle-orm";

/**
 * One aggregated slice of invoiced revenue. The reference's customer revenue
 * screens (C8–C12, docs/reference-system/customers-and-prospects.md Part 7–11)
 * all read the same two sources, and differ only in how they group them:
 *
 *   - **product** — the product half of each invoice line, under the
 *     **product's** revenue group (C9's total, 9 032 601.62 exact against B4);
 *   - **charge** — each charge line, under the **charge's** revenue group
 *     (18 855.71 exact).
 *
 * The reference has a third, the option half of each line under the option's
 * group. Options are not billed on our invoices yet, so it has no rows here.
 */
export type RevenueFact = {
  kind: "product" | "option" | "charge";
  companyUuid: string;
  year: number;
  month: number;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  /** The order's type. Null on a charge — the reference counts those as `Normal`. */
  orderType: SelectOrders["orderType"] | null;
  /** Stock or cross-dock. Null on a charge. */
  sourceType: SelectOrderItems["sourceType"] | null;
  /**
   * The unit the line was priced in. Part of the reference's own grain on the
   * revenue-group screens, and what `Sales (PriceU)` restates the quantity in.
   * Null on a charge, which is priced as a lump sum.
   */
  priceUnit: string | null;
  /** Invoiced quantity, for the units that are neither kilos nor tonnes. */
  quantity: number;
  revenue: number;
  profit: number;
  /**
   * Option revenue riding on these product lines; 0 on an option or a charge
   * row. It is the same money an `option` fact carries -- the product row
   * reports it beside the material it was bought with, the option row reports
   * it under the revenue group of the option itself. A screen reads one or the
   * other, never both.
   */
  optionRevenue: number;
  optionProfit: number;
  /**
   * Weight is carried on product rows only. The reference repeats a line's
   * weight on every option row, which overstates its kilos by a third; revenue
   * and profit are unaffected either way (decision E1).
   */
  weightKg: number;
  lines: number;
};

export type RevenueCompany = Pick<
  SelectCompanies,
  | "uuid"
  | "id"
  | "debtorNumber"
  | "companyName"
  | "representative"
  | "accountManager"
  | "customerGroup"
  | "region"
  | "isInactive"
> & {
  city: SelectCompanyAddresses["city"] | null;
  postalCode: SelectCompanyAddresses["postalCode"] | null;
  country: SelectCompanyAddresses["country"] | null;
};

const invoiceYear = sql<number>`YEAR(${Invoices.invoiceDate})`;
const invoiceMonth = sql<number>`MONTH(${Invoices.invoiceDate})`;

// The charge's revenue group number, resolved from its description.
const chargeGroupNumber = sql<number>`CASE ${InvoiceSurcharges.description} ${sql.join(
  Object.entries(INVOICE_SURCHARGE_REVENUE_GROUP_NUMBERS).map(
    ([description, number]) => sql`WHEN ${description} THEN ${number}`,
  ),
  sql` `,
)} ELSE 8900 END`;

/**
 * Every invoiced revenue slice, per company × month × revenue group × order
 * type × source. Cancelled invoices are void and left out.
 */
export const getRevenueFacts = async (): Promise<RevenueFact[]> => {
  const products = await db
    .select({
      companyUuid: Invoices.companyUuid,
      year: invoiceYear,
      month: invoiceMonth,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      orderType: Orders.orderType,
      sourceType: OrderItems.sourceType,
      priceUnit: InvoiceItems.priceUnit,
      quantity: sql<string>`COALESCE(SUM(${InvoiceItems.quantity}), 0)`,
      revenue: sql<string>`COALESCE(SUM(${InvoiceItems.revenueProducts}), 0)`,
      profit: sql<string>`COALESCE(SUM(${InvoiceItems.profitProducts}), 0)`,
      optionRevenue: sql<string>`COALESCE(SUM(${InvoiceItems.revenueOptions}), 0)`,
      optionProfit: sql<string>`COALESCE(SUM(${InvoiceItems.profitOptions}), 0)`,
      weightKg: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
      lines: count(InvoiceItems.uuid),
    })
    .from(InvoiceItems)
    .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
    .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
    .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
    .where(and(eq(Invoices.cancelled, false), isNotNull(Invoices.companyUuid)))
    .groupBy(
      Invoices.companyUuid,
      invoiceYear,
      invoiceMonth,
      RevenueGroups.number,
      RevenueGroups.name,
      Orders.orderType,
      OrderItems.sourceType,
      InvoiceItems.priceUnit,
    );

  const charges = await db
    .select({
      companyUuid: Invoices.companyUuid,
      year: invoiceYear,
      month: invoiceMonth,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      revenue: sql<string>`COALESCE(SUM(${InvoiceSurcharges.amount}), 0)`,
      profit: sql<string>`COALESCE(SUM(${InvoiceSurcharges.profit}), 0)`,
      lines: count(InvoiceSurcharges.uuid),
    })
    .from(InvoiceSurcharges)
    .innerJoin(Invoices, eq(InvoiceSurcharges.invoiceUuid, Invoices.uuid))
    .leftJoin(RevenueGroups, eq(RevenueGroups.number, chargeGroupNumber))
    .where(and(eq(Invoices.cancelled, false), isNotNull(Invoices.companyUuid)))
    .groupBy(
      Invoices.companyUuid,
      invoiceYear,
      invoiceMonth,
      RevenueGroups.number,
      RevenueGroups.name,
    );

  /**
   * The option half of an invoiced line, under the option's own revenue group.
   *
   * The money is the invoice's -- `Revenue options` on the line, which is what
   * the reference's option groups total to the cent -- but the group is the
   * option's: grinding to 3010, cutting to 3020, lasering to 3030. A line can
   * carry two options in two different groups, so the line's option revenue is
   * split between them in proportion to what each option was priced at. The
   * window sum is that proportion's denominator.
   *
   * Weight and line counts are deliberately 0. The reference repeats the
   * parent line's kilos and line count on every option row, which is why its
   * own totals come to 4 527 322 kg against a true 3 373 330 -- only revenue
   * and profit may be summed across revenue groups there. Ours does not
   * double-count, so they may be summed here.
   */
  const optionShare = db
    .select({
      companyUuid: Invoices.companyUuid,
      year: invoiceYear.as("option_year"),
      month: invoiceMonth.as("option_month"),
      revenueGroupUuid: OrderItemOptions.revenueGroupUuid,
      orderType: Orders.orderType,
      sourceType: OrderItems.sourceType,
      priceUnit: OrderItemOptions.priceUnit,
      quantity: OrderItemOptions.quantity,
      revenue: sql<string>`
        ${InvoiceItems.revenueOptions} * ${OrderItemOptions.amount}
        / NULLIF(SUM(${OrderItemOptions.amount}) OVER (PARTITION BY ${InvoiceItems.uuid}), 0)
      `.as("option_revenue"),
      profit: sql<string>`
        ${InvoiceItems.profitOptions} * ${OrderItemOptions.amount}
        / NULLIF(SUM(${OrderItemOptions.amount}) OVER (PARTITION BY ${InvoiceItems.uuid}), 0)
      `.as("option_profit"),
    })
    .from(InvoiceItems)
    .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
    .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(
      OrderItemOptions,
      eq(OrderItemOptions.orderItemUuid, OrderItems.uuid),
    )
    .where(and(eq(Invoices.cancelled, false), isNotNull(Invoices.companyUuid)))
    .as("option_share");

  const options = await db
    .select({
      companyUuid: optionShare.companyUuid,
      year: optionShare.year,
      month: optionShare.month,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      orderType: optionShare.orderType,
      sourceType: optionShare.sourceType,
      priceUnit: optionShare.priceUnit,
      quantity: sql<string>`COALESCE(SUM(${optionShare.quantity}), 0)`,
      revenue: sql<string>`COALESCE(SUM(${optionShare.revenue}), 0)`,
      profit: sql<string>`COALESCE(SUM(${optionShare.profit}), 0)`,
    })
    .from(optionShare)
    .leftJoin(
      RevenueGroups,
      eq(optionShare.revenueGroupUuid, RevenueGroups.uuid),
    )
    .groupBy(
      optionShare.companyUuid,
      optionShare.year,
      optionShare.month,
      RevenueGroups.number,
      RevenueGroups.name,
      optionShare.orderType,
      optionShare.sourceType,
      optionShare.priceUnit,
    );

  return [
    ...products.map(
      (row): RevenueFact => ({
        kind: "product",
        companyUuid: row.companyUuid ?? "",
        year: Number(row.year),
        month: Number(row.month),
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        orderType: row.orderType,
        sourceType: row.sourceType,
        priceUnit: row.priceUnit,
        quantity: Number(row.quantity),
        revenue: Number(row.revenue),
        profit: Number(row.profit),
        optionRevenue: Number(row.optionRevenue),
        optionProfit: Number(row.optionProfit),
        weightKg: Number(row.weightKg),
        lines: Number(row.lines),
      }),
    ),
    ...options.map(
      (row): RevenueFact => ({
        kind: "option",
        companyUuid: row.companyUuid ?? "",
        year: Number(row.year),
        month: Number(row.month),
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        orderType: row.orderType,
        sourceType: row.sourceType,
        priceUnit: row.priceUnit,
        quantity: Number(row.quantity),
        revenue: Number(row.revenue),
        profit: Number(row.profit),
        optionRevenue: 0,
        optionProfit: 0,
        weightKg: 0,
        lines: 0,
      }),
    ),
    ...charges.map(
      (row): RevenueFact => ({
        kind: "charge",
        companyUuid: row.companyUuid ?? "",
        year: Number(row.year),
        month: Number(row.month),
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        orderType: null,
        sourceType: null,
        priceUnit: null,
        quantity: 0,
        revenue: Number(row.revenue),
        profit: Number(row.profit),
        optionRevenue: 0,
        optionProfit: 0,
        weightKg: 0,
        lines: Number(row.lines),
      }),
    ),
  ];
};

/**
 * The company columns the revenue screens print, keyed by company uuid. City,
 * postcode and country come from the company's **visiting** address — the
 * reference has exactly one per company — not from a contact's copy.
 *
 * `companyUuids` narrows it to the companies on the page. Left off it loads
 * every company, which is what the unpaged revenue screens still want.
 */
export const getRevenueCompanies = async (
  companyUuids?: string[],
): Promise<Map<string, RevenueCompany>> => {
  if (companyUuids && companyUuids.length === 0) {
    return new Map();
  }

  const visitingId = db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      minId: min(CompanyAddresses.id).as("min_id"),
    })
    .from(CompanyAddresses)
    .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, '"visit"')`)
    .groupBy(CompanyAddresses.companyUuid)
    .as("visiting_id");

  const visiting = db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      city: CompanyAddresses.city,
      postalCode: CompanyAddresses.postalCode,
      country: CompanyAddresses.country,
    })
    .from(CompanyAddresses)
    .innerJoin(visitingId, eq(CompanyAddresses.id, visitingId.minId))
    .as("visiting");

  const rows = await db
    .select({
      uuid: Companies.uuid,
      id: Companies.id,
      debtorNumber: Companies.debtorNumber,
      companyName: Companies.companyName,
      representative: Companies.representative,
      accountManager: Companies.accountManager,
      customerGroup: Companies.customerGroup,
      region: Companies.region,
      isInactive: Companies.isInactive,
      city: visiting.city,
      postalCode: visiting.postalCode,
      country: visiting.country,
    })
    .from(Companies)
    .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
    .where(companyUuids ? inArray(Companies.uuid, companyUuids) : undefined);

  return new Map(
    rows.map((row) => [
      row.uuid,
      {
        ...row,
        city: row.city ?? null,
        postalCode: row.postalCode ?? null,
        country: row.country ?? null,
      },
    ]),
  );
};

/**
 * A company's invoiced revenue, excluding VAT, this year and last year — as a
 * subquery to left-join on `companyUuid`.
 *
 * Contacts used to carry `Revenue last year` / `Revenue this year` as stored
 * copies that nothing kept up to date. The reference prints them per contact
 * but they are company figures, so they are read from the invoices instead.
 */
export const companyRevenueByYear = (
  name: string,
  currentYear: number = new Date().getFullYear(),
) =>
  db
    .select({
      companyUuid: Invoices.companyUuid,
      revenueThisYear:
        sql<string>`COALESCE(SUM(CASE WHEN YEAR(${Invoices.invoiceDate}) = ${currentYear} THEN ${Invoices.invoiceAmountExclVat} ELSE 0 END), 0)`.as(
          `${name}_this_year`,
        ),
      revenueLastYear:
        sql<string>`COALESCE(SUM(CASE WHEN YEAR(${Invoices.invoiceDate}) = ${currentYear - 1} THEN ${Invoices.invoiceAmountExclVat} ELSE 0 END), 0)`.as(
          `${name}_last_year`,
        ),
    })
    .from(Invoices)
    .where(and(eq(Invoices.cancelled, false), isNotNull(Invoices.companyUuid)))
    .groupBy(Invoices.companyUuid)
    .as(name);

/**
 * Invoiced revenue on the two bases the visit schedule shows: the rolling
 * twelve months, and the calendar month before this one.
 *
 * Not the calendar year. The reference's `Revenue last 12 months` is a rolling
 * window, and it is live: it is non-zero on exactly three of its 2 531
 * companies — `Douma Staal` 296.43, `Universal Steel Holland` 14 400 and
 * `SHS Lochbleche Butzbach` 20 000 — each equal to that company's invoices from
 * 14-9-2025 onward ex VAT, on a file taken 14-9-2026. A calendar year would
 * have shown nine months on that date, which is why the schedule reads this
 * rather than `companyRevenueByYear`.
 *
 * `Revenue last month` is `0` on all 2 531 rows there, because it is fed by a
 * batch job that stopped running before the copy was taken. Ours is computed,
 * so it will show the real figure.
 */
export const companyRevenueRolling = (name: string) =>
  db
    .select({
      companyUuid: Invoices.companyUuid,
      revenueLast12Months:
        sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${Invoices.invoiceAmountExclVat} ELSE 0 END), 0)`.as(
          `${name}_last_12_months`,
        ),
      revenueLastMonth:
        sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) AND ${Invoices.invoiceDate} < DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN ${Invoices.invoiceAmountExclVat} ELSE 0 END), 0)`.as(
          `${name}_last_month`,
        ),
    })
    .from(Invoices)
    .where(and(eq(Invoices.cancelled, false), isNotNull(Invoices.companyUuid)))
    .groupBy(Invoices.companyUuid)
    .as(name);

/** Distinct invoices per company and month — C8's `#Invoices`. */
export const getInvoiceCountsByCompanyMonth = async (): Promise<
  Map<string, number>
> => {
  const rows = await db
    .select({
      companyUuid: Invoices.companyUuid,
      year: invoiceYear,
      month: invoiceMonth,
      invoices: count(Invoices.uuid),
    })
    .from(Invoices)
    .where(and(eq(Invoices.cancelled, false), isNotNull(Invoices.companyUuid)))
    .groupBy(Invoices.companyUuid, invoiceYear, invoiceMonth);

  return new Map(
    rows.map((row) => [
      `${row.companyUuid}|${Number(row.year)}|${Number(row.month)}`,
      Number(row.invoices),
    ]),
  );
};
