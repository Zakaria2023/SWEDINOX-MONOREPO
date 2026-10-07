"use server";

import { INVOICE_LINE_COLUMNS } from "@/app/(dashboard)/invoice-lines/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import {
  Invoices,
  SelectInvoices,
  InvoiceSurcharges,
} from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { INVOICE_SURCHARGE_REVENUE_GROUP_NUMBERS } from "@/lib/constants";
import { orderSourceTypes } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { INVOICE_SURCHARGE_DESCRIPTION_LABELS } from "@/lib/labels";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  FilterBindings,
  relationFilter,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  BranchSettings,
  SelectBranchSettings,
} from "@/db/schema/branch-settings";
import { and, eq, getTableColumns, isNotNull, sql } from "drizzle-orm";

/**
 * A billed line, of either kind.
 *
 * The reference's `Linetype` splits this screen in two: 5 180 order lines and
 * 470 **surcharge** lines, which have no order line at all and are quantified
 * in euros. Ours read only the order lines, so a tenth of the invoiced rows
 * were missing — the same omission the revenue-group screen had.
 */
export type InvoiceLineItem = {
  lineUuid: string;
  lineType: "orderline" | "surcharge";
  invoiceUuid: SelectInvoices["uuid"] | null;
  invoiceId: SelectInvoices["id"] | null;
  invoiceDate: SelectInvoices["invoiceDate"] | null;
  deliveryDate: SelectInvoiceItems["deliveryDate"] | null;
  orderId: number | null;
  orderUuid: string | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
  productCode: SelectProducts["productCode"] | null;
  description: string | null;
  commodityCode: SelectProducts["commodityCode"] | null;
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  sourceType: SelectOrderItems["sourceType"] | null;
  customerCode: SelectCompanies["id"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  customerName: SelectCompanies["companyName"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  debtorNumber: SelectCompanies["debtorNumber"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  representative: SelectCompanies["representative"] | null;
  region: SelectCompanies["region"] | null;
  /** The branch's own legal name, from the settings. */
  affiliateName: SelectBranchSettings["affiliateName"];
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  /** The Clerk id the line stores, and the name Clerk holds for it. */
  seller: string | null;
  sellerName: string | null;
  quantity: number;
  unit: string | null;
  lengthMm: SelectInvoiceItems["lengthMm"] | null;
  widthMm: SelectInvoiceItems["widthMm"] | null;
  weightKg: number;
  revenueProducts: number;
  revenueOptions: number;
  revenueLine: number;
  profitProducts: number;
  profitOptions: number;
  profitLine: number;
};

/**
 * One billed line as it is stored, for its own page.
 *
 * A different shape from the grid row on purpose: the grid is the reference's
 * report, which reads across the invoice, the order and the customer; the page
 * shows the line record itself, down to its cost and replacement price.
 */
export type InvoiceLineDetail = SelectInvoiceItems & {
  invoiceId: SelectInvoices["id"] | null;
  invoiceDate: SelectInvoices["invoiceDate"] | null;
  invoiceDocumentType: SelectInvoices["documentType"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  customerName: SelectCompanies["companyName"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
  orderUuid: SelectOrderItems["orderUuid"] | null;
};

// A cancelled invoice is void, and a line with no company cannot be reported
// against one.
const INVOICED = and(
  eq(Invoices.cancelled, false),
  isNotNull(Invoices.companyUuid),
);

// The charge's revenue group, resolved from its description the way the
// revenue screens resolve it.
const chargeGroupNumber = sql<number>`CASE ${InvoiceSurcharges.description} ${sql.join(
  Object.entries(INVOICE_SURCHARGE_REVENUE_GROUP_NUMBERS).map(
    ([description, number]) => sql`WHEN ${description} THEN ${number}`,
  ),
  sql` `,
)} ELSE 8900 END`;

const INVOICE_LINE_SEARCH = [
  Products.productCode,
  Products.name,
  Companies.companyName,
] as const;

const INVOICE_LINE_FILTERS: FilterBindings = {
  invoiceDate: dateRangeFilter(Invoices.invoiceDate),
  orderType: enumFilter(OrderItems.sourceType, orderSourceTypes),
  company: relationFilter(Invoices.companyUuid),
};

// A surcharge line has no order line, so the supply filter cannot apply to it.
const SURCHARGE_FILTERS: FilterBindings = {
  invoiceDate: dateRangeFilter(Invoices.invoiceDate),
  company: relationFilter(Invoices.companyUuid),
};

const visitingAddress = () =>
  db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      city: sql<string | null>`MIN(${CompanyAddresses.city})`.as("line_city"),
      country: sql<string | null>`MIN(${CompanyAddresses.country})`.as(
        "line_country",
      ),
    })
    .from(CompanyAddresses)
    .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, '"visit"')`)
    .groupBy(CompanyAddresses.companyUuid)
    .as("line_visiting");

/** The order lines of an invoice. */
const orderLineRows = async (query: TableQuery): Promise<InvoiceLineItem[]> => {
  const visiting = visitingAddress();

  const rows = await db
    .select({
      lineUuid: InvoiceItems.uuid,
      invoiceUuid: Invoices.uuid,
      invoiceId: Invoices.id,
      invoiceDate: Invoices.invoiceDate,
      deliveryDate: InvoiceItems.deliveryDate,
      orderId: Orders.id,
      orderUuid: Orders.uuid,
      lineNumber: OrderItems.lineNumber,
      productCode: Products.productCode,
      description: Products.name,
      commodityCode: Products.commodityCode,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      sourceType: OrderItems.sourceType,
      customerCode: Companies.id,
      companyUuid: Companies.uuid,
      customerName: Companies.companyName,
      customerGroup: Companies.customerGroup,
      debtorNumber: Companies.debtorNumber,
      vatNumber: Companies.vatNumber,
      representative: Companies.representative,
      region: Companies.region,
      affiliateName: sql<string | null>`(
        SELECT ${BranchSettings.affiliateName} FROM ${BranchSettings} LIMIT 1
      )`,
      city: visiting.city,
      country: visiting.country,
      seller: OrderItems.seller,
      quantity: InvoiceItems.quantity,
      unit: InvoiceItems.unit,
      lengthMm: InvoiceItems.lengthMm,
      widthMm: InvoiceItems.widthMm,
      weightKg: InvoiceItems.weightKg,
      revenueProducts: InvoiceItems.revenueProducts,
      revenueOptions: InvoiceItems.revenueOptions,
      revenueLine: InvoiceItems.amount,
      profitProducts: InvoiceItems.profitProducts,
      profitOptions: InvoiceItems.profitOptions,
      profitLine: InvoiceItems.profit,
    })
    .from(InvoiceItems)
    .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
    .leftJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
    .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .leftJoin(visiting, eq(visiting.companyUuid, Companies.uuid))
    .where(
      tableWhere({
        query,
        search: INVOICE_LINE_SEARCH,
        filters: INVOICE_LINE_FILTERS,
        scope: [INVOICED],
      }),
    );

  return rows.map((row) => ({
    ...row,
    lineType: "orderline" as const,
    quantity: Number(row.quantity ?? 0),
    weightKg: Number(row.weightKg ?? 0),
    revenueProducts: Number(row.revenueProducts ?? 0),
    revenueOptions: Number(row.revenueOptions ?? 0),
    revenueLine: Number(row.revenueLine ?? 0),
    profitProducts: Number(row.profitProducts ?? 0),
    profitOptions: Number(row.profitOptions ?? 0),
    profitLine: Number(row.profitLine ?? 0),
    sellerName: null,
  }));
};

/**
 * The surcharge lines of an invoice.
 *
 * They carry no order, no product and no order line — the reference prints
 * `Order line = 0` on exactly those rows — and they are quantified in euros.
 * The revenue group comes from the description: packaging and pallet to 8900,
 * transport to 8100, and decoiling to **3000**, which is the processing band,
 * because the band follows the thing sold rather than the kind of line.
 */
const surchargeLineRows = async (
  query: TableQuery,
): Promise<InvoiceLineItem[]> => {
  const visiting = visitingAddress();

  const rows = await db
    .select({
      lineUuid: InvoiceSurcharges.uuid,
      invoiceUuid: Invoices.uuid,
      invoiceId: Invoices.id,
      invoiceDate: Invoices.invoiceDate,
      description: InvoiceSurcharges.description,
      revenueGroupNumber: RevenueGroups.number,
      revenueGroupName: RevenueGroups.name,
      customerCode: Companies.id,
      companyUuid: Companies.uuid,
      customerName: Companies.companyName,
      customerGroup: Companies.customerGroup,
      debtorNumber: Companies.debtorNumber,
      vatNumber: Companies.vatNumber,
      representative: Companies.representative,
      region: Companies.region,
      affiliateName: sql<string | null>`(
        SELECT ${BranchSettings.affiliateName} FROM ${BranchSettings} LIMIT 1
      )`,
      city: visiting.city,
      country: visiting.country,
      unit: InvoiceSurcharges.unit,
      revenueLine: InvoiceSurcharges.amount,
      profitLine: InvoiceSurcharges.profit,
    })
    .from(InvoiceSurcharges)
    .innerJoin(Invoices, eq(InvoiceSurcharges.invoiceUuid, Invoices.uuid))
    .leftJoin(RevenueGroups, eq(RevenueGroups.number, chargeGroupNumber))
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .leftJoin(visiting, eq(visiting.companyUuid, Companies.uuid))
    .where(
      tableWhere({
        query,
        search: [Companies.companyName],
        filters: SURCHARGE_FILTERS,
        scope: [INVOICED],
      }),
    );

  return rows.map((row) => ({
    lineUuid: row.lineUuid,
    lineType: "surcharge" as const,
    invoiceUuid: row.invoiceUuid,
    invoiceId: row.invoiceId,
    invoiceDate: row.invoiceDate,
    deliveryDate: null,
    orderId: null,
    orderUuid: null,
    lineNumber: null,
    productCode: null,
    description: row.description
      ? INVOICE_SURCHARGE_DESCRIPTION_LABELS[row.description]
      : null,
    commodityCode: null,
    revenueGroupNumber: row.revenueGroupNumber,
    revenueGroupName: row.revenueGroupName,
    sourceType: null,
    customerCode: row.customerCode,
    companyUuid: row.companyUuid,
    customerName: row.customerName,
    customerGroup: row.customerGroup,
    debtorNumber: row.debtorNumber,
    vatNumber: row.vatNumber,
    representative: row.representative,
    region: row.region,
    affiliateName: row.affiliateName,
    city: row.city,
    country: row.country,
    seller: null,
    sellerName: null,
    // A surcharge is priced as a lump sum, so the quantity is the money and
    // the unit is the currency -- `QtyU = Euro` on 458 of the reference's 470.
    quantity: Number(row.revenueLine ?? 0),
    unit: "Euro",
    lengthMm: null,
    widthMm: null,
    weightKg: 0,
    revenueProducts: 0,
    revenueOptions: 0,
    revenueLine: Number(row.revenueLine ?? 0),
    profitProducts: 0,
    profitOptions: 0,
    profitLine: Number(row.profitLine ?? 0),
  }));
};

/**
 * Both kinds of line, newest invoice first.
 *
 * Merged after the database has filtered each kind, because an order line and
 * a surcharge line share no table and only some of their columns; the two
 * queries are already narrowed by the same invoice-date window and search.
 */
const invoiceLineRows = async (
  query: TableQuery,
): Promise<InvoiceLineItem[]> => {
  const lineTypes = query.filters.lineType ?? [];
  const wantOrderLines =
    lineTypes.length === 0 || lineTypes.includes("orderline");
  // Asking for a supply route excludes the surcharges: none of them have one.
  const wantSurcharges =
    (lineTypes.length === 0 || lineTypes.includes("surcharge")) &&
    (query.filters.orderType ?? []).length === 0;

  const orderLines = wantOrderLines ? await orderLineRows(query) : [];
  const surcharges = wantSurcharges ? await surchargeLineRows(query) : [];

  // The seller column stores a Clerk id; Clerk owns the names.
  const users = await getClerkUsersForSelect();
  const names = new Map(users.map((user) => [user.value, user.label]));
  for (const line of orderLines) {
    line.sellerName = line.seller
      ? (names.get(line.seller) ?? line.seller)
      : null;
  }

  return [...orderLines, ...surcharges].sort(
    (a, b) =>
      (b.invoiceId ?? 0) - (a.invoiceId ?? 0) ||
      (a.lineNumber ?? 0) - (b.lineNumber ?? 0),
  );
};

export const getInvoiceLines = async (
  query: TableQuery,
): Promise<Paged<InvoiceLineItem>> => {
  try {
    const rows = await invoiceLineRows(query);
    const start = (query.page - 1) * query.pageSize;

    return {
      rows: rows.slice(start, start + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch invoice lines"));
  }
};

export const exportInvoiceLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await invoiceLineRows(parseTableQuery(params));

  return exportRows({
    name: "Invoice lines",
    columns: INVOICE_LINE_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};

export const getInvoiceLineDetail = async (
  uuid: string,
): Promise<InvoiceLineDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(InvoiceItems),
      invoiceId: Invoices.id,
      invoiceDate: Invoices.invoiceDate,
      invoiceDocumentType: Invoices.documentType,
      companyUuid: Companies.uuid,
      customerName: Companies.companyName,
      vatNumber: Companies.vatNumber,
      productCode: Products.productCode,
      productName: Products.name,
      lineNumber: OrderItems.lineNumber,
      orderUuid: OrderItems.orderUuid,
    })
    .from(InvoiceItems)
    .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
    .leftJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .where(eq(InvoiceItems.uuid, uuid))
    .limit(1);

  return row ?? null;
};
