"use server";

import {
  Companies,
  Contacts,
  db,
  InsertPurchaseInvoices,
  InsertPurchaseInvoiceSurcharges,
  PurchaseInvoices,
  PurchaseInvoiceSurcharges,
  SelectCompanies,
  SelectContacts,
  SelectPurchaseInvoices,
} from "@/db";
import {
  PurchaseInvoiceItems,
  SelectPurchaseInvoiceItems,
} from "@/db/schema/purchase-invoice-items";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { JournalEntries } from "@/db/schema/journal-entries";
import { mailDocument, sendPurchaseInvoiceEmail } from "@/emails/documents";
import { buildPurchaseJournalEntry } from "@/lib/server/ledger";
import { recordFreightMovement } from "@/lib/server/freight";
import { PurchaseOrderType, VatCode } from "@/lib/enums";
import {
  fiscalPeriodDate,
  generateUuid,
  getPaymentTermDueDate,
  purchaseBecomesStock,
  resolveSurchargeAmounts,
  restateLotValue,
  summarisePurchaseInvoice,
  toDateString,
} from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { invoiceDocumentTypes, purchaseInvoiceBlockReasons } from "@/lib/enums";
import {
  booleanFilter,
  dateRangeFilter,
  enumFilter,
  numberRangeFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import { PURCHASE_INVOICE_COLUMNS } from "@/app/(dashboard)/purchase-invoices/columns";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PurchaseInvoiceActionResult = {
  purchaseInvoiceUuid?: string;
  error?: string;
  success?: boolean;
};

// Everything the accounting summary derives is left out: a clerk keys the
// supplier's total and their credit restriction, and the document works the
// rest out from the lines it received.
export type PurchaseInvoiceFields = Omit<
  InsertPurchaseInvoices,
  | "id"
  | "uuid"
  | "materials"
  | "optionsAmount"
  | "surcharges"
  | "vatHigh"
  | "vatMiddle"
  | "vatLow"
  | "remainder"
  | "outstanding"
  | "createdAt"
  | "updatedAt"
>;

export type PurchaseInvoiceItemInput = {
  purchaseOrderItemUuid: string;
  quantity: string;
};

export type PurchaseInvoiceSurchargeInput = Omit<
  InsertPurchaseInvoiceSurcharges,
  "id" | "uuid" | "purchaseInvoiceUuid" | "createdAt" | "updatedAt"
>;

export type PurchaseInvoiceListItem = SelectPurchaseInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["id"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export type PurchaseInvoiceHeaderEdit = Pick<
  PurchaseInvoiceFields,
  | "invoiceNumberSupplier"
  | "creditorNo"
  | "creditorNo2"
  | "invoiceDate"
  | "expirationDate"
  | "paymentTerms"
  | "remarks"
  // The only two figures on this document a person types. Correcting either
  // re-derives the whole summary and moves the payable with it.
  | "invoiceTotal"
  | "creditRestriction"
>;

export type PurchaseInvoiceItemDetail = SelectPurchaseInvoiceItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseInvoiceDetail = SelectPurchaseInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["id"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  items: PurchaseInvoiceItemDetail[];
  movements: SelectStockMovements[];
};

const PURCHASE_INVOICE_SEARCH = [
  PurchaseInvoices.invoiceNumberSupplier,
  Companies.companyName,
] as const;

const PURCHASE_INVOICE_SORTABLE = {
  createdAt: PurchaseInvoices.createdAt,
  supplier: Companies.companyName,
  invoiceDate: PurchaseInvoices.invoiceDate,
  bookingDate: PurchaseInvoices.bookingDate,
  expirationDate: PurchaseInvoices.expirationDate,
  invoiceTotal: PurchaseInvoices.invoiceTotal,
  outstanding: PurchaseInvoices.outstanding,
};

// A purchase invoice is chased by supplier, period and whether it is held. Both
// `blocked` and `cancelled` are offered: a blocked invoice is one somebody has
// to resolve before it can be paid, and a cancelled one is invisible to every
// other screen's reasoning.
const PURCHASE_INVOICE_FILTERS = {
  documentType: enumFilter(PurchaseInvoices.documentType, invoiceDocumentTypes),
  supplier: relationFilter(PurchaseInvoices.companyUuid),
  blockReason: enumFilter(
    PurchaseInvoices.blockReason,
    purchaseInvoiceBlockReasons,
  ),
  invoiceDate: dateRangeFilter(PurchaseInvoices.invoiceDate),
  bookingDate: dateRangeFilter(PurchaseInvoices.bookingDate),
  outstanding: numberRangeFilter(PurchaseInvoices.outstanding),
  blocked: booleanFilter(PurchaseInvoices.blocked),
  cancelled: booleanFilter(PurchaseInvoices.cancelled),
};

/**
 * The rows one view of the purchase invoices overview selects, as a window onto
 * them. Shared by the page and the export.
 */
const purchaseInvoiceRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<PurchaseInvoiceListItem[]> =>
    db
      .select({
        ...getTableColumns(PurchaseInvoices),
        companyName: Companies.companyName,
        supplierCode: Companies.id,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseInvoices)
      .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
      .leftJoin(
        Contacts,
        eq(PurchaseInvoices.invoiceSentByContactUuid, Contacts.uuid),
      )
      .where(
        tableWhere({
          query,
          search: PURCHASE_INVOICE_SEARCH,
          filters: PURCHASE_INVOICE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          PURCHASE_INVOICE_SORTABLE,
          query,
          [desc(PurchaseInvoices.createdAt)],
          PurchaseInvoices.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every purchase invoice the current view matches, as a workbook. */
export const exportPurchaseInvoices = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase Invoices",
    columns: PURCHASE_INVOICE_COLUMNS,
    columnKeys,
    rows: purchaseInvoiceRows(parseTableQuery(params)),
  });

export const getPurchaseInvoices = async (
  query: TableQuery,
): Promise<Paged<PurchaseInvoiceListItem>> => {
  const where = tableWhere({
    query,
    search: PURCHASE_INVOICE_SEARCH,
    filters: PURCHASE_INVOICE_FILTERS,
  });

  return runPaged(query, {
    rows: purchaseInvoiceRows(query),

    count: async () => {
      const [row] = await db
        .select({ value: count() })
        .from(PurchaseInvoices)
        .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
        .where(where);
      return Number(row?.value ?? 0);
    },
  });
};

export const createPurchaseInvoice = async (
  fields: PurchaseInvoiceFields,
  items: PurchaseInvoiceItemInput[] = [],
  surcharges: PurchaseInvoiceSurchargeInput[] = [],
): Promise<PurchaseInvoiceActionResult> => {
  const uuid = generateUuid();
  try {
    // Validate the selected purchase-order lines before opening the
    // transaction. Receiving goods draws down the outstanding ordered quantity.
    const poItemByUuid = new Map<string, SelectPurchaseOrderItems>();
    const vatCodeByProduct = new Map<string, VatCode | null>();
    const purchaseTypeByOrder = new Map<string, PurchaseOrderType | null>();
    if (items.length > 0) {
      const poItemUuids = items.map((item) => item.purchaseOrderItemUuid);
      const poItemRows = await db
        .select()
        .from(PurchaseOrderItems)
        .where(inArray(PurchaseOrderItems.uuid, poItemUuids));
      for (const row of poItemRows) {
        poItemByUuid.set(row.uuid, row);
      }

      // Each line's VAT band comes from its own product, so an invoice mixing
      // rates reports each in the right box rather than all at the high rate.
      const productRows = await db
        .select({ uuid: Products.uuid, vatCode: Products.vatCode })
        .from(Products)
        .where(
          inArray(
            Products.uuid,
            poItemRows.map((row) => row.productUuid),
          ),
        );
      for (const row of productRows) {
        vatCodeByProduct.set(row.uuid, row.vatCode);
      }

      // What the orders behind these lines were for. Only a materials order
      // buys stock: a processing order buys labour on metal we already own, and
      // a customer-materials order works on metal that was never ours. Booking
      // either of those to inventory would put a value on the shelf twice, or
      // put somebody else's metal on it.
      const orderRows = await db
        .select({
          uuid: PurchaseOrders.uuid,
          purchaseOrderType: PurchaseOrders.purchaseOrderType,
        })
        .from(PurchaseOrders)
        .where(
          inArray(
            PurchaseOrders.uuid,
            poItemRows.flatMap((row) =>
              row.purchaseOrderUuid ? [row.purchaseOrderUuid] : [],
            ),
          ),
        );
      for (const row of orderRows) {
        purchaseTypeByOrder.set(row.uuid, row.purchaseOrderType);
      }

      for (const item of items) {
        const poItem = poItemByUuid.get(item.purchaseOrderItemUuid);
        if (!poItem) {
          return {
            error: "One or more selected order lines could not be found.",
          };
        }
        const remaining =
          Number(poItem.quantity) - Number(poItem.qtyReceived ?? 0);
        if (Number(item.quantity) <= 0) {
          return { error: "Received quantity must be greater than zero." };
        }
        if (Number(item.quantity) > remaining) {
          return {
            error: `Cannot receive more than the outstanding ordered quantity (${remaining.toFixed(3)}).`,
          };
        }
      }
    }

    const user = await currentUser();
    const userId = user?.id ?? null;
    // Receiving stock records who did it, so require an authenticated user.
    if (items.length > 0 && !userId) {
      return { error: "User not authenticated" };
    }

    // Derive the due date from the payment term when it isn't set and the term
    // pins a date to the supplier's invoice date (e.g. "within 30 days").
    const derivedExpiration =
      fields.expirationDate ??
      (() => {
        const due = getPaymentTermDueDate(
          fields.paymentTerms ?? null,
          fields.invoiceDate ? toDateString(fields.invoiceDate) : null,
        );
        return due ? new Date(`${due}T00:00:00`) : null;
      })();

    // The accounting summary, worked out from what was received rather than
    // typed. Previously the form submitted none of these figures, so materials
    // and VAT were always undefined — which meant every purchase invoice
    // posted a zero to the purchase journal while the payable took the typed
    // total. The ledger and the payable disagreed on every single one.
    const bookedLines = items.map((item) => {
      const poItem = poItemByUuid.get(item.purchaseOrderItemUuid);
      const netPrice = Number(poItem?.netPrice ?? 0);
      return {
        amount: netPrice * Number(item.quantity),
        vatCode: poItem
          ? (vatCodeByProduct.get(poItem.productUuid) ?? null)
          : null,
      };
    });

    // A surcharge charges its rate on the basis its description implies, so the
    // amount is resolved against what this invoice actually booked rather than
    // taken from the form, which only knows the rate.
    const pricedSurcharges = resolveSurchargeAmounts(surcharges, {
      goodsValue: bookedLines.reduce((sum, line) => sum + line.amount, 0),
      weightKg: items.reduce(
        (sum, item) => sum + Number(item.quantity ?? 0),
        0,
      ),
      lineCount: bookedLines.length,
    });

    // Whether this invoice puts anything on the shelf at all. A single invoice
    // covers one order in practice; where its lines come from several, it
    // capitalises only if every one of them was a materials order.
    const capitalisesStock =
      items.length === 0 ||
      items.every((item) => {
        const poItem = poItemByUuid.get(item.purchaseOrderItemUuid);
        const orderUuid = poItem?.purchaseOrderUuid ?? null;
        return purchaseBecomesStock(
          orderUuid ? purchaseTypeByOrder.get(orderUuid) : null,
        );
      });

    const summary = summarisePurchaseInvoice({
      lines: bookedLines,
      surcharges: pricedSurcharges.map((surcharge) =>
        Number(surcharge.amount ?? 0),
      ),
      creditRestriction: Number(fields.creditRestriction ?? 0),
      invoiceTotal: Number(fields.invoiceTotal ?? 0),
    });

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseInvoices).values({
        ...fields,
        expirationDate: derivedExpiration,
        uuid,
        materials: summary.materials.toFixed(2),
        optionsAmount: summary.optionsAmount.toFixed(2),
        surcharges: summary.surcharges.toFixed(2),
        vatHigh: summary.vatHigh.toFixed(2),
        vatMiddle: summary.vatMiddle.toFixed(2),
        vatLow: summary.vatLow.toFixed(2),
        remainder: summary.remainder.toFixed(2),
        // Owed to the supplier in full until payments are registered against
        // it. The document's own bottom line, which reconciles to the total on
        // their paperwork.
        outstanding: summary.totalGeneral.toFixed(2),
      });

      const [inserted] = await tx
        .select({ id: PurchaseInvoices.id })
        .from(PurchaseInvoices)
        .where(eq(PurchaseInvoices.uuid, uuid))
        .limit(1);

      await tx.insert(JournalEntries).values(
        buildPurchaseJournalEntry({
          purchaseInvoiceUuid: uuid,
          invoiceId: inserted?.id ?? null,
          companyUuid: fields.companyUuid ?? null,
          debCreditor: fields.creditorNo ?? null,
          // The period this lands in comes from the basis the invoice itself
          // names: the date it was booked, or the date the supplier put on the
          // document. The column said which and nothing read it.
          invoiceDate: fiscalPeriodDate(fields.basisForFiscalPeriod, {
            bookingDate: fields.bookingDate,
            documentDate: fields.invoiceDate,
          }),
          amountExclVat: summary.totalExclVat,
          vatAmount: summary.vatTotal,
          creditRestriction: summary.creditRestriction,
          remainder: summary.remainder,
          // The lines are what became stock — each one is priced at exactly the
          // figure its lot is valued at below. Surcharges bought no material, so
          // they stay a cost of buying rather than inflating the shelf.
          //
          // A processing or customer-materials order buys no stock at all, so
          // its whole invoice is a cost of buying rather than an asset.
          inventoryValue: capitalisesStock ? summary.materials : 0,
          userId,
        }),
      );

      for (const item of items) {
        const poItem = poItemByUuid.get(item.purchaseOrderItemUuid);
        if (!poItem) {
          continue;
        }
        if (!userId) {
          throw new Error("User not authenticated");
        }

        // Book the receipt against the PO line, guarding with the outstanding
        // quantity so a concurrent invoice can't over-receive the same line —
        // if another transaction already received it, affectedRows is 0 and we
        // roll back instead of double-booking stock.
        const [poUpdateResult] = await tx
          .update(PurchaseOrderItems)
          .set({
            qtyReceived: sql`${PurchaseOrderItems.qtyReceived} + ${item.quantity}`,
          })
          .where(
            and(
              eq(PurchaseOrderItems.uuid, item.purchaseOrderItemUuid),
              gte(
                sql`(${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived})`,
                item.quantity,
              ),
            ),
          );

        if (poUpdateResult.affectedRows === 0) {
          throw new Error(
            "The order line changed while processing this invoice — please refresh and try again.",
          );
        }

        // The goods physically arrive now: create the stock lot and log the
        // "in". This is the receipt — the purchase order only recorded intent.
        //
        // The lot is valued at what was agreed to pay for it. This is the
        // moment a cost enters the business: every sales order later drawn from
        // this lot is costed against this figure, so a lot received without one
        // would make every downstream margin a fiction.
        const valuationPrice = Number(poItem.netPrice ?? 0);
        const stockUuid = generateUuid();
        await tx.insert(Stock).values({
          uuid: stockUuid,
          productUuid: poItem.productUuid,
          purchaseOrderUuid: poItem.purchaseOrderUuid,
          purchaseOrderItemUuid: poItem.uuid,
          supplierUuid: fields.companyUuid ?? null,
          quantity: item.quantity,
          status: "pending",
          valuationPrice: valuationPrice.toFixed(4),
          valuationEuro: (valuationPrice * Number(item.quantity)).toFixed(2),
        });

        await tx.insert(PurchaseInvoiceItems).values({
          uuid: generateUuid(),
          purchaseInvoiceUuid: uuid,
          stockUuid,
          productUuid: poItem.productUuid,
          purchaseOrderItemUuid: poItem.uuid,
          quantity: item.quantity,
          // Snapshotted at receipt: re-pricing the purchase order afterwards
          // must not rewrite an invoice already posted.
          netPrice: valuationPrice.toFixed(4),
          amount: (valuationPrice * Number(item.quantity)).toFixed(2),
          vatCode: vatCodeByProduct.get(poItem.productUuid) ?? null,
        });

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: poItem.productUuid,
          stockUuid,
          type: "in",
          reason: "purchase_receipt",
          quantity: item.quantity,
          purchaseOrderUuid: poItem.purchaseOrderUuid,
          purchaseInvoiceUuid: uuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: poItem.productUuid,
          quantity: item.quantity,
          type: "in",
          reason: "purchase_receipt",
          purchaseOrderUuid: poItem.purchaseOrderUuid,
          supplierUuid: fields.companyUuid ?? null,
          operator: userId,
        });
      }

      if (pricedSurcharges.length > 0) {
        await tx.insert(PurchaseInvoiceSurcharges).values(
          pricedSurcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            purchaseInvoiceUuid: uuid,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase invoice",
    };
  }

  // Confirms to the supplier what we booked and what we received. Runs after
  // the transaction has committed and before the redirect, which throws.
  await mailDocument(
    () => sendPurchaseInvoiceEmail(uuid),
    `Purchase invoice ${uuid}`,
  );

  revalidatePath("/purchase-invoices");
  redirect("/purchase-invoices");
};

export const updatePurchaseInvoice = async (
  uuid: string,
  fields: PurchaseInvoiceHeaderEdit,
): Promise<PurchaseInvoiceActionResult> => {
  try {
    const [invoice] = await db
      .select({
        cancelled: PurchaseInvoices.cancelled,
        invoiceTotal: PurchaseInvoices.invoiceTotal,
        creditRestriction: PurchaseInvoices.creditRestriction,
        outstanding: PurchaseInvoices.outstanding,
      })
      .from(PurchaseInvoices)
      .where(eq(PurchaseInvoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Purchase invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "Cannot edit a cancelled purchase invoice." };
    }

    // Fill in the due date from the payment term when it wasn't set explicitly.
    const expirationDate =
      fields.expirationDate ??
      (() => {
        const due = getPaymentTermDueDate(
          fields.paymentTerms ?? null,
          fields.invoiceDate ? toDateString(fields.invoiceDate) : null,
        );
        return due ? new Date(`${due}T00:00:00`) : null;
      })();

    // Re-derive the summary from the lines that were received, against the
    // corrected supplier total and credit restriction.
    const lines = await db
      .select({
        amount: PurchaseInvoiceItems.amount,
        vatCode: PurchaseInvoiceItems.vatCode,
      })
      .from(PurchaseInvoiceItems)
      .where(eq(PurchaseInvoiceItems.purchaseInvoiceUuid, uuid));

    const surchargeRows = await db
      .select({ amount: PurchaseInvoiceSurcharges.amount })
      .from(PurchaseInvoiceSurcharges)
      .where(eq(PurchaseInvoiceSurcharges.purchaseInvoiceUuid, uuid));

    const summary = summarisePurchaseInvoice({
      lines: lines.map((line) => ({
        amount: Number(line.amount ?? 0),
        vatCode: line.vatCode,
      })),
      surcharges: surchargeRows.map((row) => Number(row.amount ?? 0)),
      creditRestriction: Number(
        fields.creditRestriction ?? invoice.creditRestriction ?? 0,
      ),
      invoiceTotal: Number(fields.invoiceTotal ?? invoice.invoiceTotal ?? 0),
    });

    // Move what is owed by the correction rather than resetting it: payments
    // already registered against this invoice must not be un-received.
    const outstanding =
      Number(invoice.outstanding) +
      (summary.totalGeneral - Number(invoice.invoiceTotal ?? 0));

    await db
      .update(PurchaseInvoices)
      .set({
        ...fields,
        expirationDate,
        materials: summary.materials.toFixed(2),
        optionsAmount: summary.optionsAmount.toFixed(2),
        surcharges: summary.surcharges.toFixed(2),
        vatHigh: summary.vatHigh.toFixed(2),
        vatMiddle: summary.vatMiddle.toFixed(2),
        vatLow: summary.vatLow.toFixed(2),
        remainder: summary.remainder.toFixed(2),
        outstanding: outstanding.toFixed(2),
      })
      .where(eq(PurchaseInvoices.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update purchase invoice",
    };
  }

  revalidatePath("/purchase-invoices");
  revalidatePath(`/purchase-invoices/${uuid}`);
  redirect(`/purchase-invoices/${uuid}`);
};

export const getPurchaseInvoiceDetail = async (
  uuid: string,
): Promise<PurchaseInvoiceDetail | null> => {
  const [invoice] = await db
    .select({
      ...getTableColumns(PurchaseInvoices),
      companyName: Companies.companyName,
      supplierCode: Companies.id,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(PurchaseInvoices)
    .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
    .leftJoin(
      Contacts,
      eq(PurchaseInvoices.invoiceSentByContactUuid, Contacts.uuid),
    )
    .where(eq(PurchaseInvoices.uuid, uuid))
    .limit(1);

  if (!invoice) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(PurchaseInvoiceItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(PurchaseInvoiceItems)
    .leftJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
    .where(eq(PurchaseInvoiceItems.purchaseInvoiceUuid, uuid));

  const movements = await db
    .select()
    .from(StockMovements)
    .where(eq(StockMovements.purchaseInvoiceUuid, uuid))
    .orderBy(desc(StockMovements.createdAt));

  return { ...invoice, items, movements };
};

export const cancelPurchaseInvoice = async (
  uuid: string,
): Promise<PurchaseInvoiceActionResult> => {
  try {
    const [invoice] = await db
      .select()
      .from(PurchaseInvoices)
      .where(eq(PurchaseInvoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Purchase invoice not found." };
    }

    if (invoice.cancelled) {
      return { error: "This purchase invoice is already cancelled." };
    }

    const items = await db
      .select()
      .from(PurchaseInvoiceItems)
      .where(eq(PurchaseInvoiceItems.purchaseInvoiceUuid, uuid));

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseInvoices)
        .set({ cancelled: true })
        .where(eq(PurchaseInvoices.uuid, uuid));

      // Reverse the purchase invoice's ledger posting.
      await tx.insert(JournalEntries).values(
        buildPurchaseJournalEntry({
          purchaseInvoiceUuid: uuid,
          invoiceId: invoice.id,
          companyUuid: invoice.companyUuid,
          debCreditor: invoice.creditorNo,
          invoiceDate: invoice.invoiceDate,
          amountExclVat:
            Number(invoice.materials) +
            Number(invoice.optionsAmount) +
            Number(invoice.surcharges),
          vatAmount:
            Number(invoice.vatHigh) +
            Number(invoice.vatMiddle) +
            Number(invoice.vatLow),
          creditRestriction: Number(invoice.creditRestriction),
          remainder: Number(invoice.remainder),
          // The lots this invoice created are pulled back out below, so the
          // inventory side reverses with them.
          inventoryValue: Number(invoice.materials),
          userId: userId ?? null,
          reversal: true,
        }),
      );

      for (const item of items) {
        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, item.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        // The receipt can only be reversed while the lot is still fully on hand
        // and unreserved — once any of it is reserved or sold, undoing the
        // invoice would leave stock in an impossible state, so block it.
        if (
          stockRow.status === "cancelled" ||
          Number(stockRow.reservedQuantity) > 0 ||
          Number(stockRow.quantity) < Number(item.quantity)
        ) {
          throw new Error(
            "Cannot cancel: received stock from this invoice has already been reserved or consumed.",
          );
        }

        const remainingQuantity = (
          Number(stockRow.quantity) - Number(item.quantity)
        ).toFixed(3);

        // Reverse the "in" — pull the received goods back out of stock, value
        // and all. Reducing the quantity alone left the lot still carrying what
        // was paid for goods that had been un-received, so cancelling a receipt
        // permanently overstated the shelf.
        await tx
          .update(Stock)
          .set({
            quantity: remainingQuantity,
            status: "cancelled",
            valuationEuro: restateLotValue({
              previousQuantity: Number(stockRow.quantity),
              remainingQuantity: Number(remainingQuantity),
              unitCost: Number(stockRow.valuationPrice ?? 0),
              previousValue: Number(stockRow.valuationEuro ?? 0),
            }).toFixed(2),
          })
          .where(eq(Stock.uuid, item.stockUuid));

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: item.productUuid,
          stockUuid: item.stockUuid,
          type: "out",
          reason: "invoice_cancelled",
          quantity: item.quantity,
          purchaseInvoiceUuid: uuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: item.productUuid,
          quantity: item.quantity,
          type: "out",
          reason: "invoice_cancelled",
          supplierUuid: invoice.companyUuid,
          valuationPrice: stockRow.valuationPrice,
          operator: userId,
        });

        // Give the received quantity back to the PO line so it can be
        // re-received on a corrected invoice.
        if (stockRow.purchaseOrderItemUuid) {
          await tx
            .update(PurchaseOrderItems)
            .set({
              qtyReceived: sql`GREATEST(${PurchaseOrderItems.qtyReceived} - ${item.quantity}, 0)`,
            })
            .where(eq(PurchaseOrderItems.uuid, stockRow.purchaseOrderItemUuid));
        }
      }
    });

    revalidatePath("/purchase-invoices");
    revalidatePath(`/purchase-invoices/${uuid}`);
    return { success: true, purchaseInvoiceUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel purchase invoice",
    };
  }
};
