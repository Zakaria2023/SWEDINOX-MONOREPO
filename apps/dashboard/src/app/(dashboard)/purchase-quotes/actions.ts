"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  InsertPurchaseQuotes,
  PurchaseQuotes,
  PurchaseQuoteSurcharges,
  SelectPurchaseQuotes,
} from "@/db/schema/purchase-quotes";
import {
  InsertPurchaseQuoteItems,
  PurchaseQuoteItems,
  SelectPurchaseQuoteItems,
} from "@/db/schema/purchase-quote-items";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { PurchaseRequests } from "@/db/schema/purchase-requests";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { resolveCompanyType } from "@/app/(dashboard)/companies/actions";
import { PURCHASE_QUOTE_LINE_COLUMNS } from "@/app/(dashboard)/purchase-quotes/columns";
import {
  PurchaseQuoteExpirationReason,
  purchaseQuoteExpirationReasons,
  purchaseQuoteStatuses,
} from "@/lib/enums";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { exportRows } from "@/lib/server/excel";
import { syncPurchaseLineReceiptDates } from "@/lib/server/purchase-lines";
import {
  dateRangeFilter,
  enumFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  amountForWeight,
  describeError,
  generateUuid,
  purchaseSourceTypeFor,
  getQuoteVatRatePercent,
  isPurchaseQuoteEditable,
  moneyString,
  netPriceAfterDiscounts,
  personInitials,
  productPieceWeightKg,
  todayDateString,
} from "@/lib/helpers";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  inArray,
  lt,
  ne,
  sql,
} from "drizzle-orm";
import { coverSalesLineWithPurchase } from "@/lib/server/cross-dock";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PURCHASE_QUOTE_LINE_SEARCH = [
  Products.productCode,
  Products.name,
  Companies.companyName,
  PurchaseQuotes.quoteNumber,
] as const;

const PURCHASE_QUOTE_LINE_SORTABLE = {
  supplier: Companies.companyName,
  quoteDate: PurchaseQuotes.quoteDate,
  validUntil: PurchaseQuotes.validUntil,
  quote: PurchaseQuotes.id,
};

// The reference's only filter is Quote date; status and supplier are ours.
const PURCHASE_QUOTE_LINE_FILTERS = {
  quoteDate: dateRangeFilter(PurchaseQuotes.quoteDate),
  status: enumFilter(PurchaseQuotes.status, purchaseQuoteStatuses),
  supplier: relationFilter(PurchaseQuotes.companyUuid),
};

export type PurchaseQuoteFields = Omit<
  InsertPurchaseQuotes,
  | "id"
  | "uuid"
  | "companyType"
  | "status"
  | "expirationReason"
  | "materials"
  | "optionsAmount"
  | "surcharges"
  | "totalExclVat"
  | "vatAmount"
  | "totalInclVat"
  | "totalWeightKg"
  | "createdAt"
  | "updatedAt"
>;

export type PurchaseQuoteItemInput = Omit<
  InsertPurchaseQuoteItems,
  "id" | "uuid" | "purchaseQuoteUuid" | "amount" | "createdAt" | "updatedAt"
>;

export type PurchaseQuoteActionResult = {
  purchaseQuoteUuid?: string;
  purchaseOrderUuid?: string;
  error?: string;
  success?: boolean;
};

/** One row of the overview: one quote line, with its quote's header beside it. */
export type PurchaseQuoteLineRow = {
  quoteUuid: SelectPurchaseQuotes["uuid"];
  quoteId: SelectPurchaseQuotes["id"];
  /** Null for a quote that has no lines yet, which still gets one row. */
  lineUuid: SelectPurchaseQuoteItems["uuid"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  /** The supplier's code. */
  companyCode: SelectCompanies["id"] | null;
  quoteDate: SelectPurchaseQuotes["quoteDate"];
  validUntil: SelectPurchaseQuotes["validUntil"];
  quoteNumber: SelectPurchaseQuotes["quoteNumber"];
  lineNumber: SelectPurchaseQuoteItems["lineNumber"] | null;
  status: SelectPurchaseQuotes["status"];
  expirationReason: SelectPurchaseQuotes["expirationReason"];
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  productCode: SelectProducts["productCode"] | null;
  /** The product's name, or the line's own description when it has no product. */
  productDescription: string | null;
  lengthMm: SelectPurchaseQuoteItems["lengthMm"] | null;
  widthMm: SelectPurchaseQuoteItems["widthMm"] | null;
  quantity: SelectPurchaseQuoteItems["quantity"] | null;
  unit: SelectPurchaseQuoteItems["unit"] | null;
  kg: SelectPurchaseQuoteItems["kg"] | null;
  netPrice: SelectPurchaseQuoteItems["netPrice"] | null;
  priceUnit: SelectPurchaseQuoteItems["priceUnit"] | null;
  amount: SelectPurchaseQuoteItems["amount"] | null;
  internalText: SelectPurchaseQuoteItems["internalText"] | null;
  isConsignment: SelectPurchaseQuotes["isConsignment"];
  /** The buyer's name, resolved from the Clerk user id on the header. */
  purchaser: string | null;
  purchaserInitials: string | null;
  ourReference: SelectPurchaseQuotes["ourReference"];
  purchaseReference: SelectPurchaseQuotes["reference"];
};

export type PurchaseQuoteItemDetail = SelectPurchaseQuoteItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseQuoteDetail = SelectPurchaseQuotes & {
  companyName: SelectCompanies["companyName"] | null;
  /** The purchase order this quote was awarded as, once it has been. */
  orderUuid: SelectPurchaseOrders["uuid"] | null;
  items: PurchaseQuoteItemDetail[];
};

export type PurchaseQuoteForEdit = {
  quote: SelectPurchaseQuotes;
  items: SelectPurchaseQuoteItems[];
};

// A quote whose "Valid u/i" date has passed without a decision has lapsed.
// Nothing runs on a schedule here, so the screens that show quotes close the
// lapsed ones as they read them; the update is idempotent.
const expireLapsedPurchaseQuotes = async (): Promise<void> => {
  await db
    .update(PurchaseQuotes)
    .set({ status: "expired", expirationReason: "validity_expired" })
    .where(
      and(
        inArray(PurchaseQuotes.status, ["open", "received"]),
        lt(PurchaseQuotes.validUntil, sql`CURDATE()`),
      ),
    );
};

// Rolls a purchase quote's lines and surcharges into the header snapshot the
// list and comparison screens read. Kept as a stored snapshot for the same
// reason the sales documents do it: the comparison must not silently change
// under someone once a quote has been read.
//
// VAT on a purchase is reclaimable, so it never touches what the goods cost —
// it is carried only so the quote can show the gross figure the supplier will
// actually invoice.
const buildPurchaseQuoteSummary = async (
  tx: Pick<typeof db, "select">,
  quoteUuid: string,
  companyUuid: string | null,
) => {
  const [lines, surcharges, company] = await Promise.all([
    tx
      .select()
      .from(PurchaseQuoteItems)
      .where(eq(PurchaseQuoteItems.purchaseQuoteUuid, quoteUuid)),
    tx
      .select()
      .from(PurchaseQuoteSurcharges)
      .where(eq(PurchaseQuoteSurcharges.purchaseQuoteUuid, quoteUuid)),
    companyUuid
      ? tx
          .select({ calculateVat: Companies.calculateVat })
          .from(Companies)
          .where(eq(Companies.uuid, companyUuid))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const materials = lines.reduce(
    (total, line) => total + Number(line.amount ?? 0),
    0,
  );
  const surchargeTotal = surcharges.reduce(
    (total, surcharge) => total + Number(surcharge.amount ?? 0),
    0,
  );
  const totalWeightKg = lines.reduce(
    (total, line) => total + Number(line.kg ?? 0),
    0,
  );

  const totalExclVat = materials + surchargeTotal;
  const vatRate = getQuoteVatRatePercent(true, company[0]?.calculateVat);
  const vatAmount = totalExclVat * (vatRate / 100);

  return {
    materials: moneyString(materials),
    surcharges: moneyString(surchargeTotal),
    totalExclVat: moneyString(totalExclVat),
    vatAmount: moneyString(vatAmount),
    totalInclVat: moneyString(totalExclVat + vatAmount),
    totalWeightKg: totalWeightKg.toFixed(2),
  };
};

// Writes a quote's lines. Shared by creating and editing a quote.
const writePurchaseQuoteLines = async (
  tx: Pick<typeof db, "select" | "insert">,
  quoteUuid: string,
  items: PurchaseQuoteItemInput[],
): Promise<void> => {
  const productUuids = items
    .map((item) => item.productUuid)
    .filter((value): value is string => !!value);

  const products =
    productUuids.length > 0
      ? await tx
          .select({
            uuid: Products.uuid,
            revenueGroupUuid: Products.revenueGroupUuid,
            weightTheoretical: Products.weightTheoretical,
            theoreticalWeight: Products.theoreticalWeight,
            weightUnit: Products.weightUnit,
          })
          .from(Products)
          .where(inArray(Products.uuid, productUuids))
      : [];
  const productByUuid = new Map(products.map((p) => [p.uuid, p]));

  for (const [index, item] of items.entries()) {
    // A quoted price arrives one of two ways: a net price typed straight in,
    // or a gross price with the group and line discounts that come off it.
    // When a gross is given it wins, because net is then a result rather than
    // something anyone should have to keep in step by hand.
    const gross = Number(item.grossPrice ?? 0);
    const netPrice =
      gross > 0
        ? netPriceAfterDiscounts(
            gross,
            Number(item.groupDiscountPercent ?? 0),
            Number(item.lineDiscountPercent ?? 0),
          )
        : Number(item.netPrice ?? 0);

    const product = item.productUuid
      ? productByUuid.get(item.productUuid)
      : undefined;
    const quantity = Number(item.quantity ?? 0);

    // Kg left empty is worked out from the product, the way the reference
    // fills Kg(p) live: ten plates of 31,4 kg each are 314 kg.
    const typedKg = Number(item.kg ?? 0);
    const pieceKg =
      product && typedKg <= 0
        ? productPieceWeightKg({
            weightTheoretical: product.weightTheoretical,
            theoreticalWeight: product.theoreticalWeight,
            weightUnit: product.weightUnit,
            lengthMm: item.lengthMm,
            widthMm: item.widthMm,
            thicknessMm: item.thicknessMm,
          })
        : null;
    const kg = typedKg > 0 ? typedKg : (pieceKg ?? 0) * quantity;

    await tx.insert(PurchaseQuoteItems).values({
      ...item,
      uuid: generateUuid(),
      purchaseQuoteUuid: quoteUuid,
      revenueGroupUuid: item.revenueGroupUuid ?? product?.revenueGroupUuid,
      kg: kg.toFixed(2),
      netPrice: moneyString(netPrice),
      lineNumber: item.lineNumber ?? (index + 1) * 10,
      // The line's weight at the price's own unit, never the piece count:
      // ten plates weighing 314 kg at EUR 1.930 per tonne is EUR 606,02.
      amount: moneyString(
        amountForWeight(netPrice, item.priceUnit ?? null, kg, {
          quantity,
          lengthMm: item.lengthMm,
          widthMm: item.widthMm,
          thicknessMm: Number(item.thicknessMm ?? 0),
        }),
      ),
    });
  }
};

/**
 * The rows one view of the overview selects: one per quote line, the way the
 * reference lists them, with the header's fields repeated down each quote.
 */
const purchaseQuoteLineRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<PurchaseQuoteLineRow[]> => {
    const rows = await db
      .select({
        quoteUuid: PurchaseQuotes.uuid,
        quoteId: PurchaseQuotes.id,
        lineUuid: PurchaseQuoteItems.uuid,
        supplierName: Companies.companyName,
        companyCode: Companies.id,
        quoteDate: PurchaseQuotes.quoteDate,
        validUntil: PurchaseQuotes.validUntil,
        quoteNumber: PurchaseQuotes.quoteNumber,
        lineNumber: PurchaseQuoteItems.lineNumber,
        status: PurchaseQuotes.status,
        expirationReason: PurchaseQuotes.expirationReason,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        productCode: Products.productCode,
        productDescription: sql<
          string | null
        >`COALESCE(${Products.name}, ${PurchaseQuoteItems.description})`,
        lengthMm: PurchaseQuoteItems.lengthMm,
        widthMm: PurchaseQuoteItems.widthMm,
        quantity: PurchaseQuoteItems.quantity,
        unit: PurchaseQuoteItems.unit,
        kg: PurchaseQuoteItems.kg,
        netPrice: PurchaseQuoteItems.netPrice,
        priceUnit: PurchaseQuoteItems.priceUnit,
        amount: PurchaseQuoteItems.amount,
        internalText: PurchaseQuoteItems.internalText,
        isConsignment: PurchaseQuotes.isConsignment,
        purchaserId: PurchaseQuotes.purchaser,
        ourReference: PurchaseQuotes.ourReference,
        purchaseReference: PurchaseQuotes.reference,
      })
      .from(PurchaseQuotes)
      .leftJoin(
        PurchaseQuoteItems,
        eq(PurchaseQuoteItems.purchaseQuoteUuid, PurchaseQuotes.uuid),
      )
      .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseQuoteItems.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        sql`${RevenueGroups.uuid} = COALESCE(${PurchaseQuoteItems.revenueGroupUuid}, ${Products.revenueGroupUuid})`,
      )
      .where(
        tableWhere({
          query,
          search: PURCHASE_QUOTE_LINE_SEARCH,
          filters: PURCHASE_QUOTE_LINE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          PURCHASE_QUOTE_LINE_SORTABLE,
          query,
          [asc(Companies.companyName), asc(PurchaseQuotes.id)],
          PurchaseQuoteItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    return rows.map(({ purchaserId, ...row }) => {
      const purchaser = purchaserId
        ? (nameById.get(purchaserId) ?? purchaserId)
        : null;
      return {
        ...row,
        purchaser,
        purchaserInitials: personInitials(purchaser),
      };
    });
  };

/** Every quote line the current view matches, as a workbook. */
export const exportPurchaseQuoteLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase quotes",
    columns: PURCHASE_QUOTE_LINE_COLUMNS,
    columnKeys,
    rows: purchaseQuoteLineRows(parseTableQuery(params)),
  });

export const getPurchaseQuoteLines = async (
  query: TableQuery,
): Promise<Paged<PurchaseQuoteLineRow>> => {
  try {
    await expireLapsedPurchaseQuotes();

    return await runPaged(query, {
      rows: purchaseQuoteLineRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(PurchaseQuotes)
          .leftJoin(
            PurchaseQuoteItems,
            eq(PurchaseQuoteItems.purchaseQuoteUuid, PurchaseQuotes.uuid),
          )
          .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
          .leftJoin(Products, eq(PurchaseQuoteItems.productUuid, Products.uuid))
          .where(
            tableWhere({
              query,
              search: PURCHASE_QUOTE_LINE_SEARCH,
              filters: PURCHASE_QUOTE_LINE_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase quotes"));
  }
};

export const createPurchaseQuote = async (
  fields: PurchaseQuoteFields,
  items: PurchaseQuoteItemInput[] = [],
): Promise<PurchaseQuoteActionResult> => {
  const uuid = generateUuid();
  try {
    const companyType = await resolveCompanyType(fields.companyUuid);

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseQuotes).values({ ...fields, companyType, uuid });

      await writePurchaseQuoteLines(tx, uuid, items);

      await tx
        .update(PurchaseQuotes)
        .set(await buildPurchaseQuoteSummary(tx, uuid, fields.companyUuid ?? null))
        .where(eq(PurchaseQuotes.uuid, uuid));
    });

    revalidatePath("/purchase-quotes");
    return { success: true, purchaseQuoteUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase quote",
    };
  }
};

export const getPurchaseQuoteForEdit = async (
  uuid: string,
): Promise<PurchaseQuoteForEdit | null> => {
  const [quote] = await db
    .select()
    .from(PurchaseQuotes)
    .where(eq(PurchaseQuotes.uuid, uuid))
    .limit(1);

  if (!quote) {
    return null;
  }

  const items = await db
    .select()
    .from(PurchaseQuoteItems)
    .where(eq(PurchaseQuoteItems.purchaseQuoteUuid, uuid))
    .orderBy(asc(PurchaseQuoteItems.lineNumber));

  return { quote, items };
};

export const updatePurchaseQuote = async (
  uuid: string,
  fields: PurchaseQuoteFields,
  items: PurchaseQuoteItemInput[],
): Promise<PurchaseQuoteActionResult> => {
  try {
    const [quote] = await db
      .select()
      .from(PurchaseQuotes)
      .where(eq(PurchaseQuotes.uuid, uuid))
      .limit(1);

    if (!quote) {
      return { error: "Purchase quote not found." };
    }
    if (!isPurchaseQuoteEditable(quote.status)) {
      return { error: "This quote has already been decided." };
    }

    const companyType = await resolveCompanyType(fields.companyUuid);

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseQuotes)
        .set({ ...fields, companyType })
        .where(eq(PurchaseQuotes.uuid, uuid));

      // The form carries every line, prices included, so saving it replaces
      // the lines outright rather than trying to match them up one by one.
      await tx
        .delete(PurchaseQuoteItems)
        .where(eq(PurchaseQuoteItems.purchaseQuoteUuid, uuid));
      await writePurchaseQuoteLines(tx, uuid, items);

      // Moving the quote to another supplier can change whether VAT applies, so
      // the stored totals are rebuilt rather than left showing the old rate.
      await tx
        .update(PurchaseQuotes)
        .set(
          await buildPurchaseQuoteSummary(tx, uuid, fields.companyUuid ?? null),
        )
        .where(eq(PurchaseQuotes.uuid, uuid));
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to update purchase quote"),
    };
  }

  revalidatePath("/purchase-quotes");
  revalidatePath(`/purchase-quotes/${uuid}`);
  redirect(`/purchase-quotes/${uuid}`);
};

export const getPurchaseQuoteDetail = async (
  uuid: string,
): Promise<PurchaseQuoteDetail | null> => {
  await expireLapsedPurchaseQuotes();

  const [quote] = await db
    .select({
      ...getTableColumns(PurchaseQuotes),
      companyName: Companies.companyName,
      orderUuid: sql<string | null>`(
        SELECT ${PurchaseOrders.uuid} FROM ${PurchaseOrders}
        WHERE ${PurchaseOrders.purchaseQuoteUuid} = ${PurchaseQuotes.uuid}
        ORDER BY ${PurchaseOrders.id} DESC LIMIT 1
      )`,
    })
    .from(PurchaseQuotes)
    .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
    .where(eq(PurchaseQuotes.uuid, uuid))
    .limit(1);

  if (!quote) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(PurchaseQuoteItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(PurchaseQuoteItems)
    .leftJoin(Products, eq(PurchaseQuoteItems.productUuid, Products.uuid))
    .where(eq(PurchaseQuoteItems.purchaseQuoteUuid, uuid))
    .orderBy(PurchaseQuoteItems.lineNumber);

  return { ...quote, items };
};

/**
 * Close a quote without an order, saying why — the reference's "Expired
 * because". Only an undecided quote can be expired.
 */
export const expirePurchaseQuote = async (
  quoteUuid: string,
  reason: PurchaseQuoteExpirationReason,
): Promise<PurchaseQuoteActionResult> => {
  try {
    if (!purchaseQuoteExpirationReasons.includes(reason)) {
      return { error: "Choose why the quote is expired." };
    }

    const [quote] = await db
      .select({ status: PurchaseQuotes.status })
      .from(PurchaseQuotes)
      .where(eq(PurchaseQuotes.uuid, quoteUuid))
      .limit(1);

    if (!quote) {
      return { error: "Purchase quote not found." };
    }
    if (!isPurchaseQuoteEditable(quote.status)) {
      return { error: "This quote has already been decided." };
    }

    await db
      .update(PurchaseQuotes)
      .set({ status: "expired", expirationReason: reason })
      .where(eq(PurchaseQuotes.uuid, quoteUuid));

    revalidatePath("/purchase-quotes");
    revalidatePath(`/purchase-quotes/${quoteUuid}`);
    return { success: true, purchaseQuoteUuid: quoteUuid };
  } catch (error) {
    return { error: describeError(error, "Failed to expire purchase quote") };
  }
};

// Records the supplier's prices against a quote we asked for, and marks it as
// answered so the comparison can tell a priced quote from one still outstanding.
export const recordPurchaseQuotePrices = async (
  quoteUuid: string,
  prices: Array<{ itemUuid: string; netPrice: string; priceUnit?: string }>,
): Promise<PurchaseQuoteActionResult> => {
  try {
    const [quote] = await db
      .select()
      .from(PurchaseQuotes)
      .where(eq(PurchaseQuotes.uuid, quoteUuid))
      .limit(1);

    if (!quote) {
      return { error: "Purchase quote not found." };
    }
    if (!isPurchaseQuoteEditable(quote.status)) {
      return { error: "This quote has already been decided." };
    }

    const items = await db
      .select()
      .from(PurchaseQuoteItems)
      .where(eq(PurchaseQuoteItems.purchaseQuoteUuid, quoteUuid));
    const itemByUuid = new Map(items.map((item) => [item.uuid, item]));

    await db.transaction(async (tx) => {
      for (const price of prices) {
        const item = itemByUuid.get(price.itemUuid);
        if (!item) {
          throw new Error("A priced line does not belong to this quote.");
        }

        const netPrice = Number(price.netPrice);
        if (!Number.isFinite(netPrice) || netPrice < 0) {
          throw new Error("Enter a valid price on every line.");
        }

        await tx
          .update(PurchaseQuoteItems)
          .set({
            netPrice: moneyString(netPrice),
            priceUnit: price.priceUnit ?? item.priceUnit,
            amount: moneyString(amountForWeight(
              netPrice,
              price.priceUnit ?? item.priceUnit,
              Number(item.kg ?? 0),
              {
                quantity: Number(item.quantity ?? 0),
                lengthMm: item.lengthMm,
                widthMm: item.widthMm,
                thicknessMm: Number(item.thicknessMm ?? 0),
              },
            )),
          })
          .where(eq(PurchaseQuoteItems.uuid, price.itemUuid));
      }

      await tx
        .update(PurchaseQuotes)
        .set({
          ...(await buildPurchaseQuoteSummary(tx, quoteUuid, quote.companyUuid)),
          status: "received",
        })
        .where(eq(PurchaseQuotes.uuid, quoteUuid));

      if (quote.purchaseRequestUuid) {
        await tx
          .update(PurchaseRequests)
          .set({ status: "quoted" })
          .where(eq(PurchaseRequests.uuid, quote.purchaseRequestUuid));
      }
    });

    revalidatePath("/purchase-quotes");
    revalidatePath(`/purchase-quotes/${quoteUuid}`);
    return { success: true, purchaseQuoteUuid: quoteUuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to record quote prices",
    };
  }
};

// Awards a quote: turns it into a purchase order carrying the agreed prices,
// and marks the competing quotes on the same request as lost.
//
// This is the head of the cost chain. The price copied here is what the lot
// received against this order is valued at, which becomes the sales order
// line's cost and, in turn, the margin every finance report shows. Before this
// existed, that price was typed onto the purchase order by hand with nothing
// behind it.
export const convertPurchaseQuoteToOrder = async (
  quoteUuid: string,
): Promise<PurchaseQuoteActionResult> => {
  try {
    const [quote] = await db
      .select()
      .from(PurchaseQuotes)
      .where(eq(PurchaseQuotes.uuid, quoteUuid))
      .limit(1);

    if (!quote) {
      return { error: "Purchase quote not found." };
    }
    if (quote.status === "awarded") {
      return { error: "This quote has already been turned into an order." };
    }
    if (quote.status === "lost") {
      return { error: "This quote was not awarded." };
    }
    if (quote.status === "expired") {
      return { error: "This quote has expired." };
    }
    if (!quote.companyUuid) {
      return { error: "This quote has no supplier to order from." };
    }

    const items = await db
      .select()
      .from(PurchaseQuoteItems)
      .where(eq(PurchaseQuoteItems.purchaseQuoteUuid, quoteUuid))
      .orderBy(PurchaseQuoteItems.lineNumber);

    if (items.length === 0) {
      return { error: "This quote has no lines to order." };
    }

    // A purchase order line has to name a real product, because the receipt
    // books stock against it. A quote line may still be a free-text request.
    const unmatched = items.filter((item) => !item.productUuid);
    if (unmatched.length > 0) {
      return {
        error:
          "Every quote line needs a product before it can be ordered. Set the product on the lines that are still free text.",
      };
    }

    const unpriced = items.filter((item) => Number(item.netPrice ?? 0) <= 0);
    if (unpriced.length > 0) {
      return {
        error:
          "This quote still has unpriced lines — record the supplier's prices before awarding it.",
      };
    }

    const supplierUuid = quote.companyUuid;
    const orderUuid = generateUuid();

    const amount = items.reduce(
      (total, item) => total + Number(item.amount ?? 0),
      0,
    );
    const weightKg = items.reduce(
      (total, item) => total + Number(item.kg ?? 0),
      0,
    );

    await db.transaction(async (tx) => {
      // Only award a quote that is still undecided — a concurrent award of a
      // sibling can't produce two orders for the same request.
      const [claimed] = await tx
        .update(PurchaseQuotes)
        .set({ status: "awarded" })
        .where(
          and(
            eq(PurchaseQuotes.uuid, quoteUuid),
            eq(PurchaseQuotes.status, quote.status),
          ),
        );

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This quote changed while awarding it — please refresh and try again.",
        );
      }

      // A converted order starts provisional, as the reference's does: it
      // exists, but nothing is received against it and it is not sent to the
      // supplier until somebody makes it final.
      await tx.insert(PurchaseOrders).values({
        uuid: orderUuid,
        purchaseQuoteUuid: quoteUuid,
        supplierUuid,
        // A quote raised through an agent keeps that agent on the order.
        agentUuid: quote.companyType === "agent" ? quote.companyUuid : null,
        contactUuid: quote.contactUuid,
        purchaser: quote.purchaser,
        reference: quote.reference,
        ourReference: quote.ourReference,
        orderCategory: quote.orderCategory,
        purchaseOrderType: quote.purchaseOrderType,
        weightType: quote.weightType,
        isOverlength: quote.isOverlength,
        paymentTerms: quote.paymentTerms,
        deliveryTerms: quote.deliveryTerms,
        deliveryAddressUuid: quote.deliveryAddressUuid,
        arrangeTransport: quote.arrangeTransport,
        pickupDropoffCdPurchases: quote.pickupDropoffCdPurchases,
        supplierAddressUuid: quote.supplierAddressUuid,
        deliveryType: quote.deliveryType,
        deliveryDate: quote.deliveryDate,
        deliveryWeek: quote.deliveryWeek,
        deliveryYear: quote.deliveryYear,
        deliveryRemark: quote.deliveryRemark,
        status: "provisional",
        orderDate: todayDateString(),
        amount: moneyString(amount),
        weightKg: weightKg.toFixed(3),
      });

      for (const item of items) {
        const productUuid = item.productUuid;
        if (!productUuid) {
          throw new Error("A quote line lost its product while ordering.");
        }

        const purchaseOrderItemUuid = generateUuid();

        await tx.insert(PurchaseOrderItems).values({
          uuid: purchaseOrderItemUuid,
          purchaseOrderUuid: orderUuid,
          productUuid,
          lineNumber: item.lineNumber,
          status: "provisional",
          sourceType: purchaseSourceTypeFor(
            quote.pickupDropoffCdPurchases,
            Boolean(item.forOrderItemUuid),
          ),
          quantity: item.quantity ?? "0.000",
          qtyPlanned: item.quantity ?? "0.000",
          unit: item.unit,
          lengthMm: item.lengthMm,
          widthMm: item.widthMm,
          thicknessMm: item.thicknessMm,
          kgPurchased: item.kg,
          purchaser: item.purchaser,
          // The agreed price, and the reason this whole chain exists.
          grossPrice: item.grossPrice,
          groupDiscountPercent: item.groupDiscountPercent,
          lineDiscountPercent: item.lineDiscountPercent,
          netPrice: Number(item.netPrice ?? 0).toFixed(4),
          priceUnit: item.priceUnit,
          amount: item.amount,
        });

        // The request's `For line`, kept through the quote (C4).
        if (item.forOrderItemUuid) {
          await coverSalesLineWithPurchase(
            tx,
            item.forOrderItemUuid,
            purchaseOrderItemUuid,
          );
        }
      }

      await syncPurchaseLineReceiptDates(tx, orderUuid);

      // Everyone else who quoted for this request has lost it.
      if (quote.purchaseRequestUuid) {
        await tx
          .update(PurchaseQuotes)
          .set({ status: "lost" })
          .where(
            and(
              eq(PurchaseQuotes.purchaseRequestUuid, quote.purchaseRequestUuid),
              ne(PurchaseQuotes.uuid, quoteUuid),
              ne(PurchaseQuotes.status, "awarded"),
            ),
          );

        await tx
          .update(PurchaseRequests)
          .set({ status: "awarded" })
          .where(eq(PurchaseRequests.uuid, quote.purchaseRequestUuid));
      }
    });

    revalidatePath("/purchase-quotes");
    revalidatePath(`/purchase-quotes/${quoteUuid}`);
    revalidatePath("/purchase-orders");
    revalidatePath("/purchase-requests");
    return {
      success: true,
      purchaseQuoteUuid: quoteUuid,
      purchaseOrderUuid: orderUuid,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to turn this quote into a purchase order",
    };
  }
};
