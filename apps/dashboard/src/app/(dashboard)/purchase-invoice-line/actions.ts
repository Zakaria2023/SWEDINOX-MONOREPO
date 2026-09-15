"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseInvoiceItems,
  SelectPurchaseInvoiceItems,
} from "@/db/schema/purchase-invoice-items";
import {
  PurchaseInvoices,
  SelectPurchaseInvoices,
} from "@/db/schema/purchase-invoices";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { SelectStock, Stock } from "@/db/schema/stock";
import { PURCHASE_INVOICE_LINE_COLUMNS } from "@/app/(dashboard)/purchase-invoice-line/columns";
import { exportRows } from "@/lib/server/excel";
import { runPaged, tableOrderBy, tableWhere } from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  lte,
  sql,
} from "drizzle-orm";

// The supplier's country is its visiting address.
const visiting = companyAddressFor("visit", "visiting_address");

// The weight an invoice line covers: its purchase line's weight scaled to the
// quantity invoiced — the same share the receipt weighed the lot at.
const weightKgSql = sql<number>`(
  CASE WHEN COALESCE(${PurchaseOrderItems.qtyPlanned}, 0) > 0
    THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
       * ${PurchaseInvoiceItems.quantity} / ${PurchaseOrderItems.qtyPlanned}
    ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
  END
)`;

// The reference filters on "Bookings date". An invoice booked without one
// falls back to its own invoice date rather than dropping out of every range.
const bookingDateSql = sql`COALESCE(${PurchaseInvoices.bookingDate}, ${PurchaseInvoices.invoiceDate})`;

const PURCHASE_INVOICE_LINE_SEARCH = [
  Products.productCode,
  Products.name,
  Products.commodityCode,
  Companies.companyName,
] as const;

const PURCHASE_INVOICE_LINE_SORTABLE = {
  invoiceDate: PurchaseInvoices.invoiceDate,
  supplier: Companies.companyName,
  commodityCode: Products.commodityCode,
  productCode: Products.productCode,
};

const PURCHASE_INVOICE_LINE_FILTERS = {
  bookingDate: (values: string[]) => {
    const [from, to] = (values[0] ?? "").split("..");
    return and(
      from ? gte(bookingDateSql, from) : undefined,
      to ? lte(bookingDateSql, to) : undefined,
    );
  },
};

// A cancelled invoice bought nothing, so none of its lines belong in a
// goods-flow return.
const PURCHASE_INVOICE_LINE_SCOPE = [eq(PurchaseInvoices.cancelled, false)];

export type PurchaseInvoiceLineRow = {
  uuid: SelectPurchaseInvoiceItems["uuid"];
  invoiceId: SelectPurchaseInvoices["id"];
  invoiceDate: SelectPurchaseInvoices["invoiceDate"];
  /** Derived from the invoice date — the reference groups by them. */
  year: number | null;
  month: number | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  /** The order number typed on the invoice, for a line with no order behind it. */
  purchaseOrderNumber: SelectPurchaseInvoices["purchaseOrderNumber"];
  lineNumber: SelectPurchaseOrderItems["lineNumber"] | null;
  /** "CBS no." — the product's commodity code. */
  commodityCode: SelectProducts["commodityCode"] | null;
  country: SelectCompanyAddresses["country"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  weightKg: number;
  quantity: SelectPurchaseInvoiceItems["quantity"];
  /** "Revenue products" — what the line was invoiced at. */
  amount: number;
  vatNumber: SelectCompanies["vatNumber"] | null;
};

export type PurchaseInvoiceLineTotals = {
  weightKg: number;
  quantity: number;
  amount: number;
};

export type PurchaseInvoiceLinesPage = Paged<PurchaseInvoiceLineRow> & {
  /** Over every line the view matches, not just this page. */
  totals: PurchaseInvoiceLineTotals;
};

export type PurchaseInvoiceLineDetail = SelectPurchaseInvoiceItems & {
  invoiceId: SelectPurchaseInvoices["id"] | null;
  invoiceDate: SelectPurchaseInvoices["invoiceDate"] | null;
  cancelled: SelectPurchaseInvoices["cancelled"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseOrderNumber: SelectPurchaseInvoices["purchaseOrderNumber"] | null;
  lineNumber: SelectPurchaseOrderItems["lineNumber"] | null;
  commodityCode: SelectProducts["commodityCode"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  supplierUuid: SelectCompanies["uuid"] | null;
  country: SelectCompanyAddresses["country"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  valuationPrice: SelectStock["valuationPrice"] | null;
  weightKg: number;
};

const purchaseInvoiceLineWhere = (query: TableQuery) =>
  tableWhere({
    query,
    search: PURCHASE_INVOICE_LINE_SEARCH,
    filters: PURCHASE_INVOICE_LINE_FILTERS,
    scope: PURCHASE_INVOICE_LINE_SCOPE,
  });

/**
 * The rows one view of Purchase invoice line selects — the reference's
 * "CBS - IRIS" layout for the goods-flow return, one row per invoice line.
 */
const purchaseInvoiceLineRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<PurchaseInvoiceLineRow[]> =>
    db
      .select({
        uuid: PurchaseInvoiceItems.uuid,
        invoiceId: PurchaseInvoices.id,
        invoiceDate: PurchaseInvoices.invoiceDate,
        year: sql<number | null>`YEAR(${PurchaseInvoices.invoiceDate})`.mapWith(
          Number,
        ),
        month: sql<
          number | null
        >`MONTH(${PurchaseInvoices.invoiceDate})`.mapWith(Number),
        purchaseOrderId: PurchaseOrders.id,
        purchaseOrderNumber: PurchaseInvoices.purchaseOrderNumber,
        lineNumber: PurchaseOrderItems.lineNumber,
        commodityCode: Products.commodityCode,
        country: visiting.country,
        supplierName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
        weightKg: weightKgSql.mapWith(Number),
        quantity: PurchaseInvoiceItems.quantity,
        amount: sql<number>`COALESCE(${PurchaseInvoiceItems.amount}, 0)`.mapWith(
          Number,
        ),
        vatNumber: Companies.vatNumber,
      })
      .from(PurchaseInvoiceItems)
      .innerJoin(
        PurchaseInvoices,
        eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .leftJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrderItems,
        eq(PurchaseInvoiceItems.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(purchaseInvoiceLineWhere(query))
      .orderBy(
        ...tableOrderBy(
          PURCHASE_INVOICE_LINE_SORTABLE,
          query,
          [desc(PurchaseInvoices.invoiceDate)],
          PurchaseInvoiceItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every line the current view matches, as a workbook. */
export const exportPurchaseInvoiceLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase invoice line",
    columns: PURCHASE_INVOICE_LINE_COLUMNS,
    columnKeys,
    rows: purchaseInvoiceLineRows(parseTableQuery(params)),
  });

export const getPurchaseInvoiceLines = async (
  query: TableQuery,
): Promise<PurchaseInvoiceLinesPage> => {
  try {
    const page = await runPaged(query, {
      rows: purchaseInvoiceLineRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(PurchaseInvoiceItems)
          .innerJoin(
            PurchaseInvoices,
            eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
          )
          .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
          .leftJoin(
            Products,
            eq(PurchaseInvoiceItems.productUuid, Products.uuid),
          )
          .where(purchaseInvoiceLineWhere(query));
        return Number(row?.value ?? 0);
      },
    });

    // The reference sums Weight and Qty in its footer. Summed over the whole
    // view, so the figure a return is filed on does not depend on paging.
    const [totals] = await db
      .select({
        weightKg: sql<string>`COALESCE(SUM(${weightKgSql}), 0)`,
        quantity: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)`,
        amount: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.amount}), 0)`,
      })
      .from(PurchaseInvoiceItems)
      .innerJoin(
        PurchaseInvoices,
        eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrderItems,
        eq(PurchaseInvoiceItems.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .where(purchaseInvoiceLineWhere(query));

    return {
      ...page,
      totals: {
        weightKg: Number(totals?.weightKg ?? 0),
        quantity: Number(totals?.quantity ?? 0),
        amount: Number(totals?.amount ?? 0),
      },
    };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch purchase invoice lines"),
    );
  }
};

/**
 * One purchase invoice line with the invoice, supplier, product, the purchase
 * order line it was booked against and the stock lot it received into.
 *
 * The supplier's country comes off their visiting address, as in the overview.
 */
export const getPurchaseInvoiceLineDetail = async (
  uuid: string,
): Promise<PurchaseInvoiceLineDetail | null> => {
  try {
    const [row] = await db
      .select({
        ...getTableColumns(PurchaseInvoiceItems),
        invoiceId: PurchaseInvoices.id,
        invoiceDate: PurchaseInvoices.invoiceDate,
        cancelled: PurchaseInvoices.cancelled,
        purchaseOrderId: PurchaseOrders.id,
        purchaseOrderNumber: PurchaseInvoices.purchaseOrderNumber,
        lineNumber: PurchaseOrderItems.lineNumber,
        commodityCode: Products.commodityCode,
        supplierName: Companies.companyName,
        supplierUuid: Companies.uuid,
        country: visiting.country,
        vatNumber: Companies.vatNumber,
        productCode: Products.productCode,
        productName: Products.name,
        valuationPrice: Stock.valuationPrice,
        weightKg: weightKgSql.mapWith(Number),
      })
      .from(PurchaseInvoiceItems)
      .leftJoin(
        PurchaseInvoices,
        eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .leftJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrderItems,
        eq(PurchaseInvoiceItems.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Stock, eq(PurchaseInvoiceItems.stockUuid, Stock.uuid))
      .where(eq(PurchaseInvoiceItems.uuid, uuid))
      .limit(1);

    if (!row) {
      return null;
    }

    return { ...row, country: row.country ?? null };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch purchase invoice line"),
    );
  }
};
