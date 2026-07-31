import "server-only";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { and, desc, eq, inArray, SQL, sql } from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core";

/**
 * What a product costs to buy, derived from the supplier invoices it has been
 * billed on. Products carry no purchase price of their own: the price is what a
 * supplier actually charged, so the purchase invoice is the only place it is
 * recorded and every cost figure in the app is read back from there.
 */
export type ProductPurchaseCost = {
  /** Weighted average of every booked invoice line for the product. */
  averagePurchasePrice: number;
  /**
   * The most recently invoiced price — what re-buying the article costs today,
   * so it is what a line is valued against where a replacement price was read
   * off the product before.
   */
  lastPurchasePrice: number;
  lastPurchaseDate: Date | string | null;
  lastPurchaseSupplier: string | null;
  lastPurchaseInvoiceNumber: string | null;
};

export const EMPTY_PURCHASE_COST: ProductPurchaseCost = {
  averagePurchasePrice: 0,
  lastPurchasePrice: 0,
  lastPurchaseDate: null,
  lastPurchaseSupplier: null,
  lastPurchaseInvoiceNumber: null,
};

// Only lines a supplier actually billed count towards a cost price. A cancelled
// invoice was never owed, and a credit note reverses a charge rather than
// setting one, so neither says what the article costs.
const bookedInvoice = and(
  eq(PurchaseInvoices.cancelled, false),
  eq(PurchaseInvoices.documentType, "invoice"),
);

// The newest invoice first. Invoice date is what the supplier priced on; the
// booking date stands in when they left it off, and the line id breaks a tie so
// two lines on one day still resolve to the same "latest" every time.
const newestFirst = [
  desc(sql`COALESCE(${PurchaseInvoices.invoiceDate}, ${PurchaseInvoices.bookingDate})`),
  desc(PurchaseInvoiceItems.id),
];

/**
 * The purchase cost of each named product, or of every product when no list is
 * given. Loaded in one pass rather than per line, since a document usually
 * repeats products.
 */
export const loadPurchaseCostByProduct = async (
  productUuids?: string[],
): Promise<Map<string, ProductPurchaseCost>> => {
  if (productUuids && productUuids.length === 0) {
    return new Map();
  }

  const scope = productUuids
    ? and(bookedInvoice, inArray(PurchaseInvoiceItems.productUuid, productUuids))
    : bookedInvoice;

  const [averages, lines] = await Promise.all([
    db
      .select({
        productUuid: PurchaseInvoiceItems.productUuid,
        value: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.netPrice} * ${PurchaseInvoiceItems.quantity}), 0)`,
        quantity: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)`,
      })
      .from(PurchaseInvoiceItems)
      .innerJoin(
        PurchaseInvoices,
        eq(PurchaseInvoices.uuid, PurchaseInvoiceItems.purchaseInvoiceUuid),
      )
      .where(scope)
      .groupBy(PurchaseInvoiceItems.productUuid),

    db
      .select({
        productUuid: PurchaseInvoiceItems.productUuid,
        netPrice: PurchaseInvoiceItems.netPrice,
        invoiceDate: PurchaseInvoices.invoiceDate,
        bookingDate: PurchaseInvoices.bookingDate,
        invoiceNumber: PurchaseInvoices.invoiceNumberSupplier,
        supplier: Companies.companyName,
      })
      .from(PurchaseInvoiceItems)
      .innerJoin(
        PurchaseInvoices,
        eq(PurchaseInvoices.uuid, PurchaseInvoiceItems.purchaseInvoiceUuid),
      )
      .leftJoin(Companies, eq(Companies.uuid, PurchaseInvoices.companyUuid))
      .where(scope)
      .orderBy(...newestFirst),
  ]);

  const costs = new Map<string, ProductPurchaseCost>();

  for (const row of averages) {
    const quantity = Number(row.quantity ?? 0);
    costs.set(row.productUuid, {
      ...EMPTY_PURCHASE_COST,
      averagePurchasePrice: quantity === 0 ? 0 : Number(row.value ?? 0) / quantity,
    });
  }

  // The rows arrive newest first, so the first sighting of a product is its
  // latest invoice line and every later one can be skipped.
  const seen = new Set<string>();
  for (const row of lines) {
    if (seen.has(row.productUuid)) {
      continue;
    }
    seen.add(row.productUuid);
    costs.set(row.productUuid, {
      ...(costs.get(row.productUuid) ?? EMPTY_PURCHASE_COST),
      lastPurchasePrice: Number(row.netPrice ?? 0),
      lastPurchaseDate: row.invoiceDate ?? row.bookingDate,
      lastPurchaseSupplier: row.supplier,
      lastPurchaseInvoiceNumber: row.invoiceNumber,
    });
  }

  return costs;
};

/** The purchase cost of one product, zeroed when it has never been invoiced. */
export const loadPurchaseCost = async (
  productUuid: string,
): Promise<ProductPurchaseCost> => {
  const costs = await loadPurchaseCostByProduct([productUuid]);
  return costs.get(productUuid) ?? EMPTY_PURCHASE_COST;
};

// ── In-query forms ──────────────────────────────────────────────────────────
// A report that already joins its own rows can't be handed a Map — it has to
// value each row inside the query. These render the same two figures as
// correlated subqueries against whichever product column the caller joins on.

const bookedInvoiceSql = sql`${PurchaseInvoices.cancelled} = FALSE AND ${PurchaseInvoices.documentType} = 'invoice'`;

export const averagePurchasePriceSql = (
  productUuid: MySqlColumn,
): SQL<string> => sql`(
    SELECT COALESCE(
      SUM(${PurchaseInvoiceItems.netPrice} * ${PurchaseInvoiceItems.quantity})
        / NULLIF(SUM(${PurchaseInvoiceItems.quantity}), 0),
      0
    )
    FROM ${PurchaseInvoiceItems}
    INNER JOIN ${PurchaseInvoices}
      ON ${PurchaseInvoices.uuid} = ${PurchaseInvoiceItems.purchaseInvoiceUuid}
    WHERE ${PurchaseInvoiceItems.productUuid} = ${productUuid}
      AND ${bookedInvoiceSql}
  )`;

// COALESCE wraps the subquery rather than the column: an article nobody has
// invoiced yet matches no rows at all, so the subquery itself is NULL and a
// COALESCE on the inside would never see it.
export const lastPurchasePriceSql = (productUuid: MySqlColumn): SQL<string> => sql`COALESCE((
    SELECT ${PurchaseInvoiceItems.netPrice}
    FROM ${PurchaseInvoiceItems}
    INNER JOIN ${PurchaseInvoices}
      ON ${PurchaseInvoices.uuid} = ${PurchaseInvoiceItems.purchaseInvoiceUuid}
    WHERE ${PurchaseInvoiceItems.productUuid} = ${productUuid}
      AND ${bookedInvoiceSql}
    ORDER BY
      COALESCE(${PurchaseInvoices.invoiceDate}, ${PurchaseInvoices.bookingDate}) DESC,
      ${PurchaseInvoiceItems.id} DESC
    LIMIT 1
  ), 0)`;
