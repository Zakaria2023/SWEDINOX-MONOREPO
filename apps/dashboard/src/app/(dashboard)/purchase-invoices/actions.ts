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
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { JournalEntries } from "@/db/schema/journal-entries";
import { mailDocument, sendPurchaseInvoiceEmail } from "@/emails/documents";
import { buildPurchaseJournalEntry } from "@/lib/server/ledger";
import { recordFreightMovement } from "@/lib/server/freight";
import { refreshPurchaseLineStatus } from "@/lib/server/purchase-lines";
import {
  PurchaseInvoiceBlockReason,
  PurchaseInvoiceStatus,
  purchaseInvoiceStatuses,
  PurchaseOrderType,
  VatCode,
} from "@/lib/enums";
import { alias } from "drizzle-orm/mysql-core";

// How a status reads in an error message.
const PURCHASE_INVOICE_STATUS_WORDS: Record<PurchaseInvoiceStatus, string> = {
  new: "new",
  released: "released",
  final: "final",
};
import {
  fiscalPeriodDate,
  generateUuid,
  getPaymentTermDueDate,
  moneyString,
  priceMeasureFor,
  purchaseBecomesStock,
  resolveSurchargeAmounts,
  restateLotValue,
  roundToCents,
  summarisePurchaseInvoice,
  toDateString,
  todayDateString,
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
  inArray,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * The weight an invoice line covers — the purchase line's weight scaled to the
 * quantity being invoiced, because a line is routinely invoiced in parts.
 *
 * Falls back to the line's whole weight when the planned quantity is unknown,
 * which is the only reading that does not silently value goods at nothing.
 */
const invoicedWeightKg = (
  poItem:
    | Pick<SelectPurchaseOrderItems, "qtyPlanned" | "kgPurchased">
    | undefined,
  invoicedQuantity: string | number,
): number => {
  const lineWeight = Number(poItem?.kgPurchased ?? 0);
  const plannedQty = Number(poItem?.qtyPlanned ?? 0);
  if (plannedQty <= 0) {
    return lineWeight;
  }
  return lineWeight * (Number(invoicedQuantity) / plannedQty);
};

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
  /** The company that billed us, when that is not the supplier. */
  sentByCompanyName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  /** The invoice's own bank, falling back to the supplier's current one. */
  iban: SelectCompanies["iban"] | null;
  /** The IBAN's country prefix, which is where the account is held. */
  bankCountry: string | null;
  /** The three VAT buckets added up. */
  vatAmount: number;
  /** Its lines' weights, so a tonne price can be checked without opening them. */
  weightKg: number;
  /** The period it posts in, on whichever date its fiscal basis names. */
  bookingPeriod: string | null;
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
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  lineNumber: SelectPurchaseOrderItems["lineNumber"] | null;
  unit: SelectPurchaseOrderItems["unit"] | null;
  lengthMm: SelectPurchaseOrderItems["lengthMm"] | null;
  priceUnit: SelectPurchaseOrderItems["priceUnit"] | null;
  deliveryDate: SelectPurchaseOrderItems["receiptDate"] | null;
  /** This line's share of its purchase line's weight. */
  weightKg: number;
};

export type PurchaseInvoiceDetail = SelectPurchaseInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["id"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  sentByCompanyName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  iban: SelectCompanies["iban"] | null;
  bankCountry: string | null;
  vatAmount: number;
  weightKg: number;
  bookingPeriod: string | null;
  /** Who last moved the status, resolved from the Clerk user id. */
  statusChangedByName: string | null;
  items: PurchaseInvoiceItemDetail[];
  movements: SelectStockMovements[];
};

// The supplier's city and country come off their visiting address.
const visiting = companyAddressFor("visit", "visiting_address");

// Who billed us, when that is not the supplier themselves.
const sender = alias(Companies, "invoice_sent_by_company");

// The invoice's own weight: its lines' weights, each the purchase line's weight
// scaled to the quantity invoiced.
const invoiceWeightSql = sql<number>`(
  SELECT COALESCE(SUM(
    CASE WHEN COALESCE(${PurchaseOrderItems.qtyPlanned}, 0) > 0
      THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
         * ${PurchaseInvoiceItems.quantity} / ${PurchaseOrderItems.qtyPlanned}
      ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
    END), 0)
  FROM ${PurchaseInvoiceItems}
  LEFT JOIN ${PurchaseOrderItems}
    ON ${PurchaseOrderItems.uuid} = ${PurchaseInvoiceItems.purchaseOrderItemUuid}
  WHERE ${PurchaseInvoiceItems.purchaseInvoiceUuid} = ${PurchaseInvoices.uuid}
)`;

// The accounting period, on whichever date the invoice's fiscal basis names —
// derived, exactly as the reference derives its "Booking period" column.
const bookingPeriodSql = sql<string | null>`DATE_FORMAT(
  CASE WHEN ${PurchaseInvoices.basisForFiscalPeriod} = 'document_date'
    THEN ${PurchaseInvoices.invoiceDate}
    ELSE COALESCE(${PurchaseInvoices.bookingDate}, ${PurchaseInvoices.invoiceDate})
  END, '%Y-%m')`;

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
  status: enumFilter(PurchaseInvoices.status, purchaseInvoiceStatuses),
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

// The bank the invoice is paid to and what it carries in VAT. The IBAN's first
// two letters are the country the account is held in, which is what the
// reference prints beside it.
const purchaseInvoiceBankAndVat = (
  iban: string | null,
  vat: { vatHigh: string | null; vatMiddle: string | null; vatLow: string | null },
) => ({
  iban,
  bankCountry: iban ? iban.slice(0, 2).toUpperCase() : null,
  vatAmount:
    Number(vat.vatHigh ?? 0) +
    Number(vat.vatMiddle ?? 0) +
    Number(vat.vatLow ?? 0),
});

/**
 * The rows one view of the purchase invoices overview selects, as a window onto
 * them. Shared by the page and the export.
 */
const purchaseInvoiceRows =
  (query: TableQuery) =>
  async (
    limit: number,
    offset: number,
  ): Promise<PurchaseInvoiceListItem[]> => {
    const rows = await db
      .select({
        ...getTableColumns(PurchaseInvoices),
        companyName: Companies.companyName,
        supplierCode: Companies.id,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
        sentByCompanyName: sender.companyName,
        city: visiting.city,
        country: visiting.country,
        vatNumber: Companies.vatNumber,
        supplierIban: Companies.iban,
        weightKg: invoiceWeightSql.mapWith(Number),
        bookingPeriod: bookingPeriodSql,
      })
      .from(PurchaseInvoices)
      .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .leftJoin(
        sender,
        eq(PurchaseInvoices.invoiceSentByCompanyUuid, sender.uuid),
      )
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

    return rows.map(({ supplierIban, ...row }) => ({
      ...row,
      city: row.city ?? null,
      country: row.country ?? null,
      ...purchaseInvoiceBankAndVat(row.iban ?? supplierIban, row),
    }));
  };

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
        if (Number(item.quantity) <= 0) {
          return { error: "Invoiced quantity must be greater than zero." };
        }
      }

      // 🔴 An invoice bills what **arrived**, not what is still to come.
      //
      // This used to measure against `quantity − qtyReceived`, the quantity
      // still owed by the supplier, and so refused a fully received line with
      // "cannot receive more than the outstanding ordered quantity (0.000)" —
      // which is every line anybody would ever want to invoice. A line becomes
      // billable at the moment it stops being receivable.
      const [alreadyInvoiced] = await db
        .select({
          purchaseOrderItemUuid: PurchaseInvoiceItems.purchaseOrderItemUuid,
          quantity: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)`,
        })
        .from(PurchaseInvoiceItems)
        .innerJoin(
          PurchaseInvoices,
          eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
        )
        .where(
          and(
            inArray(PurchaseInvoiceItems.purchaseOrderItemUuid, poItemUuids),
            eq(PurchaseInvoices.cancelled, false),
          ),
        )
        .groupBy(PurchaseInvoiceItems.purchaseOrderItemUuid);

      const invoicedByLine = new Map<string, number>();
      if (alreadyInvoiced?.purchaseOrderItemUuid) {
        invoicedByLine.set(
          alreadyInvoiced.purchaseOrderItemUuid,
          Number(alreadyInvoiced.quantity),
        );
      }

      for (const item of items) {
        const poItem = poItemByUuid.get(item.purchaseOrderItemUuid);
        if (!poItem) {
          continue;
        }
        const billable =
          Number(poItem.qtyReceived ?? 0) -
          (invoicedByLine.get(poItem.uuid) ?? 0);
        if (billable <= 0) {
          return {
            error: `Line ${poItem.lineNumber ?? ""} has nothing left to invoice — nothing has been received against it, or it is already fully billed.`,
          };
        }
        if (Number(item.quantity) > billable) {
          return {
            error: `Cannot invoice more than has arrived and is still unbilled (${billable.toFixed(3)}).`,
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

    // The bank we are to pay, as it stands now. Snapshotted with the invoice so
    // a later change to the supplier's details cannot rewrite what an old
    // invoice was paid to.
    const [supplier] = fields.companyUuid
      ? await db
          .select({ iban: Companies.iban })
          .from(Companies)
          .where(eq(Companies.uuid, fields.companyUuid))
          .limit(1)
      : [];

    // The accounting summary, worked out from what was received rather than
    // typed. Previously the form submitted none of these figures, so materials
    // and VAT were always undefined — which meant every purchase invoice
    // posted a zero to the purchase journal while the payable took the typed
    // total. The ledger and the payable disagreed on every single one.
    const bookedLines = items.map((item) => {
      const poItem = poItemByUuid.get(item.purchaseOrderItemUuid);
      const netPrice = Number(poItem?.netPrice ?? 0);
      const quantity = Number(item.quantity);
      // A purchase price is struck per tonne far more often than per piece, so
      // what the journal takes is the measure the price's own unit names — a
      // piece count times a tonne price is out by three orders of magnitude,
      // and a tonne measure against a per-piece price is wrong the other way.
      const measure =
        priceMeasureFor(poItem?.priceUnit, {
          quantity,
          weightKg: invoicedWeightKg(poItem, item.quantity),
          lengthMm: poItem?.lengthMm,
          widthMm: poItem?.widthMm,
          thicknessMm: Number(poItem?.thicknessMm ?? 0),
        }) ?? quantity;
      return {
        amount: roundToCents(netPrice * measure),
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
        // The reference books this automatically rather than asking for it, and
        // the period an invoice posts in is derived from it.
        bookingDate:
          fields.bookingDate ??
          fields.invoiceDate ??
          new Date(`${todayDateString()}T00:00:00`),
        iban: supplier?.iban ?? null,
        status: "new",
        statusChangedByUserId: userId,
        statusChangedAt: new Date(),
        materials: moneyString(summary.materials),
        optionsAmount: moneyString(summary.optionsAmount),
        surcharges: moneyString(summary.surcharges),
        vatHigh: moneyString(summary.vatHigh),
        vatMiddle: moneyString(summary.vatMiddle),
        vatLow: moneyString(summary.vatLow),
        remainder: moneyString(summary.remainder),
        // Owed to the supplier in full until payments are registered against
        // it. The document's own bottom line, which reconciles to the total on
        // their paperwork.
        outstanding: moneyString(summary.totalGeneral),
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

        // 🔴 An invoice does not receive anything, so it must not move
        // `qtyReceived`.
        //
        // This used to add the invoiced quantity to it, guarded by "is there
        // enough still outstanding to receive" — the last of three places that
        // treated billing as receiving. The unloading work order had already
        // taken the line to 10 of 10, so the guard asked `(10 − 10) >= 10`,
        // found nothing to update and threw *"the order line changed while
        // processing this invoice"* on every well-formed invoice. Had it
        // succeeded it would have been worse: a 10-piece line would read 20
        // received.
        //
        // How much of the line has been billed is read back from the invoice
        // rows themselves, which is what `refreshPurchaseLineStatus` does below
        // when it moves the line to `invoiced`.

        // The lot is valued at what was agreed to pay for it. This is the
        // moment a cost enters the business: every sales order later drawn from
        // this lot is costed against this figure, so a lot received without one
        // would make every downstream margin a fiction.
        const linePrice = Number(poItem.netPrice ?? 0);
        // The lot's weight comes with it: every kilo figure downstream — the
        // stock position, its value, the goods-flow return — is this number,
        // and a lot received without one weighs nothing for ever after.
        const receivedWeightKg = invoicedWeightKg(poItem, item.quantity);
        const invoicedQty = Number(item.quantity);

        // The price is per the line's own unit, so it cannot be multiplied by a
        // piece count. Proved on the reference's 2 247 lots: `Stock (€) =
        // valuation price × the measure that unit names`, right to the cent on
        // 2 114 of the 2 115 that carry a price.
        const measure =
          priceMeasureFor(poItem.priceUnit, {
            quantity: invoicedQty,
            weightKg: receivedWeightKg,
            lengthMm: poItem.lengthMm,
            widthMm: poItem.widthMm,
            thicknessMm: Number(poItem.thicknessMm ?? 0),
          }) ?? invoicedQty;
        const lineAmount = roundToCents(linePrice * measure);
        // 🔴 An invoice never creates stock. Watched end to end on 21-9-2026:
        // purchase order 401141 was released, confirmed, pre-notified and had
        // both its reception and its unloading work order standing — with
        // `Kg(a)` 0 on every panel and no lot anywhere. The five lots appeared
        // at the moment the work order was *reported*, and no invoice was
        // involved at any point.
        //
        // This used to create a lot when it could not find one. That fallback
        // was written when no approved unloading existed in our data, and it is
        // now the thing that would put the same steel in the warehouse twice.
        // An invoice for goods nobody booked in is a real problem upstream, so
        // it is surfaced rather than papered over.
        const [receivedLot] = await tx
          .select({ uuid: Stock.uuid })
          .from(Stock)
          .where(eq(Stock.purchaseOrderItemUuid, poItem.uuid))
          .limit(1);

        if (!receivedLot) {
          throw new Error(
            `Line ${poItem.lineNumber ?? ""} has no stock: nothing was ever booked in against it. Report the unloading work order for this purchase order first, then invoice it.`,
          );
        }

        const stockUuid = receivedLot.uuid;

        await tx.insert(PurchaseInvoiceItems).values({
          uuid: generateUuid(),
          purchaseInvoiceUuid: uuid,
          stockUuid,
          productUuid: poItem.productUuid,
          purchaseOrderItemUuid: poItem.uuid,
          quantity: item.quantity,
          // Snapshotted at receipt: re-pricing the purchase order afterwards
          // must not rewrite an invoice already posted.
          netPrice: linePrice.toFixed(4),
          amount: moneyString(lineAmount),
          vatCode: vatCodeByProduct.get(poItem.productUuid) ?? null,
        });

        // 🔴 No movement here. The goods arrived once, and the unloading work
        // order already recorded it — a `warehouse_receipt` row in
        // `StockMovements` and another in `FreightMovements`, both written when
        // the bundle was reported. Writing a second pair as `purchase_receipt`
        // booked the same steel into both ledgers twice: `/stock-movements`
        // showed one arrival as two `in` rows, and Freight flow counted the
        // tonnage again.
        //
        // The lot lookup above stays, because an invoice for goods nobody
        // booked in is a real problem and is surfaced rather than papered over.
        // But paying for metal is not the metal turning up.
      }

      // Every line this invoice touched is now received and invoiced further.
      for (const item of items) {
        if (poItemByUuid.has(item.purchaseOrderItemUuid)) {
          await refreshPurchaseLineStatus(tx, item.purchaseOrderItemUuid);
        }
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
        status: PurchaseInvoices.status,
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
    if (invoice.status === "final") {
      return { error: "A final purchase invoice can no longer be changed." };
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
        materials: moneyString(summary.materials),
        optionsAmount: moneyString(summary.optionsAmount),
        surcharges: moneyString(summary.surcharges),
        vatHigh: moneyString(summary.vatHigh),
        vatMiddle: moneyString(summary.vatMiddle),
        vatLow: moneyString(summary.vatLow),
        remainder: moneyString(summary.remainder),
        outstanding: moneyString(outstanding),
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
      sentByCompanyName: sender.companyName,
      city: visiting.city,
      country: visiting.country,
      vatNumber: Companies.vatNumber,
      supplierIban: Companies.iban,
      weightKg: invoiceWeightSql.mapWith(Number),
      bookingPeriod: bookingPeriodSql,
    })
    .from(PurchaseInvoices)
    .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
    .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
    .leftJoin(
      sender,
      eq(PurchaseInvoices.invoiceSentByCompanyUuid, sender.uuid),
    )
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
      purchaseOrderId: PurchaseOrders.id,
      lineNumber: PurchaseOrderItems.lineNumber,
      unit: PurchaseOrderItems.unit,
      lengthMm: PurchaseOrderItems.lengthMm,
      priceUnit: PurchaseOrderItems.priceUnit,
      deliveryDate: PurchaseOrderItems.receiptDate,
      weightKg: sql<number>`(
        CASE WHEN COALESCE(${PurchaseOrderItems.qtyPlanned}, 0) > 0
          THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
             * ${PurchaseInvoiceItems.quantity} / ${PurchaseOrderItems.qtyPlanned}
          ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
        END)`.mapWith(Number),
    })
    .from(PurchaseInvoiceItems)
    .leftJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
    .leftJoin(
      PurchaseOrderItems,
      eq(PurchaseInvoiceItems.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .leftJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .where(eq(PurchaseInvoiceItems.purchaseInvoiceUuid, uuid));

  const movements = await db
    .select()
    .from(StockMovements)
    .where(eq(StockMovements.purchaseInvoiceUuid, uuid))
    .orderBy(desc(StockMovements.createdAt));

  // Who last moved the status, as a name rather than a Clerk id.
  const users = invoice.statusChangedByUserId
    ? await getClerkUsersForSelect()
    : [];
  const statusChangedByName =
    users.find((user) => user.value === invoice.statusChangedByUserId)?.label ??
    invoice.statusChangedByUserId;

  const { supplierIban, ...header } = invoice;

  return {
    ...header,
    city: header.city ?? null,
    country: header.country ?? null,
    ...purchaseInvoiceBankAndVat(header.iban ?? supplierIban, header),
    statusChangedByName,
    items,
    movements,
  };
};

/**
 * Moves an invoice's status, recording who did it and when — the audit line the
 * reference prints under the document's title.
 *
 * `new` → `released` approves it for payment; `released` → `final` closes it,
 * after which it can be neither edited nor cancelled.
 */
const movePurchaseInvoiceStatus = async (
  uuid: string,
  from: PurchaseInvoiceStatus,
  to: PurchaseInvoiceStatus,
): Promise<PurchaseInvoiceActionResult> => {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const [invoice] = await db
      .select({
        status: PurchaseInvoices.status,
        cancelled: PurchaseInvoices.cancelled,
      })
      .from(PurchaseInvoices)
      .where(eq(PurchaseInvoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Purchase invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "This purchase invoice is cancelled." };
    }
    if (invoice.status !== from) {
      return {
        error: `Only a ${PURCHASE_INVOICE_STATUS_WORDS[from]} invoice can be moved to ${PURCHASE_INVOICE_STATUS_WORDS[to]}.`,
      };
    }

    await db
      .update(PurchaseInvoices)
      .set({
        status: to,
        statusChangedByUserId: userId,
        statusChangedAt: new Date(),
      })
      .where(eq(PurchaseInvoices.uuid, uuid));

    revalidatePath("/purchase-invoices");
    revalidatePath(`/purchase-invoices/${uuid}`);
    return { success: true, purchaseInvoiceUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to change the invoice status",
    };
  }
};

/** Approve the invoice for payment. */
export const releasePurchaseInvoice = async (
  uuid: string,
): Promise<PurchaseInvoiceActionResult> =>
  movePurchaseInvoiceStatus(uuid, "new", "released");

/** Close the invoice: no more edits, no cancelling. */
export const finalisePurchaseInvoice = async (
  uuid: string,
): Promise<PurchaseInvoiceActionResult> =>
  movePurchaseInvoiceStatus(uuid, "released", "final");

/**
 * Hold an invoice back from payment, or let it go — the reference's `Unblock`
 * button. A hold always names its reason.
 */
export const setPurchaseInvoiceBlocked = async (
  uuid: string,
  blocked: boolean,
  blockReason: PurchaseInvoiceBlockReason | null = null,
): Promise<PurchaseInvoiceActionResult> => {
  try {
    if (blocked && !blockReason) {
      return { error: "Choose why this invoice is held." };
    }

    const [invoice] = await db
      .select({
        cancelled: PurchaseInvoices.cancelled,
        status: PurchaseInvoices.status,
      })
      .from(PurchaseInvoices)
      .where(eq(PurchaseInvoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Purchase invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "This purchase invoice is cancelled." };
    }
    if (invoice.status === "final") {
      return { error: "A final purchase invoice can no longer be changed." };
    }

    await db
      .update(PurchaseInvoices)
      .set({ blocked, blockReason: blocked ? blockReason : null })
      .where(eq(PurchaseInvoices.uuid, uuid));

    revalidatePath("/purchase-invoices");
    revalidatePath(`/purchase-invoices/${uuid}`);
    return { success: true, purchaseInvoiceUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to change the invoice hold",
    };
  }
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
    if (invoice.status === "final") {
      return { error: "A final purchase invoice can no longer be cancelled." };
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
            valuationEuro: moneyString(
              restateLotValue({
                previousQuantity: Number(stockRow.quantity),
                remainingQuantity: Number(remainingQuantity),
                unitCost: Number(stockRow.valuationPrice ?? 0),
                previousValue: Number(stockRow.valuationEuro ?? 0),
              }),
            ),
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

          // The invoice is already marked cancelled above, so it no longer
          // counts towards the line's invoiced quantity.
          await refreshPurchaseLineStatus(
            tx,
            stockRow.purchaseOrderItemUuid,
            true,
          );
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
