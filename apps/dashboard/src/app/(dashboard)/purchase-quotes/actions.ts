"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
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
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { PurchaseRequests } from "@/db/schema/purchase-requests";
import { resolveCompanyType } from "@/app/(dashboard)/companies/actions";
import { mailDocument, sendPurchaseOrderEmail } from "@/emails/documents";
import {
  amountForWeight,
  describeError,
  generateUuid,
  getQuoteVatRatePercent,
  isPurchaseQuoteEditable,
  todayDateString,
} from "@/lib/helpers";
import { and, desc, eq, getTableColumns, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PurchaseQuoteFields = Omit<
  InsertPurchaseQuotes,
  | "id"
  | "uuid"
  | "companyType"
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

export type PurchaseQuoteListItem = SelectPurchaseQuotes & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export type PurchaseQuoteItemDetail = SelectPurchaseQuoteItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseQuoteDetail = SelectPurchaseQuotes & {
  companyName: SelectCompanies["companyName"] | null;
  items: PurchaseQuoteItemDetail[];
};

export const getPurchaseQuotes = async (): Promise<PurchaseQuoteListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(PurchaseQuotes),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseQuotes)
      .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(PurchaseQuotes.contactUuid, Contacts.uuid))
      .orderBy(desc(PurchaseQuotes.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase quotes"));
  }
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
    materials: materials.toFixed(2),
    surcharges: surchargeTotal.toFixed(2),
    totalExclVat: totalExclVat.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalInclVat: (totalExclVat + vatAmount).toFixed(2),
    totalWeightKg: totalWeightKg.toFixed(2),
  };
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

      // Lines were previously dropped on the floor — PurchaseQuoteItems was
      // never written by anything, so a quote had a supplier and no content.
      for (const [index, item] of items.entries()) {
        const netPrice = Number(item.netPrice ?? 0);

        await tx.insert(PurchaseQuoteItems).values({
          ...item,
          uuid: generateUuid(),
          purchaseQuoteUuid: uuid,
          lineNumber: item.lineNumber ?? index + 1,
          // The line's weight at the price's own unit, never the piece count:
          // ten plates weighing 314 kg at EUR 1.930 per tonne is EUR 606,02.
          amount: amountForWeight(
            netPrice,
            item.priceUnit ?? null,
            Number(item.kg ?? 0),
          ).toFixed(2),
        });
      }

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
): Promise<SelectPurchaseQuotes | null> => {
  const [quote] = await db
    .select()
    .from(PurchaseQuotes)
    .where(eq(PurchaseQuotes.uuid, uuid))
    .limit(1);

  return quote ?? null;
};

export const updatePurchaseQuote = async (
  uuid: string,
  fields: PurchaseQuoteFields,
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
  const [quote] = await db
    .select({
      ...getTableColumns(PurchaseQuotes),
      companyName: Companies.companyName,
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
    if (quote.status === "awarded" || quote.status === "lost") {
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
            netPrice: netPrice.toFixed(2),
            priceUnit: price.priceUnit ?? item.priceUnit,
            amount: amountForWeight(
              netPrice,
              price.priceUnit ?? item.priceUnit,
              Number(item.kg ?? 0),
            ).toFixed(2),
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
        status: "open",
        orderDate: todayDateString(),
        amount: amount.toFixed(2),
        weightKg: weightKg.toFixed(3),
      });

      for (const item of items) {
        const productUuid = item.productUuid;
        if (!productUuid) {
          throw new Error("A quote line lost its product while ordering.");
        }

        await tx.insert(PurchaseOrderItems).values({
          uuid: generateUuid(),
          purchaseOrderUuid: orderUuid,
          productUuid,
          lineNumber: item.lineNumber,
          quantity: item.quantity ?? "0.000",
          qtyPlanned: item.quantity ?? "0.000",
          unit: item.unit,
          lengthMm: item.lengthMm,
          widthMm: item.widthMm,
          thicknessMm: item.thicknessMm,
          kgPurchased: item.kg,
          purchaser: item.purchaser,
          // The agreed price, and the reason this whole chain exists.
          netPrice: Number(item.netPrice ?? 0).toFixed(4),
          priceUnit: item.priceUnit,
          amount: item.amount,
        });
      }

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

    // An order raised from an awarded quote is still an order placed with the
    // supplier, so it is confirmed to them the same way one entered by hand is.
    await mailDocument(
      () => sendPurchaseOrderEmail(orderUuid),
      `Purchase order ${orderUuid}`,
    );

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
