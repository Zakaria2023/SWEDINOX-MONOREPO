"use server";

import { db } from "@/db";
import {
  InsertPurchaseRequests,
  PurchaseRequests,
  SelectPurchaseRequests,
} from "@/db/schema/purchase-requests";
import {
  InsertPurchaseRequestItems,
  PurchaseRequestItems,
  SelectPurchaseRequestItems,
} from "@/db/schema/purchase-request-items";
import { PurchaseQuoteItems } from "@/db/schema/purchase-quote-items";
import { PurchaseQuotes } from "@/db/schema/purchase-quotes";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Products, SelectProducts } from "@/db/schema/products";
import { resolveCompanyType } from "@/app/(dashboard)/companies/actions";
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PurchaseRequestFields = Omit<
  InsertPurchaseRequests,
  "id" | "uuid" | "companyType" | "createdAt" | "updatedAt"
>;

export type PurchaseRequestItemInput = Omit<
  InsertPurchaseRequestItems,
  "id" | "uuid" | "purchaseRequestUuid" | "createdAt" | "updatedAt"
>;

export type PurchaseRequestActionResult = {
  purchaseRequestUuid?: string;
  quoteUuids?: string[];
  error?: string;
  success?: boolean;
};

export type PurchaseRequestListItem = SelectPurchaseRequests & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export type PurchaseRequestItemDetail = SelectPurchaseRequestItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseRequestQuoteSummary = {
  uuid: string;
  id: number;
  supplierName: SelectCompanies["companyName"] | null;
  status: string;
  quoteDate: Date | string | null;
  validUntil: Date | string | null;
  totalExclVat: string | null;
  lineCount: number;
};

export type PurchaseRequestDetail = SelectPurchaseRequests & {
  companyName: SelectCompanies["companyName"] | null;
  items: PurchaseRequestItemDetail[];
  quotes: PurchaseRequestQuoteSummary[];
};

export const getPurchaseRequests = async (): Promise<
  PurchaseRequestListItem[]
> => {
  try {
    return (await db
      .select({
        ...getTableColumns(PurchaseRequests),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseRequests)
      .leftJoin(Companies, eq(PurchaseRequests.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(PurchaseRequests.contactUuid, Contacts.uuid))
      .orderBy(desc(PurchaseRequests.createdAt))) as PurchaseRequestListItem[];
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase requests"));
  }
};

export const createPurchaseRequest = async (
  fields: PurchaseRequestFields,
  items: PurchaseRequestItemInput[] = [],
): Promise<PurchaseRequestActionResult> => {
  const uuid = generateUuid();
  try {
    const companyType = await resolveCompanyType(fields.companyUuid);

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseRequests).values({ ...fields, companyType, uuid });

      // Lines were previously discarded — the request recorded who to ask but
      // never what to ask for.
      for (const [index, item] of items.entries()) {
        await tx.insert(PurchaseRequestItems).values({
          ...item,
          uuid: generateUuid(),
          purchaseRequestUuid: uuid,
          lineNumber: item.lineNumber ?? index + 1,
        });
      }
    });

    revalidatePath("/purchase-requests");
    return { success: true, purchaseRequestUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase request",
    };
  }
};

export const getPurchaseRequestDetail = async (
  uuid: string,
): Promise<PurchaseRequestDetail | null> => {
  const [request] = await db
    .select({
      ...getTableColumns(PurchaseRequests),
      companyName: Companies.companyName,
    })
    .from(PurchaseRequests)
    .leftJoin(Companies, eq(PurchaseRequests.companyUuid, Companies.uuid))
    .where(eq(PurchaseRequests.uuid, uuid))
    .limit(1);

  if (!request) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(PurchaseRequestItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(PurchaseRequestItems)
    .leftJoin(Products, eq(PurchaseRequestItems.productUuid, Products.uuid))
    .where(eq(PurchaseRequestItems.purchaseRequestUuid, uuid))
    .orderBy(PurchaseRequestItems.lineNumber);

  // Every supplier's answer to this request, so they can be read against each
  // other before one is awarded.
  const quoteRows = await db
    .select({
      uuid: PurchaseQuotes.uuid,
      id: PurchaseQuotes.id,
      supplierName: Companies.companyName,
      status: PurchaseQuotes.status,
      quoteDate: PurchaseQuotes.quoteDate,
      validUntil: PurchaseQuotes.validUntil,
      totalExclVat: PurchaseQuotes.totalExclVat,
    })
    .from(PurchaseQuotes)
    .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
    .where(eq(PurchaseQuotes.purchaseRequestUuid, uuid))
    .orderBy(PurchaseQuotes.id);

  const quoteUuids = quoteRows.map((row) => row.uuid);
  const quoteLines =
    quoteUuids.length > 0
      ? await db
          .select({ purchaseQuoteUuid: PurchaseQuoteItems.purchaseQuoteUuid })
          .from(PurchaseQuoteItems)
          .where(inArray(PurchaseQuoteItems.purchaseQuoteUuid, quoteUuids))
      : [];

  const lineCountByQuote = new Map<string, number>();
  for (const line of quoteLines) {
    lineCountByQuote.set(
      line.purchaseQuoteUuid,
      (lineCountByQuote.get(line.purchaseQuoteUuid) ?? 0) + 1,
    );
  }

  return {
    ...request,
    items,
    quotes: quoteRows.map((row) => ({
      ...row,
      lineCount: lineCountByQuote.get(row.uuid) ?? 0,
    })),
  };
};

// Fans a request out to the suppliers being asked: one quote each, carrying the
// request's terms and the lines it asks for, with no prices on them. Each
// supplier's answer then comes back as prices on their own copy, which is what
// makes the quotes comparable — same lines, same terms, different money.
export const convertPurchaseRequestToQuotes = async (
  requestUuid: string,
  supplierUuids: string[],
): Promise<PurchaseRequestActionResult> => {
  try {
    if (supplierUuids.length === 0) {
      return { error: "Select at least one supplier to request a quote from." };
    }

    const [request] = await db
      .select()
      .from(PurchaseRequests)
      .where(eq(PurchaseRequests.uuid, requestUuid))
      .limit(1);

    if (!request) {
      return { error: "Purchase request not found." };
    }
    if (request.status === "cancelled") {
      return { error: "This request is cancelled." };
    }
    if (request.status === "awarded") {
      return { error: "This request has already been awarded." };
    }

    const items = await db
      .select({
        ...getTableColumns(PurchaseRequestItems),
        revenueGroupUuid: Products.revenueGroupUuid,
      })
      .from(PurchaseRequestItems)
      .leftJoin(Products, eq(PurchaseRequestItems.productUuid, Products.uuid))
      .where(eq(PurchaseRequestItems.purchaseRequestUuid, requestUuid))
      .orderBy(PurchaseRequestItems.lineNumber);

    if (items.length === 0) {
      return {
        error: "Add at least one line to the request before asking for quotes.",
      };
    }

    // Don't ask the same supplier twice for the same request.
    const alreadyAsked = await db
      .select({ companyUuid: PurchaseQuotes.companyUuid })
      .from(PurchaseQuotes)
      .where(eq(PurchaseQuotes.purchaseRequestUuid, requestUuid));
    const askedUuids = new Set(
      alreadyAsked
        .map((row) => row.companyUuid)
        .filter((value): value is string => value !== null),
    );

    const newSupplierUuids = supplierUuids.filter(
      (supplierUuid) => !askedUuids.has(supplierUuid),
    );
    if (newSupplierUuids.length === 0) {
      return { error: "Those suppliers have already been asked to quote." };
    }

    const quoteUuids: string[] = [];

    await db.transaction(async (tx) => {
      for (const supplierUuid of newSupplierUuids) {
        const quoteUuid = generateUuid();
        quoteUuids.push(quoteUuid);

        const companyType = await resolveCompanyType(supplierUuid);

        await tx.insert(PurchaseQuotes).values({
          uuid: quoteUuid,
          purchaseRequestUuid: requestUuid,
          status: "open",
          companyUuid: supplierUuid,
          companyType,
          quoteDate: new Date(todayDateString()),
          // The contact and supplier address on the request belong to whoever
          // it was raised against, so they are not carried onto a quote for a
          // different supplier.
          purchaser: request.purchaser,
          orderCategory: request.orderCategory,
          reference: request.reference,
          ourReference: request.ourReference,
          purchaseOrderType: request.purchaseOrderType,
          weightType: request.weightType,
          isOverlength: request.isOverlength,
          paymentTerms: request.paymentTerms,
          deliveryTerms: request.deliveryTerms,
          deliveryAddressUuid: request.deliveryAddressUuid,
          arrangeTransport: request.arrangeTransport,
          pickupDropoffCdPurchases: request.pickupDropoffCdPurchases,
          deliveryType: request.deliveryType,
          deliveryDate: request.deliveryDate,
          deliveryWeek: request.deliveryWeek,
          deliveryYear: request.deliveryYear,
          deliveryRemark: request.deliveryRemark,
        });

        for (const item of items) {
          await tx.insert(PurchaseQuoteItems).values({
            uuid: generateUuid(),
            purchaseQuoteUuid: quoteUuid,
            productUuid: item.productUuid,
            revenueGroupUuid: item.revenueGroupUuid,
            lineNumber: item.lineNumber,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            kg: item.kg,
            lengthMm: item.lengthMm,
            widthMm: item.widthMm,
            thicknessMm: item.thicknessMm,
            purchaser: request.purchaser,
            ourReference: request.ourReference,
            // netPrice and amount stay at zero: that is the supplier's answer,
            // not ours to fill in.
          });
        }
      }

      await tx
        .update(PurchaseRequests)
        .set({ status: "sent" })
        .where(eq(PurchaseRequests.uuid, requestUuid));
    });

    revalidatePath("/purchase-requests");
    revalidatePath(`/purchase-requests/${requestUuid}`);
    revalidatePath("/purchase-quotes");
    return { success: true, purchaseRequestUuid: requestUuid, quoteUuids };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create quotes from this request",
    };
  }
};
