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
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { mailDocument, sendPurchaseOrderEmail } from "@/emails/documents";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Products, SelectProducts } from "@/db/schema/products";
import { resolveCompanyType } from "@/app/(dashboard)/companies/actions";
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { and, desc, eq, getTableColumns, inArray, ne } from "drizzle-orm";
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
  purchaseOrderUuid?: string;
  error?: string;
  success?: boolean;
};

// A sales order line waiting on material, so a request can say what it is for.
export type OrderLineNeedingMaterial = {
  orderItemUuid: SelectOrderItems["uuid"];
  orderId: SelectOrders["id"];
  lineNumber: SelectOrderItems["lineNumber"];
  productUuid: SelectOrderItems["productUuid"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  quantity: SelectOrderItems["quantity"];
  deliveryDate: SelectOrderItems["deliveryDate"];
  customerName: SelectCompanies["companyName"] | null;
};

export type PurchaseRequestListItem = SelectPurchaseRequests & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export type PurchaseRequestItemDetail = SelectPurchaseRequestItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  // Left-joined: a line bought for stock is for no order line at all.
  forOrderUuid: SelectOrderItems["orderUuid"] | null;
  forOrderId: SelectOrders["id"] | null;
  forOrderLine: SelectOrderItems["lineNumber"] | null;
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
      // The sales order line this material is for, resolved so the request can
      // say who is waiting on it rather than just holding a uuid.
      forOrderUuid: OrderItems.orderUuid,
      forOrderId: Orders.id,
      forOrderLine: OrderItems.lineNumber,
    })
    .from(PurchaseRequestItems)
    .leftJoin(Products, eq(PurchaseRequestItems.productUuid, Products.uuid))
    .leftJoin(
      OrderItems,
      eq(PurchaseRequestItems.forOrderItemUuid, OrderItems.uuid),
    )
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
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

/**
 * Sales order lines a purchase request could be covering — the "For line"
 * column. Reserved lines only: once a line is delivered the material has
 * already been found, so buying against it would be buying for nothing.
 */
export const getOrderLinesNeedingMaterial = async (): Promise<
  OrderLineNeedingMaterial[]
> =>
  db
    .select({
      orderItemUuid: OrderItems.uuid,
      orderId: Orders.id,
      lineNumber: OrderItems.lineNumber,
      productUuid: OrderItems.productUuid,
      productCode: Products.productCode,
      productName: Products.name,
      quantity: OrderItems.quantity,
      deliveryDate: OrderItems.deliveryDate,
      customerName: Companies.companyName,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(eq(OrderItems.status, "reserved"))
    .orderBy(desc(OrderItems.createdAt));

/**
 * Orders a request straight from a supplier, skipping the quote round.
 *
 * The reference screen offers this beside "Purchase quote" for good reason: a
 * request whose price is already known — a contract, a repeat buy, an urgent
 * top-up — gains nothing from being asked. Requiring the quote round anyway
 * would only mean typing a price into a quote in order to award it to yourself.
 *
 * Prices are supplied here rather than derived, because a request deliberately
 * carries none: it is the question, and this is someone answering it directly.
 */
export const convertPurchaseRequestToOrder = async (
  requestUuid: string,
  supplierUuid: string,
  prices: { purchaseRequestItemUuid: string; netPrice: string }[] = [],
): Promise<PurchaseRequestActionResult> => {
  const orderUuid = generateUuid();
  try {
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
      .select()
      .from(PurchaseRequestItems)
      .where(eq(PurchaseRequestItems.purchaseRequestUuid, requestUuid))
      .orderBy(PurchaseRequestItems.lineNumber);

    if (items.length === 0) {
      return { error: "Add at least one line before ordering this request." };
    }

    // A purchase order line without a product has nothing to receive into
    // stock, so the order can't be raised from a request that only names
    // things in words.
    if (items.some((item) => !item.productUuid)) {
      return {
        error:
          "Every line needs a product before this can become a purchase order. Ask for a quote instead if the goods aren't catalogued yet.",
      };
    }

    const priceByItem = new Map(
      prices.map((price) => [price.purchaseRequestItemUuid, price.netPrice]),
    );

    const unpriced = items.filter(
      (item) => Number(priceByItem.get(item.uuid) ?? 0) <= 0,
    );
    if (unpriced.length > 0) {
      return {
        error:
          "Every line needs an agreed price before this can become a purchase order.",
      };
    }

    await db.transaction(async (tx) => {
      // Claim the request first, so two people ordering at once can't raise
      // two purchase orders for the same goods.
      const [claimed] = await tx
        .update(PurchaseRequests)
        .set({ status: "awarded" })
        .where(
          and(
            eq(PurchaseRequests.uuid, requestUuid),
            ne(PurchaseRequests.status, "awarded"),
          ),
        );

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This request was already ordered — please refresh and try again.",
        );
      }

      await tx.insert(PurchaseOrders).values({
        uuid: orderUuid,
        supplierUuid,
        purchaseQuoteUuid: null,
        contactUuid: null,
        purchaser: request.purchaser,
        reference: request.reference,
        ourReference: request.ourReference,
        orderCategory: request.orderCategory,
        purchaseOrderType: request.purchaseOrderType,
        weightType: request.weightType,
        isOverlength: request.isOverlength ?? false,
        paymentTerms: request.paymentTerms,
        deliveryTerms: request.deliveryTerms,
        deliveryAddressUuid: request.deliveryAddressUuid,
        arrangeTransport: request.arrangeTransport ?? false,
        pickupDropoffCdPurchases: request.pickupDropoffCdPurchases ?? false,
        deliveryType: request.deliveryType,
        deliveryDate: request.deliveryDate,
        deliveryWeek: request.deliveryWeek,
        deliveryYear: request.deliveryYear,
        deliveryRemark: request.deliveryRemark,
        orderDate: todayDateString(),
        status: "open",
      });

      for (const [index, item] of items.entries()) {
        const productUuid = item.productUuid;
        if (!productUuid) {
          continue;
        }

        const netPrice = Number(priceByItem.get(item.uuid) ?? 0);
        const quantity = item.quantity ?? "0.000";

        await tx.insert(PurchaseOrderItems).values({
          uuid: generateUuid(),
          purchaseOrderUuid: orderUuid,
          productUuid,
          quantity,
          qtyPlanned: quantity,
          lineNumber: item.lineNumber ?? index + 1,
          unit: item.unit,
          kgPurchased: item.kg,
          lengthMm: item.lengthMm,
          widthMm: item.widthMm,
          thicknessMm: item.thicknessMm,
          qualityCode: item.qualityCode,
          stockCategory: item.stockCategory,
          netPrice: netPrice.toFixed(4),
          amount: (netPrice * Number(quantity)).toFixed(2),
        });
      }
    });

    // The supplier is told what we ordered, exactly as they are when the order
    // came the long way round through a quote.
    await mailDocument(
      () => sendPurchaseOrderEmail(orderUuid),
      `Purchase order ${orderUuid}`,
    );

    revalidatePath("/purchase-requests");
    revalidatePath(`/purchase-requests/${requestUuid}`);
    revalidatePath("/purchase-orders");
    return {
      success: true,
      purchaseRequestUuid: requestUuid,
      purchaseOrderUuid: orderUuid,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to turn this request into a purchase order",
    };
  }
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
